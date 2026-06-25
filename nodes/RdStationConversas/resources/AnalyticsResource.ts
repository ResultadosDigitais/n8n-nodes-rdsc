import type { IDataObject, IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getRdConversasApiRootUrl, rdConversasRequest } from '../Helpers';

type RequestInput = Omit<IHttpRequestOptions, 'url'>;

const analyticsPaths: Record<string, string> = {
	getAttendanceRetention: '/v1/analytics/attendances/retention',
	getAttendanceReviewsAverage: '/v1/analytics/attendances/reviews/average',
	getAttendanceSummary: '/v1/analytics/attendances/summary',
	getContactsOrigin: '/v1/analytics/contacts/origin',
};

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

function normalizeCsv(value: unknown): string {
	return String(value ?? '')
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry !== '')
		.join(',');
}

export async function executeAnalytics(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const operation = context.getNodeParameter('operation', itemIndex) as string;
	const path = analyticsPaths[operation];

	if (!path) {
		throw new NodeOperationError(context.getNode(), `Unsupported analytics operation: ${operation}`, {
			itemIndex,
		});
	}

	const baseUrl = await getRdConversasApiRootUrl(context, itemIndex);
	const qs: IDataObject = {
		start_date: formatDateOnly(
			context.getNodeParameter('analyticsStartDate', itemIndex) as string,
			context,
			itemIndex,
			'Start Date',
		),
		end_date: formatDateOnly(
			context.getNodeParameter('analyticsEndDate', itemIndex) as string,
			context,
			itemIndex,
			'End Date',
		),
	};

	if (operation !== 'getContactsOrigin') {
		qs.timezone = assertNonEmpty(
			context.getNodeParameter('analyticsTimezone', itemIndex) as string,
			'Timezone',
			context,
			itemIndex,
		);
	}

	if (operation === 'getAttendanceReviewsAverage' || operation === 'getAttendanceSummary') {
		const departmentIds = normalizeCsv(context.getNodeParameter('analyticsDepartmentIds', itemIndex, ''));
		const employeeIds = normalizeCsv(context.getNodeParameter('analyticsEmployeeIds', itemIndex, ''));

		if (departmentIds) qs.department_ids = departmentIds;
		if (employeeIds) qs.employee_ids = employeeIds;
	}

	const response = await rdConversasRequest(context, buildRequest(baseUrl, path, {
		method: 'GET',
		qs,
	}), itemIndex);

	return toOutput(response);
}
