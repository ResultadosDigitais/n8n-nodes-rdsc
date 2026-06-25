import type { INodeProperties } from 'n8n-workflow';

const channelOptions = [
	{
		name: 'Email',
		value: 'email',
	},
	{
		name: 'Instagram',
		value: 'instagram',
	},
	{
		name: 'Megasac',
		value: 'megasac',
	},
	{
		name: 'Messenger',
		value: 'messenger',
	},
	{
		name: 'Telegram',
		value: 'telegram',
	},
	{
		name: 'WhatsApp',
		value: 'whatsapp',
	},
];

const sentByOptions = [
	{
		name: 'Bot',
		value: 'bot',
	},
	{
		name: 'Customer',
		value: 'customer',
	},
	{
		name: 'Operator',
		value: 'operator',
	},
];

const messageTypeOptions = [
	{
		name: 'Audio',
		value: 'audio',
	},
	{
		name: 'Contact',
		value: 'contact',
	},
	{
		name: 'Document',
		value: 'document',
	},
	{
		name: 'Image',
		value: 'image',
	},
	{
		name: 'Interactive',
		value: 'interactive',
	},
	{
		name: 'Location',
		value: 'location',
	},
	{
		name: 'Text',
		value: 'text',
	},
	{
		name: 'Video',
		value: 'video',
	},
];

export const messagesDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['forwardToCustomer', 'getHistory'],
			},
		},
		description: 'ID of the contact/customer',
	},
	{
		displayName: 'Flow ID',
		name: 'flowId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['forwardToCustomer'],
			},
		},
		description: 'ID of the destination flow',
	},
	{
		displayName: 'Contact ID',
		name: 'contactId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send'],
			},
		},
		description: 'ID of the contact to send the message to',
	},
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send'],
			},
		},
		description: 'Message to send to the contact',
	},
	{
		displayName: 'Sent By',
		name: 'sendSentBy',
		type: 'options',
		default: 'bot',
		options: [
			{
				name: 'Bot',
				value: 'bot',
			},
			{
				name: 'Operator',
				value: 'operator',
			},
		],
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send'],
			},
		},
		description: 'Who is sending the message',
	},
	{
		displayName: 'Additional Fields',
		name: 'sendAdditionalFields',
		type: 'collection',
		default: {},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['send'],
			},
		},
		options: [
			{
				displayName: 'Integration',
				name: 'integration',
				type: 'string',
				default: '',
				description: 'Integration chip used to send the message',
			},
			{
				displayName: 'Operator',
				name: 'operator',
				type: 'string',
				default: '',
				description: 'Operator sending the message',
			},
		],
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['getHistory'],
			},
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		default: 1,
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['getHistory'],
			},
		},
		description: 'Page number to request',
	},
	{
		displayName: 'Channels',
		name: 'messageChannels',
		type: 'multiOptions',
		default: ['whatsapp'],
		options: channelOptions,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['getHistory'],
			},
		},
		description: 'Channels to filter by',
	},
	{
		displayName: 'Sent By',
		name: 'sentBy',
		type: 'multiOptions',
		default: ['customer', 'operator'],
		options: sentByOptions,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['getHistory'],
			},
		},
		description: 'Sender types to include',
	},
	{
		displayName: 'Message Types',
		name: 'messageTypes',
		type: 'multiOptions',
		default: ['text'],
		options: messageTypeOptions,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['getHistory'],
			},
		},
		description: 'Message types to include',
	},
	{
		displayName: 'Start Date',
		name: 'startDate',
		type: 'dateTime',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['getHistory'],
			},
		},
		description: 'Start date of the period to search. Sent as YYYY-MM-DD.',
	},
	{
		displayName: 'End Date',
		name: 'endDate',
		type: 'dateTime',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['getHistory'],
			},
		},
		description: 'End date of the period to search. Sent as YYYY-MM-DD.',
	},
	{
		displayName: 'Decrypt Messages',
		name: 'decryptMessages',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['getHistory'],
			},
		},
		description: 'Whether to decrypt the encrypted messages field using the credential encryption key',
	},
];
