import type { INodeProperties } from 'n8n-workflow';

const deletionFilterOptions = [
	{
		name: 'All Contacts',
		value: 'all',
	},
	{
		name: 'Integration',
		value: 'integration',
	},
	{
		name: 'Tag Name',
		value: 'tagName',
	},
];

export const contactsDescription: INodeProperties[] = [
	{
		displayName: 'Deletion Filter',
		name: 'deletionFilter',
		type: 'options',
		default: 'tagName',
		options: deletionFilterOptions,
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['deleteMany'],
			},
		},
		description: 'Filter used by the API to delete contacts. This action is irreversible.',
	},
	{
		displayName: 'Tag Name',
		name: 'tagName',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['deleteMany'],
				deletionFilter: ['tagName'],
			},
		},
		description: 'Name of the tag associated with the contacts to delete',
	},
	{
		displayName: 'Integration',
		name: 'integration',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['deleteMany'],
				deletionFilter: ['integration'],
			},
		},
		description: 'Name of the integration associated with the contacts to delete',
	},
	{
		displayName: 'Confirm Delete All',
		name: 'confirmDeleteAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['deleteMany'],
				deletionFilter: ['all'],
			},
		},
		description: 'Whether to confirm deletion of all contacts in the account',
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
				resource: ['contact'],
				operation: ['getAll'],
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
				resource: ['contact'],
				operation: ['getAll'],
			},
		},
		description: 'Page number to request',
	},
	{
		displayName: 'Channels',
		name: 'channels',
		type: 'multiOptions',
		default: [],
		options: [
			{
				name: 'Telegram',
				value: 'telegram',
			},
			{
				name: 'WhatsApp',
				value: 'whatsapp',
			},
		],
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getAll'],
			},
		},
		description: 'Channels to filter by. The API expects multiple channels as a comma-separated value.',
	},
	{
		displayName: 'Wallet Name',
		name: 'walletName',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['deleteFromWallet'],
			},
		},
		description: 'Name of the wallet whose contacts should be removed',
	},
	{
		displayName: 'Contacts Body JSON',
		name: 'contactsBodyJson',
		type: 'json',
		default: '{\n  "contacts": [\n    {\n      "cel_phone": ""\n    }\n  ]\n}',
		required: true,
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['createMany'],
			},
		},
		description: 'Raw request body for bulk contact creation. Must contain a contacts array.',
	},
	{
		displayName: 'Phone',
		name: 'phone',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['createByBroker', 'getByPhone', 'updateByBroker', 'updateByPhone'],
			},
		},
		description: 'Contact phone in E.164 format, for example 5511999998888',
	},
	{
		displayName: 'CPF',
		name: 'cpf',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getByCpf'],
			},
		},
		description: 'CPF of the contact. Numbers only are recommended.',
	},
	{
		displayName: 'Full Name',
		name: 'contactFullName',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['createByBroker', 'updateByBroker'],
			},
		},
		description: 'Full name of the contact',
	},
	{
		displayName: 'Integration',
		name: 'brokerIntegration',
		type: 'string',
		default: 'integration-1',
		required: true,
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['createByBroker', 'updateByBroker'],
			},
		},
		description: 'WhatsApp integration where the contact will be created',
	},
	{
		displayName: 'Create Fields',
		name: 'createFields',
		type: 'collection',
		default: {},
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['createByBroker'],
			},
		},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				placeholder: 'name@email.com',
			},
			{
				displayName: 'Tags',
				name: 'tagsUi',
				type: 'fixedCollection',
				default: {},
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						displayName: 'Tag',
						name: 'tagValues',
						values: [
							{
								displayName: 'Tag',
								name: 'tag',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
		],
	},
	{
		displayName: 'Create Body JSON',
		name: 'createBodyJson',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['createByBroker'],
			},
		},
		description: 'Optional raw JSON body for creation. Values here override fields from Create Fields.',
	},
	{
		displayName: 'Channel',
		name: 'channel',
		type: 'options',
		default: 'whatsapp',
		options: [
			{
				name: 'Telegram',
				value: 'telegram',
			},
			{
				name: 'WhatsApp',
				value: 'whatsapp',
			},
		],
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getByCpf', 'getByPhone'],
			},
		},
		description: 'Communication channel to search by',
	},
	{
		displayName: 'Country Code',
		name: 'countryCode',
		type: 'number',
		default: 55,
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getByPhone'],
			},
		},
		description: 'Country code used by the API search',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		default: {},
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['updateByPhone'],
			},
		},
		options: [
			{
				displayName: 'Address JSON',
				name: 'addressJson',
				type: 'json',
				default: '{}',
				description: 'Address object to send as the address field',
			},
			{
				displayName: 'Birth Date',
				name: 'birthDate',
				type: 'dateTime',
				default: '',
				description: 'Contact birth date. Sent as YYYY-MM-DD.',
			},
			{
				displayName: 'CNPJ',
				name: 'cnpj',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Code',
				name: 'code',
				type: 'string',
				default: '',
			},
			{
				displayName: 'CPF',
				name: 'cpf',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Customizable Fields',
				name: 'customizableFieldsUi',
				type: 'fixedCollection',
				default: {},
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						displayName: 'Field',
						name: 'fieldValues',
						values: [
							{
								displayName: 'Label',
								name: 'label',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Info',
								name: 'info',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				placeholder: 'name@email.com',
			},
			{
				displayName: 'Full Name',
				name: 'fullName',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Job JSON',
				name: 'jobJson',
				type: 'json',
				default: '{}',
				description: 'Job object to send as the job field',
			},
			{
				displayName: 'New Phone',
				name: 'newPhone',
				type: 'string',
				default: '',
				description: 'New phone value to send as cel_phone',
			},
			{
				displayName: 'RG',
				name: 'rg',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Tags',
				name: 'tagsUi',
				type: 'fixedCollection',
				default: {},
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						displayName: 'Tag',
						name: 'tagValues',
						values: [
							{
								displayName: 'Tag',
								name: 'tag',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
		],
	},
	{
		displayName: 'Update Fields',
		name: 'updateBrokerFields',
		type: 'collection',
		default: {},
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['updateByBroker'],
			},
		},
		options: [
			{
				displayName: 'Address JSON',
				name: 'addressJson',
				type: 'json',
				default: '{}',
				description: 'Address object to send as the address field',
			},
			{
				displayName: 'Birth Date',
				name: 'birthDate',
				type: 'dateTime',
				default: '',
				description: 'Contact birth date. Use Broker Update Body JSON if the API account requires DD/MM/YYYY.',
			},
			{
				displayName: 'CNPJ',
				name: 'cnpj',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Code',
				name: 'code',
				type: 'string',
				default: '',
			},
			{
				displayName: 'CPF',
				name: 'cpf',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				placeholder: 'name@email.com',
			},
			{
				displayName: 'Job JSON',
				name: 'jobJson',
				type: 'json',
				default: '{}',
				description: 'Job object to send as the job field',
			},
			{
				displayName: 'RG',
				name: 'rg',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Secondary Phone 0',
				name: 'secondaryPhone0',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Secondary Phone 1',
				name: 'secondaryPhone1',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Tags',
				name: 'tagsUi',
				type: 'fixedCollection',
				default: {},
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						displayName: 'Tag',
						name: 'tagValues',
						values: [
							{
								displayName: 'Tag',
								name: 'tag',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'WhatsApp Name',
				name: 'whatsappName',
				type: 'string',
				default: '',
				description: 'Optional WhatsApp Business integration name',
			},
		],
	},
	{
		displayName: 'Broker Update Body JSON',
		name: 'updateBrokerBodyJson',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['updateByBroker'],
			},
		},
		description: 'Optional raw JSON body. Values here override fields from Broker Update Fields.',
	},
	{
		displayName: 'Body JSON',
		name: 'bodyJson',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['updateByPhone'],
			},
		},
		description: 'Optional raw JSON body. Values here override fields from Update Fields.',
	},
];
