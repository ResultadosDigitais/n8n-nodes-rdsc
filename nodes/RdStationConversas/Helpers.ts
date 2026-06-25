import type {
	ICredentialDataDecryptedObject,
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	JsonObject,
	JsonValue,
} from 'n8n-workflow';
import {
	constants,
	createDecipheriv,
	createHmac,
	createPrivateKey,
	privateDecrypt,
	timingSafeEqual,
	type CipherGCMTypes,
	type DecipherGCM,
	type JsonWebKey,
} from 'crypto';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

const DEFAULT_CONVERSAS_BASE_URL = 'https://api.tallos.com.br/v2';

type FullResponse = {
	body?: unknown;
	statusCode?: number;
	statusMessage?: string;
};

type RdConversasRequestError = {
	description?: unknown;
	message?: string;
	request?: {
		href?: string;
	};
	response?: {
		body?: unknown;
		data?: unknown;
		status?: number;
	};
	statusCode?: number;
};

type JweHeader = {
	alg?: string;
	enc?: string;
};

type CbcHmacConfig = {
	algorithm: string;
	hash: string;
	encKeyLength: number;
	macKeyLength: number;
	tagLength: number;
};

function toJsonValue(value: unknown): JsonValue {
	if (value === null || value === undefined) return null;
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
	if (Array.isArray(value)) return value.map(toJsonValue);
	if (typeof value === 'object') {
		const normalized: JsonObject = {};
		for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
			normalized[key] = toJsonValue(entry);
		}
		return normalized;
	}
	return String(value);
}

function toApiErrorResponse(error: unknown, options: IHttpRequestOptions): JsonObject {
	const requestError = (error ?? {}) as RdConversasRequestError;
	const statusCode = requestError.statusCode ?? requestError.response?.status;
	const responseBody = requestError.response?.body ?? requestError.response?.data ?? requestError.description;

	return {
		message: requestError.message ?? 'The service was not able to process your request',
		statusCode: statusCode ?? null,
		requestUrl: requestError.request?.href ?? options.url,
		responseBody: toJsonValue(responseBody),
	};
}

function normalizeBaseUrl(value: unknown): string {
	const baseUrl = String(value ?? DEFAULT_CONVERSAS_BASE_URL).trim() || DEFAULT_CONVERSAS_BASE_URL;
	return baseUrl.replace(/\/+$/, '');
}

function normalizeResponseBody(body: unknown): unknown {
	if (typeof body !== 'string') return body;

	try {
		return JSON.parse(body) as unknown;
	} catch {
		return body;
	}
}

export async function getRdConversasBaseUrl(
	context: Pick<IExecuteFunctions, 'getCredentials'>,
	itemIndex = 0,
): Promise<string> {
	const credentials = (await context.getCredentials(
		'rdStationConversasApi',
		itemIndex,
	)) as ICredentialDataDecryptedObject;

	return normalizeBaseUrl(credentials.baseUrl);
}

export async function getRdConversasApiRootUrl(
	context: Pick<IExecuteFunctions, 'getCredentials'>,
	itemIndex = 0,
): Promise<string> {
	const baseUrl = await getRdConversasBaseUrl(context, itemIndex);

	return baseUrl.replace(/\/v\d+$/, '');
}

export async function rdConversasRequest<T = IDataObject | IDataObject[]>(
	context: IExecuteFunctions,
	options: IHttpRequestOptions,
	itemIndex: number,
): Promise<T> {
	try {
		const requestBody = options.body;
		const isFormBody = requestBody instanceof URLSearchParams;
		const response = (await context.helpers.httpRequestWithAuthentication.call(
			context,
			'rdStationConversasApi',
			{
				...options,
				body: isFormBody ? requestBody.toString() : requestBody,
				json: !isFormBody,
				returnFullResponse: true,
			},
		)) as FullResponse;

		return (normalizeResponseBody(response.body) ?? {}) as T;
	} catch (error: unknown) {
		const apiErrorResponse = toApiErrorResponse(error, options);
		throw new NodeApiError(
			context.getNode(),
			apiErrorResponse,
			{
				itemIndex,
				httpCode: apiErrorResponse.statusCode === null ? undefined : String(apiErrorResponse.statusCode),
			},
		);
	}
}

async function getRdConversasCredentials(
	context: Pick<IExecuteFunctions, 'getCredentials'>,
	itemIndex: number,
): Promise<ICredentialDataDecryptedObject> {
	return (await context.getCredentials(
		'rdStationConversasApi',
		itemIndex,
	)) as ICredentialDataDecryptedObject;
}

