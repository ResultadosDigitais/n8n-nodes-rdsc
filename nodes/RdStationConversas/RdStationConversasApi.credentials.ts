import type {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class RdStationConversasApi implements ICredentialType {
	name = 'rdStationConversasApi';
	displayName = 'RD Station Conversas API';
	documentationUrl = 'https://developers.rdstation.com/reference/conversas-v2-introduction';
	icon: Icon = 'file:rdstation.svg';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.tallos.com.br/v2',
			required: true,
			description: 'Base URL for the RD Station Conversas API. Change this if your account still uses another Conversas API host.',
		},
		{
			displayName: 'Authentication Type',
			name: 'authenticationType',
			type: 'options',
			options: [
				{
					name: 'Bearer Token',
					value: 'bearerToken',
				},
				{
					name: 'Custom Header',
					value: 'customHeader',
				},
			],
			default: 'bearerToken',
		},
		{
			displayName: 'Token',
			name: 'token',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Token used to authenticate with RD Station Conversas. The docs describe this as a Bearer JWT.',
		},
		{
			displayName: 'Header Name',
			name: 'headerName',
			type: 'string',
			default: 'Authorization',
			required: true,
			displayOptions: {
				show: {
					authenticationType: ['customHeader'],
				},
			},
		},
		{
			displayName: 'Header Prefix',
			name: 'headerPrefix',
			type: 'string',
			default: 'Bearer',
			displayOptions: {
				show: {
					authenticationType: ['customHeader'],
				},
			},
			description: 'Optional prefix placed before the token. Leave empty if the API expects only the token value.',
		},
		{
			displayName: 'Encryption Key',
			name: 'encryptionKey',
			type: 'string',
			typeOptions: {
				password: true,
				rows: 8,
			},
			default: '',
			description: 'Optional JWK JSON generated in RD Station Conversas under Apps and Integrations > API > Data Encryption Settings. Required only by encrypted endpoints.',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/customers',
			method: 'GET',
			qs: {
				limit: 1,
				page: 1,
			},
		},
	};

	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		const authenticationType = String(credentials.authenticationType ?? 'bearerToken');
		const token = String(credentials.token ?? '').trim();
		const headerName = authenticationType === 'customHeader'
			? String(credentials.headerName ?? 'Authorization').trim()
			: 'Authorization';
		const headerPrefix = authenticationType === 'customHeader'
			? String(credentials.headerPrefix ?? '').trim()
			: 'Bearer';
		const headerValue = headerPrefix ? `${headerPrefix} ${token}` : token;

		return {
			...requestOptions,
			headers: {
				...(requestOptions.headers ?? {}),
				[headerName || 'Authorization']: headerValue,
			},
		};
	}
}
