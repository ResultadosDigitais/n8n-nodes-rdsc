import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import * as descriptions from './descriptions';
import * as resources from './resources';

type RdConversasResource =
	| 'messages'
	| 'contacts'
	| 'employees'
	| 'wallets'
	| 'templates'
	| 'campaigns'
	| 'metadata';

export class RdConversas implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'RD Station Conversas',
		name: 'rdConversas',
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
				name: 'rdConversasApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				default: 'messages',
				options: [
					{ name: 'Campaign', value: 'campaigns' },
					{ name: 'Contact', value: 'contacts' },
					{ name: 'Employee', value: 'employees' },
					{ name: 'Message', value: 'messages' },
					{ name: 'Metadata (Config)', value: 'metadata' },
					{ name: 'Template', value: 'templates' },
					{ name: 'Wallet', value: 'wallets' },
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['messages'] } },
				default: 'send',
				options: [
					{ name: 'Get History', value: 'getHistory', action: 'Get message history' },
					{ name: 'Send', value: 'send', action: 'Send a message' },
					{ name: 'Send Template', value: 'sendTemplate', action: 'Send a template message' },
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['contacts'] } },
				default: 'getAll',
				options: [
					{ name: 'Create', value: 'create', action: 'Create a WhatsApp contact' },
					{ name: 'Get Many', value: 'getAll', action: 'List contacts' },
					{ name: 'Get by Phone', value: 'getByPhone', action: 'Get a contact by phone' },
					{ name: 'Update', value: 'update', action: 'Update a WhatsApp contact' },
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['employees'] } },
				default: 'getAll',
				options: [
					{ name: 'Get', value: 'get', action: 'Get an employee' },
					{ name: 'Get Many', value: 'getAll', action: 'List employees' },
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['wallets'] } },
				default: 'getAll',
				options: [
					{ name: 'Add Contact', value: 'addContact', action: 'Add a contact to a wallet' },
					{ name: 'Delete Contact', value: 'deleteContact', action: 'Delete a contact from a wallet' },
					{ name: 'Get Many', value: 'getAll', action: 'List wallets' },
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['templates'] } },
				default: 'getAll',
				options: [{ name: 'Get Many', value: 'getAll', action: 'List templates' }],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['campaigns'] } },
				default: 'getAll',
				options: [
					{ name: 'Get', value: 'get', action: 'Get a campaign' },
					{ name: 'Get Many', value: 'getAll', action: 'List campaigns' },
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['metadata'] } },
				default: 'listFlows',
				options: [
					{ name: 'Get Job', value: 'getJob', action: 'Get async job status' },
					{ name: 'List Flows', value: 'listFlows', action: 'List flows' },
					{ name: 'List WhatsApp Integrations', value: 'listWhatsappIntegrations', action: 'List WhatsApp integrations' },
					{ name: 'List Workflows', value: 'listWorkflows', action: 'List workflows' },
				],
			},
			...descriptions.messagesDescription,
			...descriptions.contactsDescription,
			...descriptions.employeesDescription,
			...descriptions.walletsDescription,
			...descriptions.templatesDescription,
			...descriptions.campaignsDescription,
			...descriptions.metadataDescription,
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as RdConversasResource;
				const operation = this.getNodeParameter('operation', i) as string;
				let result: IDataObject | IDataObject[] | undefined;

				if (resource === 'messages') {
					result = await resources.executeMessages(this, i, operation);
				} else if (resource === 'contacts') {
					result = await resources.executeContacts(this, i);
				} else if (resource === 'employees') {
					result = await resources.executeEmployees(this, i);
				} else if (resource === 'wallets') {
					result = await resources.executeWallets(this, i, operation);
				} else if (resource === 'templates') {
					result = await resources.executeTemplates(this, i);
				} else if (resource === 'campaigns') {
					result = await resources.executeCampaigns(this, i);
				} else if (resource === 'metadata') {
					result = await resources.executeMetadata(this, i, operation);
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
					returnData.push({ error: (error as Error).message, itemIndex: i });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
