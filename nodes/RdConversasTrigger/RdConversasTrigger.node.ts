import type {
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';

type RdConversasWebhookEvent =
	| 'message_received'
	| 'contact_created'
	| 'contact_updated'
	| 'attendance_started'
	| 'attendance_finished';

const WEBHOOK_EVENT_OPTIONS: Array<{ name: string; value: RdConversasWebhookEvent }> = [
	{ name: 'Attendance Finished', value: 'attendance_finished' },
	{ name: 'Attendance Started', value: 'attendance_started' },
	{ name: 'Contact Created', value: 'contact_created' },
	{ name: 'Contact Updated', value: 'contact_updated' },
	{ name: 'Message Received', value: 'message_received' },
];

export class RdConversasTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'RD Station Conversas Trigger',
		name: 'rdConversasTrigger',
		icon: 'file:rdstation.svg',
		group: ['trigger'],
		version: 1,
		description: 'Starts the workflow when RD Station Conversas sends a webhook event',
		defaults: {
			name: 'RD Station Conversas Trigger',
		},
		inputs: [],
		outputs: ['main'],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'rd-conversas',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'eventName',
				type: 'options',
				options: WEBHOOK_EVENT_OPTIONS,
				default: 'message_received',
				description:
					'Expected event type. Configure the same event in RD Station Conversas when registering this webhook URL.',
			},
			{
				displayName: 'Authentication Header',
				name: 'authenticationHeader',
				type: 'string',
				default: '',
				description: 'Optional HTTP header name for webhook authentication',
			},
			{
				displayName: 'Authentication Key',
				name: 'authenticationKey',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				displayOptions: {
					show: {
						authenticationHeader: [{ _cnd: { not: '' } }],
					},
				},
				description: 'Optional value for the authentication header',
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData() as IDataObject;
		const headers = this.getHeaderData() as IDataObject;
		const eventName = this.getNodeParameter('eventName', 'message_received') as RdConversasWebhookEvent;
		const authenticationHeader = String(this.getNodeParameter('authenticationHeader', '') ?? '').trim();
		const authenticationKey = String(this.getNodeParameter('authenticationKey', '') ?? '').trim();

		if (authenticationHeader) {
			const headerValue = headers[authenticationHeader.toLowerCase()] ?? headers[authenticationHeader];
			if (!headerValue || String(headerValue) !== authenticationKey) {
				return {
					webhookResponse: { message: 'Unauthorized' },
				};
			}
		}

		const returnData: IDataObject = {
			event: eventName,
			body: bodyData,
			headers,
		};

		return {
			workflowData: [this.helpers.returnJsonArray([returnData])],
		};
	}
}
