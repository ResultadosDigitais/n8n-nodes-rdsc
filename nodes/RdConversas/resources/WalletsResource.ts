import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { getRdConversasBaseUrl } from '../Helpers';
import {
	conversasRequest,
	extractItem,
	fetchSimpleList,
	isObject,
	requireString,
	unsupportedOperation,
} from '../ResourceHelpers';

export async function executeWallets(
	context: IExecuteFunctions,
	itemIndex: number,
	operation: string,
): Promise<IDataObject | IDataObject[]> {
	const baseUrl = await getRdConversasBaseUrl(context, itemIndex);

	switch (operation) {
		case 'getAll': {
			const returnAll = context.getNodeParameter('returnAll', itemIndex, false) as boolean;
			const limit = context.getNodeParameter('limit', itemIndex, 50) as number;

			return fetchSimpleList({
				context,
				itemIndex,
				url: `${baseUrl}/v2/wallets`,
				returnAll,
				limit,
				listKeys: ['wallets'],
			});
		}
		case 'addContact': {
			const walletName = requireString(
				context,
				context.getNodeParameter('walletName', itemIndex),
				'Wallet Name',
				itemIndex,
			);
			const contactId = requireString(
				context,
				context.getNodeParameter('contactId', itemIndex),
				'Contact ID',
				itemIndex,
			);

			const response = await conversasRequest(context, itemIndex, {
				method: 'POST',
				url: `${baseUrl}/v2/wallets/${encodeURIComponent(walletName)}/contacts`,
				headers: {
					accept: 'application/json',
					'content-type': 'application/json',
				},
				body: { contact: contactId },
			});

			return extractItem(response);
		}
		case 'deleteContact': {
			const walletName = requireString(
				context,
				context.getNodeParameter('walletName', itemIndex),
				'Wallet Name',
				itemIndex,
			);
			const contactId = requireString(
				context,
				context.getNodeParameter('contactId', itemIndex),
				'Contact ID',
				itemIndex,
			);

			const response = await conversasRequest(context, itemIndex, {
				method: 'DELETE',
				url: `${baseUrl}/v2/wallets/${encodeURIComponent(walletName)}/contacts/${encodeURIComponent(contactId)}`,
				headers: { accept: 'application/json' },
			});

			if (isObject(response) && Object.keys(response).length === 0) {
				return { wallet_name: walletName, contact_id: contactId, deleted: true };
			}

			return extractItem(response);
		}
		default:
			return unsupportedOperation(context, 'Wallets', operation, itemIndex);
	}
}
