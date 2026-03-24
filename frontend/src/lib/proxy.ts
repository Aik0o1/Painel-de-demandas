import { NextResponse } from 'next/server';

const FASTAPI_BASE = process.env.FASTAPI_URL || 'http://127.0.0.1:8001';

/**
 * Faz proxy de um Request do Next.js para o FastAPI backend.
 * Preserva método, body RAW (bytes), headers e query string.
 */
export async function proxyToFastAPI(request: Request, pathOverride?: string): Promise<NextResponse> {
    try {
        const url = new URL(request.url);
        const targetPath = pathOverride ?? url.pathname;
        // Remove query string se pathOverride já contém, senão preserva
        const hasQueryInOverride = pathOverride && pathOverride.includes('?');
        const targetUrl = hasQueryInOverride
            ? `${FASTAPI_BASE}${targetPath}`
            : `${FASTAPI_BASE}${targetPath}${url.search}`;

        const headers: Record<string, string> = {};

        // Forward essential headers and authentication
        const forwardHeaders = ['content-type', 'accept', 'authorization', 'x-user-email'];
        request.headers.forEach((value, key) => {
            const lowKey = key.toLowerCase();
            if (forwardHeaders.includes(lowKey) || lowKey.startsWith('x-')) {
                headers[lowKey] = value;
            }
        });

        // Lê body como ArrayBuffer (bytes crus) para não alterar o encoding
        let body: BodyInit | null = null;
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            const buffer = await request.arrayBuffer();
            if (buffer.byteLength > 0) {
                body = buffer;
            }
        }

        const response = await fetch(targetUrl, {
            method: request.method,
            headers,
            body,
        });

        let responseData: any;
        const respContentType = response.headers.get('content-type') || '';
        if (respContentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = { message: await response.text() };
        }

        return NextResponse.json(responseData, { status: response.status });
    } catch (error: any) {
        console.error('[Proxy Error]', error.message);
        return NextResponse.json(
            { error: 'Erro ao conectar com o backend Python', details: error.message },
            { status: 502 }
        );
    }
}
