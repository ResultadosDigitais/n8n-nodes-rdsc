import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { getRdConversasBaseUrl } from '../Helpers';
import {
	fetchById,
	fetchSimpleList,
	requireString,
	unsupportedOperation,
} from '../ResourceHelpers';

export async function executeEmployees(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const operation = context.getNodeParameter('operation', itemIndex) as string;
	const baseUrl = await getRdConversasBaseUrl(context, itemIndex);

	switch (operation) {
		case 'getAll': {
			const returnAll = context.getNodeParameter('returnAll', itemIndex, false) as boolean;
			const limit = context.getNodeParameter('limit', itemIndex, 50) as number;

			return fetchSimpleList(
				context,
				itemIndex,
				`${baseUrl}/v2/employees`,
				returnAll,
				limit,
				['employees'],
			);
		}
		case 'get': {
			const employeeId = requireString(
				context,
				context.getNodeParameter('employeeId', itemIndex),
				'Employee ID',
				itemIndex,
			);

			return fetchById(
				context,
				itemIndex,
				`${baseUrl}/v1/employees/${encodeURIComponent(employeeId)}`,
			);
		}
		default:
			return unsupportedOperation(context, 'Employees', operation, itemIndex);
	}
}