function parseEncryptionKey(
	context: IExecuteFunctions,
	itemIndex: number,
	value: unknown,
): JsonObject {
	const rawKey = String(value ?? '').trim();
	if (!rawKey) {
		throw new NodeOperationError(
			context.getNode(),
			'Encryption Key is required for this operation. Generate it in RD Station Conversas under Apps and Integrations > API > Data Encryption Settings.',
			{ itemIndex },
		);
	}

	try {
		const parsedKey = JSON.parse(rawKey) as unknown;
		if (typeof parsedKey === 'object' && parsedKey !== null && !Array.isArray(parsedKey)) {
			return parsedKey as JsonObject;
		}
	} catch {
		throw new NodeOperationError(
			context.getNode(),
			'Encryption Key must be a valid JWK JSON object',
			{ itemIndex },
		);
	}

	throw new NodeOperationError(
		context.getNode(),
		'Encryption Key must be a valid JWK JSON object',
		{ itemIndex },
	);
}

function parseDecryptedPayload(value: string): JsonValue {
	try {
		return JSON.parse(value) as JsonValue;
	} catch {
		return value;
	}
}

function base64UrlDecode(value: string): Buffer {
	const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/');
	const padding = (4 - (normalizedValue.length % 4)) % 4;
	return Buffer.from(`${normalizedValue}${'='.repeat(padding)}`, 'base64');
}

function parseJweHeader(
	context: IExecuteFunctions,
	itemIndex: number,
	protectedHeader: string,
): JweHeader {
	try {
		const header = JSON.parse(base64UrlDecode(protectedHeader).toString('utf8')) as unknown;
		if (typeof header === 'object' && header !== null && !Array.isArray(header)) {
			return header as JweHeader;
		}
	} catch (error) {
		throw new NodeOperationError(
			context.getNode(),
			`Could not parse encrypted payload header: ${(error as Error).message}`,
			{ itemIndex },
		);
	}

	throw new NodeOperationError(context.getNode(), 'Encrypted payload header is invalid', { itemIndex });
}

function getOaepHash(
	context: IExecuteFunctions,
	itemIndex: number,
	algorithm: string | undefined,
): 'sha1' | 'sha256' {
	if (algorithm === 'RSA-OAEP') return 'sha1';
	if (algorithm === 'RSA-OAEP-256') return 'sha256';

	throw new NodeOperationError(
		context.getNode(),
		`Unsupported encrypted payload key algorithm: ${algorithm ?? 'unknown'}`,
		{ itemIndex },
	);
}

function decryptContentEncryptionKey(
	context: IExecuteFunctions,
	itemIndex: number,
	encryptionKey: JsonObject,
	header: JweHeader,
	encryptedKey: Buffer,
): Buffer {
	try {
		const privateKey = createPrivateKey({
			key: encryptionKey as JsonWebKey,
			format: 'jwk',
		});

		return privateDecrypt(
			{
				key: privateKey,
				oaepHash: getOaepHash(context, itemIndex, header.alg),
				padding: constants.RSA_PKCS1_OAEP_PADDING,
			},
			encryptedKey,
		);
	} catch (error) {
		throw new NodeOperationError(
			context.getNode(),
			`Could not decrypt content encryption key: ${(error as Error).message}`,
			{ itemIndex },
		);
	}
}

function getGcmAlgorithm(
	context: IExecuteFunctions,
	itemIndex: number,
	encryption: string | undefined,
): CipherGCMTypes {
	if (encryption === 'A128GCM') return 'aes-128-gcm';
	if (encryption === 'A192GCM') return 'aes-192-gcm';
	if (encryption === 'A256GCM') return 'aes-256-gcm';

	throw new NodeOperationError(
		context.getNode(),
		`Unsupported encrypted payload content algorithm: ${encryption ?? 'unknown'}`,
		{ itemIndex },
	);
}

function getCbcHmacConfig(
	context: IExecuteFunctions,
	itemIndex: number,
	encryption: string | undefined,
): CbcHmacConfig {
	if (encryption === 'A128CBC-HS256') {
		return {
			algorithm: 'aes-128-cbc',
			hash: 'sha256',
			encKeyLength: 16,
			macKeyLength: 16,
			tagLength: 16,
		};
	}
	if (encryption === 'A192CBC-HS384') {
		return {
			algorithm: 'aes-192-cbc',
			hash: 'sha384',
			encKeyLength: 24,
			macKeyLength: 24,
			tagLength: 24,
		};
	}	
	if (encryption === 'A256CBC-HS512') {
		return {
			algorithm: 'aes-256-cbc',
			hash: 'sha512',
			encKeyLength: 32,
			macKeyLength: 32,
			tagLength: 32,
		};
	}

	throw new NodeOperationError(
		context.getNode(),
		`Unsupported encrypted payload content algorithm: ${encryption ?? 'unknown'}`,
		{ itemIndex },
	);
}

