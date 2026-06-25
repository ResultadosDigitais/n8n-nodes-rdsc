import type { IDataObject, IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getRdConversasBaseUrl, rdConversasRequest } from '../Helpers';

type RequestInput = Omit<IHttpRequestOptions, 'url'>;

function isObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertNonEmpty(value: string, label: string, context: IExecuteFunctions, itemIndex: number): string {
	const normalizedValue = String(value ?? '').trim();
	if (!normalizedValue) {
		throw new NodeOperationError(context.getNode(), `${label} is required`, { itemIndex });
	}
	return normalizedValue;
}

function toOutput(response: unknown): IDataObject | IDataObject[] {
	if (Array.isArray(response)) return response as IDataObject[];
	if (isObject(response)) return response;
	return {
		data: response ?? null,
	};
}

function buildRequest(baseUrl: string, path: string, options: RequestInput): IHttpRequestOptions {
	return {
		...options,
		url: `${baseUrl}${path}`,
		headers: {
			accept: 'application/json',
			...(options.body ? { 'content-type': 'application/json' } : {}),
			...(options.headers ?? {}),
		},
	};
}

function getPositiveInteger(
	context: IExecuteFunctions,
	itemIndex: number,
	parameterName: string,
	label: string,
): number {
	const value = context.getNodeParameter(parameterName, itemIndex) as number;
	if (!Number.isInteger(value) || value < 1) {
		throw new NodeOperationError(context.getNode(), `${label} must be a positive integer`, { itemIndex });
	}
	return value;
}

function formatDateOnly(value: string, context: IExecuteFunctions, itemIndex: number, label: string): string {
	const raw = String(value ?? '').trim();
	if (!raw) return '';
	if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
	if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw.slice(0, 10);

	const parsed = new Date(raw);
	if (Number.isNaN(parsed.getTime())) {
		throw new NodeOperationError(context.getNode(), `${label} must be a valid date`, { itemIndex });
	}
	return parsed.toISOString().slice(0, 10);
}

function parseJsonObject(
	context: IExecuteFunctions,
	itemIndex: number,
	value: unknown,
	label: string,
): IDataObject {
	const raw = String(value ?? '').trim();
	if (!raw) return {};

	try {
		const parsed = JSON.parse(raw) as unknown;
		if (isObject(parsed)) return parsed;
	} catch {
		throw new NodeOperationError(context.getNode(), `${label} must be a valid JSON object`, { itemIndex });
	}

	throw new NodeOperationError(context.getNode(), `${label} must be a valid JSON object`, { itemIndex });
}

function readFixedCollectionValues(fields: IDataObject, collectionName: string, valuesName: string): IDataObject[] {
	const collection = fields[collectionName];
	if (!isObject(collection)) return [];

	const values = collection[valuesName];
	if (!Array.isArray(values)) return [];

	return values.filter(isObject);
}

function readTags(fields: IDataObject): string[] {
	return readFixedCollectionValues(fields, 'tagsUi', 'tagValues')
		.map((entry) => String(entry.tag ?? '').trim())
		.filter((entry) => entry !== '');
}

function readCustomizableFields(fields: IDataObject): IDataObject[] {
	return readFixedCollectionValues(fields, 'customizableFieldsUi', 'fieldValues')
		.map((entry) => ({
			label: String(entry.label ?? '').trim(),
			info: String(entry.info ?? '').trim(),
		}))
		.filter((entry) => entry.label !== '' || entry.info !== '');
}

function applyStringField(body: IDataObject, fields: IDataObject, sourceName: string, targetName: string): void {
	const value = fields[sourceName];
	if (value === undefined || value === null) return;

	const normalizedValue = String(value).trim();
	if (normalizedValue) body[targetName] = normalizedValue;
}

function buildUpdateByPhoneBody(
	context: IExecuteFunctions,
	itemIndex: number,
	updateFields: IDataObject,
	rawBody: IDataObject,
): IDataObject {
	const body: IDataObject = {};

	applyStringField(body, updateFields, 'newPhone', 'cel_phone');
	applyStringField(body, updateFields, 'cnpj', 'cnpj');
	applyStringField(body, updateFields, 'code', 'code');
	applyStringField(body, updateFields, 'cpf', 'cpf');
	applyStringField(body, updateFields, 'description', 'description');
	applyStringField(body, updateFields, 'email', 'email');
	applyStringField(body, updateFields, 'fullName', 'full_name');
	applyStringField(body, updateFields, 'rg', 'rg');

	const birthDate = formatDateOnly(String(updateFields.birthDate ?? ''), context, itemIndex, 'Birth Date');
	if (birthDate) body.birth_date = birthDate;

	const address = parseJsonObject(context, itemIndex, updateFields.addressJson, 'Address JSON');
	if (Object.keys(address).length > 0) body.address = address;

	const job = parseJsonObject(context, itemIndex, updateFields.jobJson, 'Job JSON');
	if (Object.keys(job).length > 0) body.job = job;

	const tags = readTags(updateFields);
	if (tags.length > 0) body.tags = tags;

	const customizableFields = readCustomizableFields(updateFields);
	if (customizableFields.length > 0) body.customizable_field = customizableFields;

	return {
		...body,
		...rawBody,
	};
}

