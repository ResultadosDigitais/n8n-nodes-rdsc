import type { IAuthenticateGeneric, ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

export class RdConversasApi implements ICredentialType {
	name = 'rdConversasApi';
	displayName = 'RD Station Conversas API';
	documentationUrl = 'https://developers.rdstation.com/reference/conversas-v2-authentication';
	icon: Icon = 'file:rdstation.svg';

	properties: INodeProperties[] = [
		{
			displayName: 'JWT Token',
			name: 'jwtToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'Token JWT obtido em Apps e Integrações > API no RD Station Conversas',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{ name: 'Production', value: 'production' },
				{ name: 'Legacy', value: 'legacy' },
			],
			default: 'production',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'hidden',
			default:
				'={{ $self["environment"] === "legacy" ? "https://api.megasac.tallos.com.br" : "https://api.tallos.com.br" }}',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.jwtToken}}',
			},
		},
	};
}
