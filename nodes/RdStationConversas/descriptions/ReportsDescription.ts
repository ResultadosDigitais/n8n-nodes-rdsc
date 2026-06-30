import type { INodeProperties } from 'n8n-workflow';

const reportChannelOptions = [
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

export const reportsDescription: INodeProperties[] = [
	{
		displayName: 'Start Date',
		name: 'reportStartDate',
		type: 'dateTime',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['report'],
				operation: ['getAll'],
			},
		},
		description: 'Start date for the report period. Sent as YYYY-MM-DD.',
	},
	{
		displayName: 'End Date',
		name: 'reportEndDate',
		type: 'dateTime',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['report'],
				operation: ['getAll'],
			},
		},
		description: 'End date for the report period. The API limits the range to 3 months.',
	},
	{
		displayName: 'Additional Fields',
		name: 'reportAdditionalFields',
		type: 'collection',
		default: {},
		displayOptions: {
			show: {
				resource: ['report'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Channel',
				name: 'channel',
				type: 'options',
				default: 'whatsapp',
				options: reportChannelOptions,
			},
			{
				displayName: 'Department',
				name: 'department',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Employee',
				name: 'employee',
				type: 'string',
				default: '',
				description: 'Operator ID to filter by',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: {
					minValue: 1,
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
			},
			{
				displayName: 'Skip',
				name: 'skip',
				type: 'number',
				default: 0,
				typeOptions: {
					minValue: 0,
				},
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'opened',
				options: [
					{
						name: 'Closed',
						value: 'closed',
					},
					{
						name: 'Opened',
						value: 'opened',
					},
				],
			},
			{
				displayName: 'Tabulation',
				name: 'tabulation',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Take',
				name: 'take',
				type: 'number',
				default: 50,
				typeOptions: {
					minValue: 1,
				},
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				default: 'operators',
				options: [
					{
						name: 'Chatbots',
						value: 'chatbots',
					},
					{
						name: 'Customers',
						value: 'customers',
					},
					{
						name: 'Operators',
						value: 'operators',
					},
					{
						name: 'Rejected',
						value: 'rejecteds',
					},
				],
			},
		],
	},
];
