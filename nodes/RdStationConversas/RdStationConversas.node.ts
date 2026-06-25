import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import {
	analyticsDescription,
	contactsDescription,
	messagesDescription,
	reportsDescription,
} from './descriptions';
import {
	executeAnalytics,
	executeContacts,
	executeMessages,
	executeReports,
} from './resources';

type RdStationConversasResource = 'analytics' | 'contact' | 'message' | 'report';

type ErrorWithDetails = Error & {
	context?: IDataObject;
	description?: string | null;
	errorResponse?: IDataObject;
	httpCode?: string | null;
};

function isDataObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function copyDefinedField(target: IDataObject, source: IDataObject, sourceName: string, targetName = sourceName): void {
	const value = source[sourceName];
	if (value !== undefined && value !== null) {
		target[targetName] = value;
	}
}

export function formatContinueOnFailError(error: unknown, itemIndex: number): IDataObject {
	const normalizedError = error as Partial<ErrorWithDetails>;
	const output: IDataObject = {
		error: normalizedError.message ?? String(error),
		itemIndex,
	};

	if (normalizedError.description) {
		output.description = normalizedError.description;
	}

	if (normalizedError.httpCode) {
		output.httpCode = normalizedError.httpCode;
		const statusCode = Number(normalizedError.httpCode);
		if (Number.isInteger(statusCode)) {
			output.statusCode = statusCode;
		}
	}

	const errorResponse = normalizedError.errorResponse;
	if (isDataObject(errorResponse)) {
		copyDefinedField(output, errorResponse, 'statusCode');
		copyDefinedField(output, errorResponse, 'requestUrl');
		copyDefinedField(output, errorResponse, 'responseBody');
	}

	const context = normalizedError.context;
	if (isDataObject(context) && output.responseBody === undefined) {
		copyDefinedField(output, context, 'data', 'responseBody');
	}

	return output;
}

export class RdStationConversas implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'RD Station Conversas',
		name: 'rdStationConversas',
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description: 'Interact with RD Station Conversas',
		icon: 'file:rdstation.svg',
		defaults: {
			name: 'RD Station Conversas',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'rdStationConversasApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				default: 'contact',
				options: [
					{
						name: 'Analytics',
						value: 'analytics',
					},
					{
						name: 'Contact',
						value: 'contact',
					},
					{
						name: 'Message',
						value: 'message',
					},
					{
						name: 'Report',
						value: 'report',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['analytics'],
					},
				},
				default: 'getAttendanceRetention',
				options: [
					{
						name: 'Get Attendance Reviews Average',
						value: 'getAttendanceReviewsAverage',
						action: 'Get attendance reviews average',
					},
					{
						name: 'Get Attendance Retention',
						value: 'getAttendanceRetention',
						action: 'Get attendance retention',
					},
					{
						name: 'Get Attendance Summary',
						value: 'getAttendanceSummary',
						action: 'Get attendance summary',
					},
					{
						name: 'Get Contacts Origin',
						value: 'getContactsOrigin',
						action: 'Get contacts origin',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['contact'],
					},
				},
				default: 'getAll',
				options: [
					{
						name: 'Create Many',
						value: 'createMany',
						action: 'Create many contacts',
					},
					{
						name: 'Create WhatsApp Business Contact',
						value: 'createByBroker',
						action: 'Create a contact by broker',
					},
					{
						name: 'Delete From Wallet',
						value: 'deleteFromWallet',
						action: 'Delete contacts from a wallet',
					},
					{
						name: 'Delete Many',
						value: 'deleteMany',
						action: 'Delete many contacts',
					},
					{
						name: 'Get by CPF',
						value: 'getByCpf',
						action: 'Get a contact by CPF',
					},
					{
						name: 'Get by Phone',
						value: 'getByPhone',
						action: 'Get a contact by phone',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many contacts',
					},
					{
						name: 'Update by Phone',
						value: 'updateByPhone',
						action: 'Update a contact by phone',
					},
					{
						name: 'Update WhatsApp Business Contact',
						value: 'updateByBroker',
						action: 'Update a contact by broker',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['message'],
					},
				},
				default: 'getHistory',
				options: [
					{
						name: 'Forward to Contact',
						value: 'forwardToCustomer',
						action: 'Forward to a contact',
					},
					{
						name: 'Get History',
						value: 'getHistory',
						action: 'Get conversation history',
					},
					{
						name: 'Send',
						value: 'send',
						action: 'Send a message',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['report'],
					},
				},
				default: 'getAll',
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many reports',
					},
				],
			},
			...analyticsDescription,
			...contactsDescription,
			...messagesDescription,
			...reportsDescription,
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as RdStationConversasResource;
				let result: IDataObject | IDataObject[] | undefined;

				if (resource === 'analytics') {
					result = await executeAnalytics(this, i);
				} else if (resource === 'contact') {
					result = await executeContacts(this, i);
				} else if (resource === 'message') {
					result = await executeMessages(this, i);
				} else if (resource === 'report') {
					result = await executeReports(this, i);
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, { itemIndex: i });
				}

				if (Array.isArray(result)) {
					for (const entry of result) returnData.push(entry);
				} else if (result) {
					returnData.push(result);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push(formatContinueOnFailError(error, i));
					continue;
				}
				if (error instanceof NodeApiError || error instanceof NodeOperationError) {
					throw error;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
