import type {
	ICredentialDataDecryptedObject,
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IWebhookFunctions,
} from 'n8n-workflow';

type FullResponse = {
	body?: unknown;
	headers?: IDataObject;
	statusCode?: number;
	statusMessage?: string;
};

const DEFAULT_BASE_URLS = {
	production: 'https://api.tallos.com.br',
	legacy: 'https://api.megasac.tallos.com.br',
} as const;

type EnvironmentContext =
	| Pick<IExecuteFunctions, 'getCredentials'>
	| Pick<ILoadOptionsFunctions, 'getCredentials'>
	| Pick<IHookFunctions, 'getCredentials'>
	| Pick<IWebhookFunctions, 'getCredentials'>;

async function getCredentialsSafely(
	context: EnvironmentContext,
	itemIndex: number,
): Promise<ICredentialDataDecryptedObject | undefined> {
	try {
		return (await context.getCredentials('rdConversasApi', itemIndex)) as ICredentialDataDecryptedObject;
	} catch {
		try {
			return (await context.getCredentials('rdConversasApi')) as ICredentialDataDecryptedObject;
		} catch {
			return undefined;
		}
	}
}

function normalizeBaseUrl(value: unknown): string | undefined {
	const raw = String(value ?? '').trim().replace(/\/$/, '');
	return raw || undefined;
}

export async function getRdConversasBaseUrl(context: EnvironmentContext, itemIndex = 0): Promise<string> {
	const credentials = await getCredentialsSafely(context, itemIndex);
	if (credentials) {
		const explicitBaseUrl = normalizeBaseUrl(credentials.baseUrl);
		if (explicitBaseUrl) return explicitBaseUrl;

		const environment = String(credentials.environment ?? 'production');
		if (environment === 'legacy') return DEFAULT_BASE_URLS.legacy;
	}

	return DEFAULT_BASE_URLS.production;
}

export async function rdConversasRequest(
	context: IExecuteFunctions,
	credentialName: string,
	options: IHttpRequestOptions,
): Promise<IDataObject | IDataObject[]> {
	const req: IHttpRequestOptions = {
		...options,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
	};

	try {
		const res = (await context.helpers.httpRequestWithAuthentication.call(
			context,
			credentialName,
			req,
		)) as FullResponse;

		const statusCode = typeof res.statusCode === 'number' ? res.statusCode : null;
		const body = res.body ?? res;

		if (typeof statusCode === 'number' && statusCode >= 400) {
			return {
				_error_debug: true,
				message: `HTTP ${statusCode}`,
				statusCode,
				requestUrl: options.url,
				requestQs: options.qs ?? {},
				responseBody: body ?? 'No body',
			} as IDataObject;
		}

		return body as IDataObject | IDataObject[];
	} catch (error) {
		const err = (error ?? {}) as { code?: string; message?: string };
		return {
			_error_debug: true,
			message: err?.message ?? 'Request failed (no HTTP response)',
			requestUrl: options.url,
			requestQs: options.qs ?? {},
			errorCode: err?.code ?? null,
		} as IDataObject;
	}
}
