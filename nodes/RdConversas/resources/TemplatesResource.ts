import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { getRdConversasBaseUrl } from '../Helpers';
import { fetchSimpleList, unsupportedOperation } from '../ResourceHelpers';

export async function executeTemplates(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const operation = context.getNodeParameter('operation', itemIndex) as string;
	const baseUrl = await getRdConversasBaseUrl(context, itemIndex);

	if (operation !== 'getAll') {
		return unsupportedOperation(context, 'Templates', operation, itemIndex);
	}

	const returnAll = context.getNodeParameter('returnAll', itemIndex, false) as boolean;
	const limit = context.getNodeParameter('limit', itemIndex, 50) as number;

	return fetchSimpleList(
		context,
		itemIndex,
		`${baseUrl}/v2/templates`,
		returnAll,
		limit,
		['templates'],
	);
}
