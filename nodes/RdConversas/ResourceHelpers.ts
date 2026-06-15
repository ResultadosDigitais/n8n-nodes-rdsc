import type { IDataObject, IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { rdConversasRequest } from './Helpers';

export const CREDENTIAL_NAME = 'rdConversasApi';

type SimpleListOptions = {
	context: IExecuteFunctions;
	itemIndex: number;
	url: string;
	returnAll: boolean;
	limit: number;
	listKeys: string[];
};

type PaginatedListOptions = SimpleListOptions & {
	pageSize: number;
	defaultPageSize: number;
	extraQs?: IDataObject;
};

export function isObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function hasString(value: unknown): value is string {
	return typeof value === 'string' && value.trim() !== '';
}

export function requireString(
	context: IExecuteFunctions,
	value: unknown,
	label: string,
	itemIndex: number,
): string {
	if (!hasString(value)) {
		throw new NodeOperationError(context.getNode(), `${label} is required`, { itemIndex });
	}
	return value.trim();
}

export function extractItems(response: unknown, listKeys: string[] = []): IDataObject[] {
	if (Array.isArray(response)) return response as IDataObject[];

	if (!isObject(response)) return [];

	if (Array.isArray(response.data)) return response.data as IDataObject[];

	for (const key of listKeys) {
		const value = response[key];
		if (Array.isArray(value)) return value as IDataObject[];
	}

	return [];
}

export function extractItem(response: unknown): IDataObject {
	if (!isObject(response)) return {};

	if (isObject(response.data)) return response.data as IDataObject;
	if (!Array.isArray(response)) return response;

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

export function handleResponse(
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

export async function conversasRequest(
	context: IExecuteFunctions,
	itemIndex: number,
	options: IHttpRequestOptions,
): Promise<IDataObject | IDataObject[]> {
	return handleResponse(
		context,
		await rdConversasRequest(context, CREDENTIAL_NAME, options),
		itemIndex,
	);
}

export function limitItems(items: IDataObject[], returnAll: boolean, limit: number): IDataObject[] {
	return returnAll ? items : items.slice(0, Math.max(1, limit));
}

export async function fetchSimpleList(options: SimpleListOptions): Promise<IDataObject[]> {
	const { context, itemIndex, url, returnAll, limit, listKeys } = options;

	const response = await conversasRequest(context, itemIndex, {
		method: 'GET',
		url,
		headers: { accept: 'application/json' },
	});

	return limitItems(extractItems(response, listKeys), returnAll, limit);
}

export async function fetchPaginatedList(options: PaginatedListOptions): Promise<IDataObject[]> {
	const {
		context,
		itemIndex,
		url,
		returnAll,
		limit,
		pageSize,
		defaultPageSize,
		listKeys,
		extraQs = {},
	} = options;

	const effectivePageSize = Math.max(1, Math.min(200, pageSize || defaultPageSize));
	let page = 1;
	const results: IDataObject[] = [];

	while (true) {
		const response = await conversasRequest(context, itemIndex, {
			method: 'GET',
			url,
			qs: { ...extraQs, page, limit: effectivePageSize },
			headers: { accept: 'application/json' },
		});

		const pageData = extractItems(response, listKeys);
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

export async function fetchById(
	context: IExecuteFunctions,
	itemIndex: number,
	url: string,
): Promise<IDataObject> {
	const response = await conversasRequest(context, itemIndex, {
		method: 'GET',
		url,
		headers: { accept: 'application/json' },
	});

	return extractItem(response);
}

export function unsupportedOperation(
	context: IExecuteFunctions,
	resource: string,
	operation: string,
	itemIndex: number,
): never {
	throw new NodeOperationError(
		context.getNode(),
		`The operation "${operation}" is not supported for ${resource}`,
		{ itemIndex },
	);
}
