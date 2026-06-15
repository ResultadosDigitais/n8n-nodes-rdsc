import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { getRdConversasBaseUrl } from '../Helpers';
import {
	fetchById,
	fetchSimpleList,
	requireString,
	unsupportedOperation,
} from '../ResourceHelpers';

async function listMetadata(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
	endpoint: string,
	listKey: string,
): Promise<IDataObject[]> {
	const returnAll = context.getNodeParameter('returnAll', itemIndex, true) as boolean;
	const limit = context.getNodeParameter('limit', itemIndex, 50) as number;

	return fetchSimpleList({
		context,
		itemIndex,
		url: `${baseUrl}${endpoint}`,
		returnAll,
		limit,
		listKeys: [listKey],
	});
}

export async function executeMetadata(
	context: IExecuteFunctions,
	itemIndex: number,
	operation: string,
): Promise<IDataObject | IDataObject[]> {
	const baseUrl = await getRdConversasBaseUrl(context, itemIndex);

	switch (operation) {
		case 'listFlows':
			return listMetadata(context, itemIndex, baseUrl, '/v2/flows', 'flows');
		case 'listWorkflows':
			return listMetadata(context, itemIndex, baseUrl, '/v2/workflows', 'workflows');
		case 'listWhatsappIntegrations':
			return listMetadata(context, itemIndex, baseUrl, '/v2/whatsapp/integrations', 'integrations');
		case 'getJob': {
			const jobId = requireString(context, context.getNodeParameter('jobId', itemIndex), 'Job ID', itemIndex);

			return fetchById(context, itemIndex, `${baseUrl}/v2/jobs/${encodeURIComponent(jobId)}`);
		}
		default:
			return unsupportedOperation(context, 'Metadata', operation, itemIndex);
	}
}
