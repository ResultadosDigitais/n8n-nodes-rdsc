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
		if (Array.isArray(response.customers)) return response.customers as IDataObject[];
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

export async function executeContacts(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const operation = context.getNodeParameter('operation', itemIndex) as string;
	const baseUrl = await getRdConversasBaseUrl(context, itemIndex);

	if (operation === 'getAll') {
		const returnAll = context.getNodeParameter('returnAll', itemIndex, false) as boolean;
		const limit = context.getNodeParameter('limit', itemIndex, 50) as number;
		const pageSize = context.getNodeParameter('pageSize', itemIndex, 50) as number;
		const channels = context.getNodeParameter('channels', itemIndex, '') as string;

		const effectivePageSize = Math.max(1, Math.min(200, pageSize || 50));
		let page = 1;
		const results: IDataObject[] = [];

		while (true) {
			const qs: IDataObject = {
				page,
				limit: effectivePageSize,
			};

			if (hasString(channels)) qs.channels = channels.trim();

			const options: IHttpRequestOptions = {
				method: 'GET',
				url: `${baseUrl}/v2/customers`,
				qs,
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

	if (operation === 'getByPhone') {
		const celPhone = context.getNodeParameter('celPhone', itemIndex) as string;
		if (!hasString(celPhone)) {
			throw new NodeOperationError(context.getNode(), 'Phone number is required', { itemIndex });
		}

		const options: IHttpRequestOptions = {
			method: 'GET',
			url: `${baseUrl}/v2/contacts/cel_phone/${encodeURIComponent(celPhone.trim())}`,
			headers: { accept: 'application/json' },
		};

		const response = handleResponse(
			context,
			await rdConversasRequest(context, CREDENTIAL_NAME, options),
			itemIndex,
		);

		return extractItem(response);
	}

	if (operation === 'create' || operation === 'update') {
		const fullName = context.getNodeParameter('fullName', itemIndex) as string;
		const celPhone = context.getNodeParameter('celPhone', itemIndex) as string;
		const integration = context.getNodeParameter('integration', itemIndex) as string;

		if (!hasString(fullName)) {
			throw new NodeOperationError(context.getNode(), 'Full Name is required', { itemIndex });
		}
		if (!hasString(celPhone)) {
			throw new NodeOperationError(context.getNode(), 'Phone number is required', { itemIndex });
		}
		if (!hasString(integration)) {
			throw new NodeOperationError(context.getNode(), 'Integration is required', { itemIndex });
		}

		const body: IDataObject = {
			full_name: fullName.trim(),
			cel_phone: celPhone.trim(),
			integration: integration.trim(),
		};

		const options: IHttpRequestOptions = {
			method: operation === 'create' ? 'POST' : 'PUT',
			url: `${baseUrl}/v2/contacts/whatsapp-business-by-brokers`,
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

	throw new NodeOperationError(
		context.getNode(),
		`The operation "${operation}" is not supported for Contacts`,
		{ itemIndex },
	);
}
