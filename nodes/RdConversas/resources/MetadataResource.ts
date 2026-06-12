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

function extractItems(response: unknown, responseKey?: string): IDataObject[] {
	if (Array.isArray(response)) return response as IDataObject[];
	if (isObject(response)) {
		if (responseKey && Array.isArray(response[responseKey])) {
			return response[responseKey] as IDataObject[];
		}
		if (Array.isArray(response.data)) return response.data as IDataObject[];
	}
	return isObject(response) ? [response] : [];
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

async function listMetadata(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
	endpoint: string,
	responseKey?: string,
): Promise<IDataObject[]> {
	const returnAll = context.getNodeParameter('returnAll', itemIndex, true) as boolean;
	const limit = context.getNodeParameter('limit', itemIndex, 50) as number;

	const options: IHttpRequestOptions = {
		method: 'GET',
		url: `${baseUrl}${endpoint}`,
		headers: { accept: 'application/json' },
	};

	const response = handleResponse(
		context,
		await rdConversasRequest(context, CREDENTIAL_NAME, options),
		itemIndex,
	);

	const items = extractItems(response, responseKey);
	return returnAll ? items : items.slice(0, Math.max(1, limit));
}

export async function executeMetadata(
	context: IExecuteFunctions,
	itemIndex: number,
	operation: string,
): Promise<IDataObject | IDataObject[]> {
	const baseUrl = await getRdConversasBaseUrl(context, itemIndex);

	if (operation === 'listFlows') {
		return listMetadata(context, itemIndex, baseUrl, '/v2/flows', 'flows');
	}

	if (operation === 'listWorkflows') {
		return listMetadata(context, itemIndex, baseUrl, '/v2/workflows', 'workflows');
	}

	if (operation === 'listWhatsappIntegrations') {
		return listMetadata(context, itemIndex, baseUrl, '/v2/whatsapp/integrations', 'integrations');
	}

	if (operation === 'getJob') {
		const jobId = context.getNodeParameter('jobId', itemIndex) as string;
		if (!hasString(jobId)) {
			throw new NodeOperationError(context.getNode(), 'Job ID is required', { itemIndex });
		}

		const options: IHttpRequestOptions = {
			method: 'GET',
			url: `${baseUrl}/v2/jobs/${encodeURIComponent(jobId.trim())}`,
			headers: { accept: 'application/json' },
		};

		const response = handleResponse(
			context,
			await rdConversasRequest(context, CREDENTIAL_NAME, options),
			itemIndex,
		);

		return extractItem(response);
	}

	throw new NodeOperationError(context.getNode(), `Unknown operation: ${operation}`, { itemIndex });
}
