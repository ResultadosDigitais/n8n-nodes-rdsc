import type { IDataObject, IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getRdConversasApiRootUrl, rdConversasRequest } from '../Helpers';

type RequestInput = Omit<IHttpRequestOptions, 'url'>;

function isObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toOutput(response: unknown): IDataObject | IDataObject[] {
	if (Array.isArray(response)) return response as IDataObject[];
	if (isObject(response)) return response;
	return {
		data: response ?? null,
	};
}

function assertNonEmpty(value: string, label: string, context: IExecuteFunctions, itemIndex: number): string {
	const normalizedValue = String(value ?? '').trim();
	if (!normalizedValue) {
		throw new NodeOperationError(context.getNode(), `${label} is required`, { itemIndex });
	}
	return normalizedValue;
}

function formatDateOnly(value: string, context: IExecuteFunctions, itemIndex: number, label: string): string {
	const raw = assertNonEmpty(value, label, context, itemIndex);
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
			...(options.headers ?? {}),
		},
	};
}

function applyStringQuery(qs: IDataObject, fields: IDataObject, sourceName: string, targetName: string): void {
	const value = fields[sourceName];
	if (value === undefined || value === null) return;

	const normalizedValue = String(value).trim();
	if (normalizedValue) qs[targetName] = normalizedValue;
}

function applyIntegerQuery(
	qs: IDataObject,
	fields: IDataObject,
	sourceName: string,
	targetName: string,
	context: IExecuteFunctions,
	itemIndex: number,
	minValue: number,
): void {
	const value = fields[sourceName];
	if (value === undefined || value === null || value === '') return;

	const numericValue = Number(value);
	if (!Number.isInteger(numericValue) || numericValue < minValue) {
		throw new NodeOperationError(context.getNode(), `${targetName} must be an integer >= ${minValue}`, {
			itemIndex,
		});
	}

	qs[targetName] = numericValue;
}

export async function executeReports(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const operation = context.getNodeParameter('operation', itemIndex) as string;

	if (operation !== 'getAll') {
		throw new NodeOperationError(context.getNode(), `Unsupported report operation: ${operation}`, {
			itemIndex,
		});
	}

	const baseUrl = await getRdConversasApiRootUrl(context, itemIndex);
	const additionalFields = context.getNodeParameter('reportAdditionalFields', itemIndex, {}) as IDataObject;
	const qs: IDataObject = {
		start_date: formatDateOnly(
			context.getNodeParameter('reportStartDate', itemIndex) as string,
			context,
			itemIndex,
			'Start Date',
		),
		end_date: formatDateOnly(
			context.getNodeParameter('reportEndDate', itemIndex) as string,
			context,
			itemIndex,
			'End Date',
		),
	};

	applyIntegerQuery(qs, additionalFields, 'page', 'page', context, itemIndex, 1);
	applyIntegerQuery(qs, additionalFields, 'limit', 'limit', context, itemIndex, 1);
	applyIntegerQuery(qs, additionalFields, 'take', 'take', context, itemIndex, 1);
	applyIntegerQuery(qs, additionalFields, 'skip', 'skip', context, itemIndex, 0);
	applyStringQuery(qs, additionalFields, 'department', 'department');
	applyStringQuery(qs, additionalFields, 'channel', 'channel');
	applyStringQuery(qs, additionalFields, 'employee', 'employee');
	applyStringQuery(qs, additionalFields, 'tabulation', 'tabulation');
	applyStringQuery(qs, additionalFields, 'status', 'status');
	applyStringQuery(qs, additionalFields, 'type', 'type');

	const response = await rdConversasRequest(context, buildRequest(baseUrl, '/v4/reports', {
		method: 'GET',
		qs,
	}), itemIndex);

	return toOutput(response);
}
