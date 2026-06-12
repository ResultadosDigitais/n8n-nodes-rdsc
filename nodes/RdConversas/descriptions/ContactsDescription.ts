import type { INodeProperties } from 'n8n-workflow';

export const contactsDescription: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: { resource: ['contacts'], operation: ['getAll'] },
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
			show: { resource: ['contacts'], operation: ['getAll'], returnAll: [false] },
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Page Size',
		name: 'pageSize',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 200 },
		default: 50,
		displayOptions: {
			show: { resource: ['contacts'], operation: ['getAll'] },
		},
		description: 'Number of records fetched per request (page/limit pagination)',
	},
	{
		displayName: 'Channels',
		name: 'channels',
		type: 'string',
		default: '',
		displayOptions: {
			show: { resource: ['contacts'], operation: ['getAll'] },
		},
		description: 'Optional channels filter passed as query parameter',
	},
	{
		displayName: 'Phone Number',
		name: 'celPhone',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['contacts'], operation: ['getByPhone', 'create', 'update'] },
		},
		description: 'Contact mobile phone number (cel_phone)',
	},
	{
		displayName: 'Full Name',
		name: 'fullName',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['contacts'], operation: ['create', 'update'] },
		},
		description: 'Contact full name',
	},
	{
		displayName: 'Integration',
		name: 'integration',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['contacts'], operation: ['create', 'update'] },
		},
		description: 'WhatsApp Business integration identifier',
	},
];
