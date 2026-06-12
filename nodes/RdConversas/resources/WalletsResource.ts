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
		if (Array.isArray(response.wallets)) return response.wallets as IDataObject[];
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

export async function executeWallets(
	context: IExecuteFunctions,
	itemIndex: number,
	operation: string,
): Promise<IDataObject | IDataObject[]> {
	const baseUrl = await getRdConversasBaseUrl(context, itemIndex);

	if (operation === 'getAll') {
		const returnAll = context.getNodeParameter('returnAll', itemIndex, false) as boolean;
		const limit = context.getNodeParameter('limit', itemIndex, 50) as number;

		const options: IHttpRequestOptions = {
			method: 'GET',
			url: `${baseUrl}/v2/wallets`,
			headers: { accept: 'application/json' },
		};

		const response = handleResponse(
			context,
			await rdConversasRequest(context, CREDENTIAL_NAME, options),
			itemIndex,
		);

		const items = extractItems(response);
		return returnAll ? items : items.slice(0, Math.max(1, limit));
	}

	if (operation === 'addContact') {
		const walletName = context.getNodeParameter('walletName', itemIndex) as string;
		const contactId = context.getNodeParameter('contactId', itemIndex) as string;

		if (!hasString(walletName)) {
			throw new NodeOperationError(context.getNode(), 'Wallet Name is required', { itemIndex });
		}
		if (!hasString(contactId)) {
			throw new NodeOperationError(context.getNode(), 'Contact ID is required', { itemIndex });
		}

		const options: IHttpRequestOptions = {
			method: 'POST',
			url: `${baseUrl}/v2/wallets/${encodeURIComponent(walletName.trim())}/contacts`,
			headers: {
				accept: 'application/json',
				'content-type': 'application/json',
			},
			body: {
				contact: contactId.trim(),
			},
		};

		const response = handleResponse(
			context,
			await rdConversasRequest(context, CREDENTIAL_NAME, options),
			itemIndex,
		);

		return extractItem(response);
	}

	if (operation === 'deleteContact') {
		const walletName = context.getNodeParameter('walletName', itemIndex) as string;
		const contactId = context.getNodeParameter('contactId', itemIndex) as string;

		if (!hasString(walletName)) {
			throw new NodeOperationError(context.getNode(), 'Wallet Name is required', { itemIndex });
		}
		if (!hasString(contactId)) {
			throw new NodeOperationError(context.getNode(), 'Contact ID is required', { itemIndex });
		}

		const options: IHttpRequestOptions = {
			method: 'DELETE',
			url: `${baseUrl}/v2/wallets/${encodeURIComponent(walletName.trim())}/contacts/${encodeURIComponent(contactId.trim())}`,
			headers: { accept: 'application/json' },
		};

		const response = handleResponse(
			context,
			await rdConversasRequest(context, CREDENTIAL_NAME, options),
			itemIndex,
		);

		if (isObject(response) && Object.keys(response).length === 0) {
			return { wallet_name: walletName.trim(), contact_id: contactId.trim(), deleted: true };
		}

		return extractItem(response);
	}

	throw new NodeOperationError(context.getNode(), `Unknown operation: ${operation}`, { itemIndex });
}
