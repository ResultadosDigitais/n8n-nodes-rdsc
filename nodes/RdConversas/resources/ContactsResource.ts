import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { getRdConversasBaseUrl } from '../Helpers';
import {
	conversasRequest,
	fetchPaginatedList,
	fetchById,
	hasString,
	requireString,
	extractItem,
	unsupportedOperation,
} from '../ResourceHelpers';

async function listContacts(context: IExecuteFunctions, itemIndex: number, baseUrl: string): Promise<IDataObject[]> {
	const returnAll = context.getNodeParameter('returnAll', itemIndex, false) as boolean;
	const limit = context.getNodeParameter('limit', itemIndex, 50) as number;
	const pageSize = context.getNodeParameter('pageSize', itemIndex, 50) as number;
	const channels = context.getNodeParameter('channels', itemIndex, '') as string;

	const extraQs: IDataObject = {};
	if (hasString(channels)) extraQs.channels = channels.trim();

	return fetchPaginatedList(
		context,
		itemIndex,
		`${baseUrl}/v2/customers`,
		returnAll,
		limit,
		pageSize,
		50,
		['customers'],
		extraQs,
	);
}

async function getContactByPhone(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject> {
	const celPhone = requireString(context, context.getNodeParameter('celPhone', itemIndex), 'Phone number', itemIndex);

	return fetchById(
		context,
		itemIndex,
		`${baseUrl}/v2/contacts/cel_phone/${encodeURIComponent(celPhone)}`,
	);
}

async function createOrUpdateContact(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
	operation: 'create' | 'update',
): Promise<IDataObject> {
	const fullName = requireString(context, context.getNodeParameter('fullName', itemIndex), 'Full Name', itemIndex);
	const celPhone = requireString(context, context.getNodeParameter('celPhone', itemIndex), 'Phone number', itemIndex);
	const integration = requireString(
		context,
		context.getNodeParameter('integration', itemIndex),
		'Integration',
		itemIndex,
	);

	const response = await conversasRequest(context, itemIndex, {
		method: operation === 'create' ? 'POST' : 'PUT',
		url: `${baseUrl}/v2/contacts/whatsapp-business-by-brokers`,
		headers: {
			accept: 'application/json',
			'content-type': 'application/json',
		},
		body: {
			full_name: fullName,
			cel_phone: celPhone,
			integration,
		},
	});

	return extractItem(response);
}

export async function executeContacts(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const operation = context.getNodeParameter('operation', itemIndex) as string;
	const baseUrl = await getRdConversasBaseUrl(context, itemIndex);

	switch (operation) {
		case 'getAll':
			return listContacts(context, itemIndex, baseUrl);
		case 'getByPhone':
			return getContactByPhone(context, itemIndex, baseUrl);
		case 'create':
			return createOrUpdateContact(context, itemIndex, baseUrl, 'create');
		case 'update':
			return createOrUpdateContact(context, itemIndex, baseUrl, 'update');
		default:
			return unsupportedOperation(context, 'Contacts', operation, itemIndex);
	}
}
