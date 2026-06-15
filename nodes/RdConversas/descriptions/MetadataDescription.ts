import type { INodeProperties } from 'n8n-workflow';

export const metadataDescription: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['metadata'],
				operation: ['listFlows', 'listWorkflows', 'listWhatsappIntegrations'],
			},
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
			show: {
				resource: ['metadata'],
				operation: ['listFlows', 'listWorkflows', 'listWhatsappIntegrations'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Job ID',
		name: 'jobId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['metadata'], operation: ['getJob'] },
		},
		description: 'Job identifier to retrieve status',
	},
];
