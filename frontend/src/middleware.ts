import { getToken, JWT } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const SECURE_COOKIE = "__Secure-next-auth.session-token";
const PLAIN_COOKIE = "next-auth.session-token";

/**
 * Lê a sessão do NextAuth. O nome do cookie depende de o site rodar em HTTPS
 * ("__Secure-" prefixado) ou não; como o domínio não é fixo (AUTH_TRUST_HOST),
 * detectamos pelo cookie presente em vez de depender de NEXTAUTH_URL.
 */
async function readSession(req: NextRequest): Promise<JWT | null> {
    const secureCookie = req.cookies.has(SECURE_COOKIE);
    return getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie,
        cookieName: secureCookie ? SECURE_COOKIE : PLAIN_COOKIE,
    });
}

/** Token curto (HS256) que o FastAPI valida em core/security.py. */
async function signBackendToken(session: JWT): Promise<string> {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    // sid permite ao backend recusar sessões encerradas pelo admin ou no logout.
    return new SignJWT({ email: session.email, role: session.role, sid: session.sessionId ?? null })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(String(session.id ?? session.sub ?? ""))
        .setIssuedAt()
        .setExpirationTime("5m")
        .sign(secret);
}

export async function middleware(req: NextRequest) {
    const { pathname, search } = req.nextUrl;

    // Rotas do próprio NextAuth (login, csrf, session...) passam direto.
    if (pathname.startsWith("/api/auth/")) {
        return NextResponse.next();
    }

    const session = await readSession(req);

    // Chamadas à API Python (o rewrite em next.config.mjs repassa para o FastAPI).
    if (pathname.startsWith("/api/")) {
        const headers = new Headers(req.headers);
        // Nunca confiar em identidade enviada pelo navegador.
        headers.delete("x-user-email");
        headers.delete("authorization");
        if (session?.email) {
            headers.set("authorization", `Bearer ${await signBackendToken(session)}`);
        }
        return NextResponse.next({ request: { headers } });
    }

    if (!session) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
        return NextResponse.redirect(loginUrl);
    }

    const response = NextResponse.next();
    // Evita que o "voltar" do navegador mostre páginas protegidas após o logout.
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
}

// O Next exige um matcher literal (análise estática). Páginas listadas aqui
// exigem sessão; sem ela o usuário vai para /login.
export const config = {
    matcher: [
        "/api/:path*",
        "/dashboard/:path*",
        "/demands/:path*",
        "/admin/:path*",
        "/analytics/:path*",
        "/reports/:path*",
        "/sectors/:path*",
        "/financeiro/:path*",
    ],
};
