import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { getRdConversasBaseUrl } from '../Helpers';
import {
	fetchById,
	fetchPaginatedList,
	requireString,
	unsupportedOperation,
} from '../ResourceHelpers';

export async function executeCampaigns(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const operation = context.getNodeParameter('operation', itemIndex) as string;
	const baseUrl = await getRdConversasBaseUrl(context, itemIndex);

	switch (operation) {
		case 'getAll': {
			const returnAll = context.getNodeParameter('returnAll', itemIndex, false) as boolean;
			const limit = context.getNodeParameter('limit', itemIndex, 50) as number;
			const pageSize = context.getNodeParameter('pageSize', itemIndex, 25) as number;

			return fetchPaginatedList({
				context,
				itemIndex,
				url: `${baseUrl}/v1/campaigns`,
				returnAll,
				limit,
				pageSize,
				defaultPageSize: 25,
				listKeys: ['campaigns'],
			});
		}
		case 'get': {
			const campaignId = requireString(
				context,
				context.getNodeParameter('campaignId', itemIndex),
				'Campaign ID',
				itemIndex,
			);

			return fetchById(
				context,
				itemIndex,
				`${baseUrl}/v1/campaigns/${encodeURIComponent(campaignId)}`,
			);
		}
		default:
			return unsupportedOperation(context, 'Campaigns', operation, itemIndex);
	}
}