function decryptGcmContent(
	context: IExecuteFunctions,
	itemIndex: number,
	header: JweHeader,
	contentEncryptionKey: Buffer,
	aad: Buffer,
	iv: Buffer,
	ciphertext: Buffer,
	tag: Buffer,
): Buffer {
	try {
		const decipher = createDecipheriv(
			getGcmAlgorithm(context, itemIndex, header.enc),
			contentEncryptionKey,
			iv,
		) as DecipherGCM;
		decipher.setAAD(aad);
		decipher.setAuthTag(tag);
		return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
	} catch (error) {
		throw new NodeOperationError(
			context.getNode(),
			`Could not decrypt GCM payload content: ${(error as Error).message}`,
			{ itemIndex },
		);
	}
}

function aadLengthBuffer(aad: Buffer): Buffer {
	const bitLength = aad.length * 8;
	const buffer = Buffer.alloc(8);
	buffer.writeUInt32BE(Math.floor(bitLength / 0x100000000), 0);
	buffer.writeUInt32BE(bitLength >>> 0, 4);
	return buffer;
}

function decryptCbcHmacContent(
	context: IExecuteFunctions,
	itemIndex: number,
	header: JweHeader,
	contentEncryptionKey: Buffer,
	aad: Buffer,
	iv: Buffer,
	ciphertext: Buffer,
	tag: Buffer,
): Buffer {
	const config = getCbcHmacConfig(context, itemIndex, header.enc);
	const expectedKeyLength = config.macKeyLength + config.encKeyLength;

	if (contentEncryptionKey.length !== expectedKeyLength) {
		throw new NodeOperationError(
			context.getNode(),
			`Invalid content encryption key length for ${header.enc ?? 'unknown'}`,
			{ itemIndex },
		);
	}

	const macKey = contentEncryptionKey.subarray(0, config.macKeyLength);
	const encKey = contentEncryptionKey.subarray(config.macKeyLength);
	const macInput = Buffer.concat([aad, iv, ciphertext, aadLengthBuffer(aad)]);
	const expectedTag = createHmac(config.hash, macKey).update(macInput).digest().subarray(0, config.tagLength);

	if (tag.length !== expectedTag.length || !timingSafeEqual(tag, expectedTag)) {
		throw new NodeOperationError(context.getNode(), 'Encrypted payload authentication tag is invalid', {
			itemIndex,
		});
	}

	try {
		const decipher = createDecipheriv(config.algorithm, encKey, iv);
		return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
	} catch (error) {
		throw new NodeOperationError(
			context.getNode(),
			`Could not decrypt CBC payload content: ${(error as Error).message}`,
			{ itemIndex },
		);
	}
}

function decryptCompactJwe(
	context: IExecuteFunctions,
	itemIndex: number,
	encryptionKey: JsonObject,
	encryptedPayload: string,
): string {
	const parts = encryptedPayload.split('.');
	if (parts.length !== 5) {
		throw new NodeOperationError(context.getNode(), 'Encrypted payload must be a compact JWE string', {
			itemIndex,
		});
	}

	const [protectedHeader, encryptedKey, iv, ciphertext, tag] = parts;
	const header = parseJweHeader(context, itemIndex, protectedHeader);
	const contentEncryptionKey = decryptContentEncryptionKey(
		context,
		itemIndex,
		encryptionKey,
		header,
		base64UrlDecode(encryptedKey),
	);
	const aad = Buffer.from(protectedHeader);
	const ivBuffer = base64UrlDecode(iv);
	const ciphertextBuffer = base64UrlDecode(ciphertext);
	const tagBuffer = base64UrlDecode(tag);
	const plaintext = String(header.enc ?? '').includes('GCM')
		? decryptGcmContent(
			context,
			itemIndex,
			header,
			contentEncryptionKey,
			aad,
			ivBuffer,
			ciphertextBuffer,
			tagBuffer,
		)
		: decryptCbcHmacContent(
			context,
			itemIndex,
			header,
			contentEncryptionKey,
			aad,
			ivBuffer,
			ciphertextBuffer,
			tagBuffer,
		);

	return plaintext.toString('utf8');
}

export async function decryptRdConversasPayload(
	context: IExecuteFunctions,
	itemIndex: number,
	encryptedPayload: string,
): Promise<JsonValue> {
	const credentials = await getRdConversasCredentials(context, itemIndex);
	const encryptionKey = parseEncryptionKey(context, itemIndex, credentials.encryptionKey);

	try {
		return parseDecryptedPayload(decryptCompactJwe(context, itemIndex, encryptionKey, encryptedPayload));
	} catch (error) {
		throw new NodeOperationError(
			context.getNode(),
			`Could not decrypt RD Station Conversas payload: ${(error as Error).message}`,
			{ itemIndex },
		);
	}
}
