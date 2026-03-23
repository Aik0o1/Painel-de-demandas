
interface ApiRequestOptions extends RequestInit {
    data?: any;
    responseType?: 'json' | 'text' | 'blob';
}

import { getSession } from 'next-auth/react';

let sessionPromise: Promise<any> | null = null;
let cachedEmail: string | null = null;
let lastFetchTime = 0;

const getHeaders = async (): Promise<HeadersInit> => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    const now = Date.now();

    // Cache for 2 minutes to prevent spamming `/api/auth/session`
    if (!cachedEmail || (now - lastFetchTime) > 120000) {
        if (!sessionPromise) {
            sessionPromise = getSession().then(session => {
                cachedEmail = session?.user?.email || null;
                lastFetchTime = Date.now();
                sessionPromise = null; // reset fetching state
                return cachedEmail;
            });
        }
        await sessionPromise;
    }

    if (cachedEmail) {
        headers['X-User-Email'] = cachedEmail;
    }

    return headers;
};

import { toast } from 'sonner';

const handleResponse = async (response: Response, responseType?: string) => {
    if (response.status === 401) {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth:logout'));
        }
        throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (!response.ok) {
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        const data = isJson ? await response.json() : await response.text();
        const error = (data && data.message) || response.statusText;
        throw new Error(error);
    }

    if (responseType === 'blob') {
        return await response.blob();
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    return isJson ? await response.json() : await response.text();
};

const apiRequest = async (endpoint: string, method: string, options: ApiRequestOptions = {}) => {
    const { data, ...customConfig } = options;

    const baseHeaders = await getHeaders();
    const headers = { ...baseHeaders, ...customConfig.headers };

    const config: RequestInit = {
        method,
        headers,
        ...customConfig,
    };

    if (data) {
        if (data instanceof FormData) {
            // Let browser set Content-Type with boundary for FormData
            // @ts-ignore
            delete config.headers['Content-Type'];
            config.body = data;
        } else {
            config.body = JSON.stringify(data);
        }
    }

    // Ensure endpoint starts with /api if not present (optional safety, but assuming caller passes endpoint relative to /api or we treat all as /api)
    // Strategy: We will assume 'endpoint' passed is like '/auth/login' or 'auth/login'. 
    // We will prepend '/api/' if it's missing, OR just use it relative to root if it already has /api.

    // Better strategy for Next.js Pages router:
    // If endpoint starts with '/', use it as is (assuming it points to /api/...).
    // Actually, identifying the base URL is tricky if passed inconsistently.
    // Let's standardise: Caller passes '/auth/login', we map to '/api/auth/login' usually? 
    // Looking at previous code: "apiGet('/registry/stats...')" -> "fetch(`${BASE_URL}/${cleanEndpoint}`)" where base was 3333.
    // Since we are now using Next.js internal API, we should target `/api/${cleanEndpoint}`.

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `/api/${cleanEndpoint}`;

    try {
        const response = await fetch(url, config);
        return await handleResponse(response, options.responseType);
    } catch (error: any) {
        console.error(`API Call Failed (${method} ${endpoint}):`, error);
        if (!error.message.includes('Sessão expirada')) {
            toast.error(error.message || 'Erro de conexão com o servidor');
        }
        throw error;
    }
};

export const apiGet = (endpoint: string, options: ApiRequestOptions = {}) =>
    apiRequest(endpoint, 'GET', options);

export const apiGetBlob = (endpoint: string, options: ApiRequestOptions = {}) =>
    apiRequest(endpoint, 'GET', { ...options, responseType: 'blob' });

export const apiPost = (endpoint: string, data: any, options: ApiRequestOptions = {}) =>
    apiRequest(endpoint, 'POST', { ...options, data });

export const apiPut = (endpoint: string, data: any, options: ApiRequestOptions = {}) =>
    apiRequest(endpoint, 'PUT', { ...options, data });

export const apiPatch = (endpoint: string, data: any, options: ApiRequestOptions = {}) =>
    apiRequest(endpoint, 'PATCH', { ...options, data });

export const apiDelete = (endpoint: string, options: ApiRequestOptions = {}) =>
    apiRequest(endpoint, 'DELETE', options);
