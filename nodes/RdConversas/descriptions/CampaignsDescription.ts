import type { INodeProperties } from 'n8n-workflow';

export const campaignsDescription: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: { resource: ['webhooks'], operation: ['getAll'] },
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
			show: { resource: ['webhooks'], operation: ['getAll'], returnAll: [false] },
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Page Size',
		name: 'pageSize',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 200 },
		default: 25,
		displayOptions: {
			show: { resource: ['webhooks'], operation: ['getAll'] },
		},
		description: 'Number of records fetched per request',
	},
	{
		displayName: 'Campaign ID',
		name: 'campaignId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['webhooks'], operation: ['get'] },
		},
		description: 'Campaign identifier',
	},
];
