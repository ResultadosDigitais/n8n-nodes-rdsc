import type { IDataObject, IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { decryptRdConversasPayload, getRdConversasBaseUrl, rdConversasRequest } from '../Helpers';

type RequestInput = Omit<IHttpRequestOptions, 'url'>;

function isObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertNonEmpty(value: string, label: string, context: IExecuteFunctions, itemIndex: number): string {
	const normalizedValue = String(value ?? '').trim();
	if (!normalizedValue) {
		throw new NodeOperationError(context.getNode(), `${label} is required`, { itemIndex });
	}
	return normalizedValue;
}

function getPositiveInteger(
	context: IExecuteFunctions,
	itemIndex: number,
	parameterName: string,
	label: string,
): number {
	const value = context.getNodeParameter(parameterName, itemIndex) as number;
	if (!Number.isInteger(value) || value < 1) {
		throw new NodeOperationError(context.getNode(), `${label} must be a positive integer`, { itemIndex });
	}
	return value;
}

function formatDateOnly(value: string, context: IExecuteFunctions, itemIndex: number, label: string): string {
	const raw = String(value ?? '').trim();
	if (!raw) return '';
	if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
	if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw.slice(0, 10);

	const parsed = new Date(raw);
	if (Number.isNaN(parsed.getTime())) {
		throw new NodeOperationError(context.getNode(), `${label} must be a valid date`, { itemIndex });
	}
	return parsed.toISOString().slice(0, 10);
}

function buildRequest(baseUrl: string, path: string, options: RequestInput): IHttpRequestOptions {
	return {
		...options,
		url: `${baseUrl}${path}`,
		headers: {
			accept: 'application/json',
			...(options.body ? { 'content-type': 'application/json' } : {}),
			...(options.headers ?? {}),
		},
	};
}

function buildFormBody(values: IDataObject): URLSearchParams {
	const formBody = new URLSearchParams();
	for (const [key, value] of Object.entries(values)) {
		if (value === undefined || value === null || value === '') continue;
		formBody.append(key, String(value));
	}
	return formBody;
}

function applyStringArrayQuery(qs: IDataObject, name: string, values: string[]): void {
	const normalizedValues = values
		.map((value) => String(value ?? '').trim())
		.filter((value) => value !== '');

	if (normalizedValues.length > 0) {
		qs[name] = normalizedValues.join(',');
	}
}

function toOutput(response: unknown): IDataObject | IDataObject[] {
	if (Array.isArray(response)) return response as IDataObject[];
	if (isObject(response)) return response;
	return {
		data: response ?? null,
	};
}

export async function executeMessages(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const operation = context.getNodeParameter('operation', itemIndex) as string;
	const baseUrl = await getRdConversasBaseUrl(context, itemIndex);

	if (operation === 'forwardToCustomer') {
		const body: IDataObject = {
			customer: assertNonEmpty(
				context.getNodeParameter('customerId', itemIndex) as string,
				'Customer ID',
				context,
				itemIndex,
			),
			flow: assertNonEmpty(
				context.getNodeParameter('flowId', itemIndex) as string,
				'Flow ID',
				context,
				itemIndex,
			),
		};

		const response = await rdConversasRequest(context, buildRequest(baseUrl, '/forward-to-customer', {
			method: 'POST',
			body,
		}), itemIndex);

		return toOutput(response);
	}

	if (operation === 'send') {
		const contactId = encodeURIComponent(assertNonEmpty(
			context.getNodeParameter('contactId', itemIndex) as string,
			'Contact ID',
			context,
			itemIndex,
		));
		const additionalFields = context.getNodeParameter('sendAdditionalFields', itemIndex, {}) as IDataObject;
		const body = buildFormBody({
			message: assertNonEmpty(
				context.getNodeParameter('message', itemIndex) as string,
				'Message',
				context,
				itemIndex,
			),
			sent_by: context.getNodeParameter('sendSentBy', itemIndex) as string,
			integration: additionalFields.integration,
			operator: additionalFields.operator,
		});

		const response = await rdConversasRequest(context, buildRequest(baseUrl, `/messages/${contactId}/send`, {
			method: 'POST',
			body,
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
			},
		}), itemIndex);

		return toOutput(response);
	}

	if (operation === 'getHistory') {
		const customerId = assertNonEmpty(
			context.getNodeParameter('customerId', itemIndex) as string,
			'Customer ID',
			context,
			itemIndex,
		);
		const limit = getPositiveInteger(context, itemIndex, 'limit', 'Limit');
		const page = getPositiveInteger(context, itemIndex, 'page', 'Page');
		const decryptMessages = context.getNodeParameter('decryptMessages', itemIndex) as boolean;
		const qs: IDataObject = {
			customer_id: customerId,
			limit,
			page,
		};

		applyStringArrayQuery(qs, 'channel', context.getNodeParameter('messageChannels', itemIndex, []) as string[]);
		applyStringArrayQuery(qs, 'sent_by', context.getNodeParameter('sentBy', itemIndex, []) as string[]);
		applyStringArrayQuery(qs, 'type', context.getNodeParameter('messageTypes', itemIndex, []) as string[]);

		const startDate = formatDateOnly(
			context.getNodeParameter('startDate', itemIndex, '') as string,
			context,
			itemIndex,
			'Start Date',
		);
		const endDate = formatDateOnly(
			context.getNodeParameter('endDate', itemIndex, '') as string,
			context,
			itemIndex,
			'End Date',
		);

		if (startDate) qs.start_date = startDate;
		if (endDate) qs.end_date = endDate;

		const response = await rdConversasRequest<IDataObject>(context, buildRequest(baseUrl, '/messages/history', {
			method: 'GET',
			qs,
		}), itemIndex);

		if (decryptMessages && typeof response.messages === 'string') {
			return {
				...response,
				messages: await decryptRdConversasPayload(context, itemIndex, response.messages),
			};
		}

		return toOutput(response);
	}

	throw new NodeOperationError(context.getNode(), `Unsupported message operation: ${operation}`, { itemIndex });
}
