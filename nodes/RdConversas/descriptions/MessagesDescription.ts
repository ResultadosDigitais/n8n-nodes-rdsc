import type { INodeProperties } from 'n8n-workflow';

export const messagesDescription: INodeProperties[] = [
	{
		displayName: 'Contact ID',
		name: 'contactId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['deals'], operation: ['send'] },
		},
		description: 'Contact ID to send the message to',
	},
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['deals'], operation: ['send'] },
		},
		description: 'Text message content',
	},
	{
		displayName: 'Sent By',
		name: 'sentBy',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['deals'], operation: ['send', 'sendTemplate'] },
		},
		description: 'Identifier of who sent the message',
	},
	{
		displayName: 'Integration',
		name: 'integration',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['deals'], operation: ['send'] },
		},
		description: 'WhatsApp Business integration identifier',
	},
	{
		displayName: 'Operator',
		name: 'operator',
		type: 'string',
		default: '',
		displayOptions: {
			show: { resource: ['deals'], operation: ['send'] },
		},
		description: 'Optional operator identifier',
	},
	{
		displayName: 'Recipient Number',
		name: 'recipientNumber',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['deals'], operation: ['sendTemplate'] },
		},
		description: 'Recipient phone number for the template message',
	},
	{
		displayName: 'Template Message ID',
		name: 'templateMessageId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['deals'], operation: ['sendTemplate'] },
		},
		description: 'ID of the template message to send',
	},
	{
		displayName: 'Country Code',
		name: 'countryCode',
		type: 'string',
		default: '55',
		displayOptions: {
			show: { resource: ['deals'], operation: ['sendTemplate'] },
		},
		description: 'Country code for the recipient number',
	},
	{
		displayName: 'Operator ID',
		name: 'operatorId',
		type: 'string',
		default: '',
		displayOptions: {
			show: { resource: ['deals'], operation: ['sendTemplate'] },
		},
		description: 'Optional operator ID',
	},
	{
		displayName: 'Variables',
		name: 'variables',
		type: 'json',
		default: {},
		displayOptions: {
			show: { resource: ['deals'], operation: ['sendTemplate'] },
		},
		description: 'Template variable key/value pairs as JSON object',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: { resource: ['deals'], operation: ['getHistory'] },
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
			show: { resource: ['deals'], operation: ['getHistory'], returnAll: [false] },
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
			show: { resource: ['deals'], operation: ['getHistory'] },
		},
		description: 'Number of records fetched per request',
	},
];
