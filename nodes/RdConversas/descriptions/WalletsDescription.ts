import type { INodeProperties } from 'n8n-workflow';

export const walletsDescription: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: { resource: ['tasks'], operation: ['getAll'] },
		},
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 50,
		displayOptions: {
			show: { resource: ['tasks'], operation: ['getAll'], returnAll: [false] },
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Wallet Name',
		name: 'walletName',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['tasks'], operation: ['addContact', 'deleteContact'] },
		},
		description: 'Name of the wallet',
	},
	{
		displayName: 'Contact ID',
		name: 'contactId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['tasks'], operation: ['addContact', 'deleteContact'] },
		},
		description: 'Contact ID to add or remove from the wallet',
	},
];
