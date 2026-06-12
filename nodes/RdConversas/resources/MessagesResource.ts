import type { IDataObject, IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getRdConversasBaseUrl, rdConversasRequest } from '../Helpers';

const CREDENTIAL_NAME = 'rdConversasApi';

function isObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasString(value: unknown): value is string {
	return typeof value === 'string' && value.trim() !== '';
}

function extractItems(response: unknown): IDataObject[] {
	if (Array.isArray(response)) return response as IDataObject[];
	if (isObject(response)) {
		if (Array.isArray(response.data)) return response.data as IDataObject[];
		if (Array.isArray(response.messages)) return response.messages as IDataObject[];
		if (Array.isArray(response.history)) return response.history as IDataObject[];
	}
	return [];
}

function extractItem(response: unknown): IDataObject {
	if (isObject(response)) {
		if (isObject(response.data)) return response.data as IDataObject;
		if (!Array.isArray(response)) return response;
	}
	return {};
}

function throwOnError(context: IExecuteFunctions, response: IDataObject, itemIndex: number): void {
	const description =
		typeof response.responseBody === 'string'
			? response.responseBody
			: response.responseBody
				? JSON.stringify(response.responseBody)
				: undefined;

	throw new NodeOperationError(
		context.getNode(),
		String(response.message ?? 'Request failed'),
		{ itemIndex, description },
	);
}

function handleResponse(
	context: IExecuteFunctions,
	response: IDataObject | IDataObject[],
	itemIndex: number,
): IDataObject | IDataObject[] {
	if (Array.isArray(response)) return response;

	if (isObject(response) && response._error_debug) {
		if (context.continueOnFail()) return response;
		throwOnError(context, response, itemIndex);
	}

	return response;
}

export async function executeMessages(
	context: IExecuteFunctions,
	itemIndex: number,
	operation: string,
): Promise<IDataObject | IDataObject[]> {
	const baseUrl = await getRdConversasBaseUrl(context, itemIndex);

	if (operation === 'send') {
		const contactId = context.getNodeParameter('contactId', itemIndex) as string;
		const message = context.getNodeParameter('message', itemIndex) as string;
		const sentBy = context.getNodeParameter('sentBy', itemIndex) as string;
		const integration = context.getNodeParameter('integration', itemIndex) as string;
		const operator = context.getNodeParameter('operator', itemIndex, '') as string;

		if (!hasString(contactId)) {
			throw new NodeOperationError(context.getNode(), 'Contact ID is required', { itemIndex });
		}
		if (!hasString(message)) {
			throw new NodeOperationError(context.getNode(), 'Message is required', { itemIndex });
		}
		if (!hasString(sentBy)) {
			throw new NodeOperationError(context.getNode(), 'Sent By is required', { itemIndex });
		}
		if (!hasString(integration)) {
			throw new NodeOperationError(context.getNode(), 'Integration is required', { itemIndex });
		}

		const body: IDataObject = {
			message: message.trim(),
			sent_by: sentBy.trim(),
			integration: integration.trim(),
		};

		if (hasString(operator)) body.operator = operator.trim();

		const options: IHttpRequestOptions = {
			method: 'POST',
			url: `${baseUrl}/v2/messages/${encodeURIComponent(contactId.trim())}/send`,
			headers: {
				accept: 'application/json',
				'content-type': 'application/x-www-form-urlencoded',
			},
			body,
		};

		const response = handleResponse(
			context,
			await rdConversasRequest(context, CREDENTIAL_NAME, options),
			itemIndex,
		);

		return extractItem(response);
	}

	if (operation === 'sendTemplate') {
		const recipientNumber = context.getNodeParameter('recipientNumber', itemIndex) as string;
		const templateMessageId = context.getNodeParameter('templateMessageId', itemIndex) as string;
		const sentBy = context.getNodeParameter('sentBy', itemIndex) as string;
		const countryCode = context.getNodeParameter('countryCode', itemIndex, '55') as string;
		const operatorId = context.getNodeParameter('operatorId', itemIndex, '') as string;
		const variables = context.getNodeParameter('variables', itemIndex, {}) as IDataObject;

		if (!hasString(recipientNumber)) {
			throw new NodeOperationError(context.getNode(), 'Recipient Number is required', { itemIndex });
		}
		if (!hasString(templateMessageId)) {
			throw new NodeOperationError(context.getNode(), 'Template Message ID is required', { itemIndex });
		}
		if (!hasString(sentBy)) {
			throw new NodeOperationError(context.getNode(), 'Sent By is required', { itemIndex });
		}

		const body: IDataObject = {
			recipient_number: recipientNumber.trim(),
			template_message_id: templateMessageId.trim(),
			sent_by: sentBy.trim(),
			country_code: countryCode.trim(),
		};

		if (hasString(operatorId)) body.operator_id = operatorId.trim();
		if (Object.keys(variables).length > 0) body.variables = variables;

		const options: IHttpRequestOptions = {
			method: 'POST',
			url: `${baseUrl}/v3/messages/template/send`,
			headers: {
				accept: 'application/json',
				'content-type': 'application/json',
			},
			body,
		};

		const response = handleResponse(
			context,
			await rdConversasRequest(context, CREDENTIAL_NAME, options),
			itemIndex,
		);

		return extractItem(response);
	}

	if (operation === 'getHistory') {
		const returnAll = context.getNodeParameter('returnAll', itemIndex, false) as boolean;
		const limit = context.getNodeParameter('limit', itemIndex, 50) as number;
		const pageSize = context.getNodeParameter('pageSize', itemIndex, 50) as number;

		const effectivePageSize = Math.max(1, Math.min(200, pageSize || 50));
		let page = 1;
		const results: IDataObject[] = [];

		while (true) {
			const options: IHttpRequestOptions = {
				method: 'GET',
				url: `${baseUrl}/v2/messages/history`,
				qs: {
					page,
					limit: effectivePageSize,
				},
				headers: { accept: 'application/json' },
			};

			const response = handleResponse(
				context,
				await rdConversasRequest(context, CREDENTIAL_NAME, options),
				itemIndex,
			);

			const pageData = extractItems(response);
			if (pageData.length === 0) break;

			if (returnAll) {
				results.push(...pageData);
			} else {
				const remaining = Math.max(0, limit - results.length);
				results.push(...pageData.slice(0, remaining));
			}

			if (!returnAll && results.length >= limit) break;
			if (pageData.length < effectivePageSize) break;

			page += 1;
		}

		return results;
	}

	throw new NodeOperationError(context.getNode(), `Unsupported operation: ${operation}`, { itemIndex });
}
