import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { getRdConversasBaseUrl } from '../Helpers';
import {
	conversasRequest,
	extractItem,
	fetchPaginatedList,
	hasString,
	requireString,
	unsupportedOperation,
} from '../ResourceHelpers';

async function sendMessage(context: IExecuteFunctions, itemIndex: number, baseUrl: string): Promise<IDataObject> {
	const contactId = requireString(context, context.getNodeParameter('contactId', itemIndex), 'Contact ID', itemIndex);
	const message = requireString(context, context.getNodeParameter('message', itemIndex), 'Message', itemIndex);
	const sentBy = requireString(context, context.getNodeParameter('sentBy', itemIndex), 'Sent By', itemIndex);
	const integration = requireString(
		context,
		context.getNodeParameter('integration', itemIndex),
		'Integration',
		itemIndex,
	);
	const operator = context.getNodeParameter('operator', itemIndex, '') as string;

	const body: IDataObject = {
		message,
		sent_by: sentBy,
		integration,
	};

	if (hasString(operator)) body.operator = operator.trim();

	const response = await conversasRequest(context, itemIndex, {
		method: 'POST',
		url: `${baseUrl}/v2/messages/${encodeURIComponent(contactId)}/send`,
		headers: {
			accept: 'application/json',
			'content-type': 'application/x-www-form-urlencoded',
		},
		body,
	});

	return extractItem(response);
}

async function sendTemplateMessage(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject> {
	const recipientNumber = requireString(
		context,
		context.getNodeParameter('recipientNumber', itemIndex),
		'Recipient Number',
		itemIndex,
	);
	const templateMessageId = requireString(
		context,
		context.getNodeParameter('templateMessageId', itemIndex),
		'Template Message ID',
		itemIndex,
	);
	const sentBy = requireString(context, context.getNodeParameter('sentBy', itemIndex), 'Sent By', itemIndex);
	const countryCode = context.getNodeParameter('countryCode', itemIndex, '55') as string;
	const operatorId = context.getNodeParameter('operatorId', itemIndex, '') as string;
	const variables = context.getNodeParameter('variables', itemIndex, {}) as IDataObject;

	const body: IDataObject = {
		recipient_number: recipientNumber,
		template_message_id: templateMessageId,
		sent_by: sentBy,
		country_code: String(countryCode).trim(),
	};

	if (hasString(operatorId)) body.operator_id = operatorId.trim();
	if (Object.keys(variables).length > 0) body.variables = variables;

	const response = await conversasRequest(context, itemIndex, {
		method: 'POST',
		url: `${baseUrl}/v3/messages/template/send`,
		headers: {
			accept: 'application/json',
			'content-type': 'application/json',
		},
		body,
	});

	return extractItem(response);
}

async function getMessageHistory(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject[]> {
	const returnAll = context.getNodeParameter('returnAll', itemIndex, false) as boolean;
	const limit = context.getNodeParameter('limit', itemIndex, 50) as number;
	const pageSize = context.getNodeParameter('pageSize', itemIndex, 50) as number;

	return fetchPaginatedList({
		context,
		itemIndex,
		url: `${baseUrl}/v2/messages/history`,
		returnAll,
		limit,
		pageSize,
		defaultPageSize: 50,
		listKeys: ['messages', 'history'],
	});
}

export async function executeMessages(
	context: IExecuteFunctions,
	itemIndex: number,
	operation: string,
): Promise<IDataObject | IDataObject[]> {
	const baseUrl = await getRdConversasBaseUrl(context, itemIndex);

	switch (operation) {
		case 'send':
			return sendMessage(context, itemIndex, baseUrl);
		case 'sendTemplate':
			return sendTemplateMessage(context, itemIndex, baseUrl);
		case 'getHistory':
			return getMessageHistory(context, itemIndex, baseUrl);
		default:
			return unsupportedOperation(context, 'Messages', operation, itemIndex);
	}
}