function buildBrokerUpdateBody(
	context: IExecuteFunctions,
	itemIndex: number,
	updateFields: IDataObject,
	rawBody: IDataObject,
): IDataObject {
	const body: IDataObject = {
		cel_phone: assertNonEmpty(
			context.getNodeParameter('phone', itemIndex) as string,
			'Phone',
			context,
			itemIndex,
		),
		full_name: assertNonEmpty(
			context.getNodeParameter('contactFullName', itemIndex) as string,
			'Full Name',
			context,
			itemIndex,
		),
		integration: assertNonEmpty(
			context.getNodeParameter('brokerIntegration', itemIndex) as string,
			'Integration',
			context,
			itemIndex,
		),
	};

	applyStringField(body, updateFields, 'cnpj', 'cnpj');
	applyStringField(body, updateFields, 'code', 'code');
	applyStringField(body, updateFields, 'cpf', 'cpf');
	applyStringField(body, updateFields, 'description', 'description');
	applyStringField(body, updateFields, 'email', 'email');
	applyStringField(body, updateFields, 'rg', 'rg');
	applyStringField(body, updateFields, 'secondaryPhone0', 'cel_phone_secondary0');
	applyStringField(body, updateFields, 'secondaryPhone1', 'cel_phone_secondary1');
	applyStringField(body, updateFields, 'whatsappName', 'whatsapp_name');

	const birthDate = formatDateOnly(String(updateFields.birthDate ?? ''), context, itemIndex, 'Birth Date');
	if (birthDate) body.birth_date = birthDate;

	const address = parseJsonObject(context, itemIndex, updateFields.addressJson, 'Address JSON');
	if (Object.keys(address).length > 0) body.address = address;

	const job = parseJsonObject(context, itemIndex, updateFields.jobJson, 'Job JSON');
	if (Object.keys(job).length > 0) body.job = job;

	const tags = readTags(updateFields);
	if (tags.length > 0) body.tags = tags;

	return {
		...body,
		...rawBody,
	};
}

function assertContactsBody(body: IDataObject, context: IExecuteFunctions, itemIndex: number): IDataObject {
	if (!Array.isArray(body.contacts)) {
		throw new NodeOperationError(context.getNode(), 'Contacts Body JSON must contain a contacts array', {
			itemIndex,
		});
	}

	return body;
}

export async function executeContacts(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const operation = context.getNodeParameter('operation', itemIndex) as string;
	const baseUrl = await getRdConversasBaseUrl(context, itemIndex);

	if (operation === 'createByBroker') {
		const createFields = context.getNodeParameter('createFields', itemIndex, {}) as IDataObject;
		const rawBody = parseJsonObject(
			context,
			itemIndex,
			context.getNodeParameter('createBodyJson', itemIndex, '{}'),
			'Create Body JSON',
		);
		const body: IDataObject = {
			cel_phone: assertNonEmpty(
				context.getNodeParameter('phone', itemIndex) as string,
				'Phone',
				context,
				itemIndex,
			),
			full_name: assertNonEmpty(
				context.getNodeParameter('contactFullName', itemIndex) as string,
				'Full Name',
				context,
				itemIndex,
			),
			integration: assertNonEmpty(
				context.getNodeParameter('brokerIntegration', itemIndex) as string,
				'Integration',
				context,
				itemIndex,
			),
		};

		applyStringField(body, createFields, 'description', 'description');
		applyStringField(body, createFields, 'email', 'email');

		const tags = readTags(createFields);
		if (tags.length > 0) body.tags = tags;

		const response = await rdConversasRequest(context, buildRequest(baseUrl, '/contacts/whatsapp-business-by-brokers', {
			method: 'POST',
			body: {
				...body,
				...rawBody,
			},
		}), itemIndex);

		return toOutput(response);
	}

	if (operation === 'createMany') {
		const body = assertContactsBody(
			parseJsonObject(
				context,
				itemIndex,
				context.getNodeParameter('contactsBodyJson', itemIndex, '{}'),
				'Contacts Body JSON',
			),
			context,
			itemIndex,
		);

		const response = await rdConversasRequest(context, buildRequest(baseUrl, '/contacts/bulk', {
			method: 'POST',
			body,
		}), itemIndex);

		return toOutput(response);
	}

	if (operation === 'deleteFromWallet') {
		const response = await rdConversasRequest(context, buildRequest(baseUrl, '/customers/wallets/remove-all', {
			method: 'POST',
			body: {
				wallet_name: assertNonEmpty(
					context.getNodeParameter('walletName', itemIndex) as string,
					'Wallet Name',
					context,
					itemIndex,
				),
			},
		}), itemIndex);

		return toOutput(response);
	}

	if (operation === 'deleteMany') {
		const deletionFilter = context.getNodeParameter('deletionFilter', itemIndex) as string;
		const body: IDataObject = {};

		if (deletionFilter === 'tagName') {
			body.tag_name = assertNonEmpty(
				context.getNodeParameter('tagName', itemIndex) as string,
				'Tag Name',
				context,
				itemIndex,
			);
		} else if (deletionFilter === 'integration') {
			body.integration = assertNonEmpty(
				context.getNodeParameter('integration', itemIndex) as string,
				'Integration',
				context,
				itemIndex,
			);
		} else if (deletionFilter === 'all') {
			const confirmDeleteAll = context.getNodeParameter('confirmDeleteAll', itemIndex) as boolean;
			if (!confirmDeleteAll) {
				throw new NodeOperationError(context.getNode(), 'Confirm Delete All must be enabled', { itemIndex });
			}
			body.$all = true;
		} else {
			throw new NodeOperationError(context.getNode(), `Unsupported deletion filter: ${deletionFilter}`, {
				itemIndex,
			});
		}

		const response = await rdConversasRequest(context, buildRequest(baseUrl, '/contacts', {
			method: 'DELETE',
			body,
		}), itemIndex);

		return toOutput(response);
	}

	if (operation === 'getAll') {
		const limit = getPositiveInteger(context, itemIndex, 'limit', 'Limit');
		const page = getPositiveInteger(context, itemIndex, 'page', 'Page');
		const channels = context.getNodeParameter('channels', itemIndex, []) as string[];
		const qs: IDataObject = {
			limit,
			page,
		};

		if (channels.length > 0) {
			qs.channels = channels.join(',');
		}

		const response = await rdConversasRequest(context, buildRequest(baseUrl, '/customers', {
			method: 'GET',
			qs,
		}), itemIndex);

		return toOutput(response);
	}

	if (operation === 'getByCpf') {
		const cpf = encodeURIComponent(assertNonEmpty(
			context.getNodeParameter('cpf', itemIndex) as string,
			'CPF',
			context,
			itemIndex,
		));
		const channel = String(context.getNodeParameter('channel', itemIndex, '')).trim();
		const qs: IDataObject = {};

		if (channel) qs.channel = channel;

		const response = await rdConversasRequest(context, buildRequest(baseUrl, `/contacts/cpf/${cpf}/exists`, {
			method: 'GET',
			qs,
		}), itemIndex);

		return toOutput(response);
	}

	if (operation === 'getByPhone') {
		const phone = encodeURIComponent(assertNonEmpty(
			context.getNodeParameter('phone', itemIndex) as string,
			'Phone',
			context,
			itemIndex,
		));
		const channel = String(context.getNodeParameter('channel', itemIndex, '')).trim();
		const countryCode = context.getNodeParameter('countryCode', itemIndex, '') as number | string;
		const qs: IDataObject = {};

		if (channel) qs.channel = channel;
		if (countryCode !== '') qs.country_code = countryCode;

		const response = await rdConversasRequest(context, buildRequest(baseUrl, `/contacts/${phone}/exists`, {
			method: 'GET',
			qs,
		}), itemIndex);

		return toOutput(response);
	}

	if (operation === 'updateByBroker') {
		const updateFields = context.getNodeParameter('updateBrokerFields', itemIndex, {}) as IDataObject;
		const rawBody = parseJsonObject(
			context,
			itemIndex,
			context.getNodeParameter('updateBrokerBodyJson', itemIndex, '{}'),
			'Broker Update Body JSON',
		);
		const body = buildBrokerUpdateBody(context, itemIndex, updateFields, rawBody);

		const response = await rdConversasRequest(context, buildRequest(baseUrl, '/contacts/whatsapp-business-by-brokers', {
			method: 'PUT',
			body,
		}), itemIndex);

		return toOutput(response);
	}

	if (operation === 'updateByPhone') {
		const phone = encodeURIComponent(assertNonEmpty(
			context.getNodeParameter('phone', itemIndex) as string,
			'Phone',
			context,
			itemIndex,
		));
		const updateFields = context.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;
		const rawBody = parseJsonObject(context, itemIndex, context.getNodeParameter('bodyJson', itemIndex, '{}'), 'Body JSON');
		const body = buildUpdateByPhoneBody(context, itemIndex, updateFields, rawBody);

		if (Object.keys(body).length === 0) {
			throw new NodeOperationError(context.getNode(), 'At least one field must be provided to update', {
				itemIndex,
			});
		}

		const response = await rdConversasRequest(context, buildRequest(baseUrl, `/contacts/${phone}`, {
			method: 'PATCH',
			body,
		}), itemIndex);

		return toOutput(response);
	}

	throw new NodeOperationError(context.getNode(), `Unsupported contact operation: ${operation}`, { itemIndex });
}
