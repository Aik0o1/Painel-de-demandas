"use client";

import { useEffect } from "react";
import { SessionProvider, signOut } from "next-auth/react";

/**
 * services/api.ts dispara "auth:logout" quando o backend responde 401
 * (sessão expirada ou encerrada pelo administrador). Sem este listener o
 * usuário continuava na tela vendo apenas erros.
 */
function LogoutOnUnauthorized() {
    useEffect(() => {
        let signingOut = false;
        const handler = () => {
            if (signingOut) return;
            signingOut = true;
            signOut({ callbackUrl: "/login" });
        };
        window.addEventListener("auth:logout", handler);
        return () => window.removeEventListener("auth:logout", handler);
    }, []);
    return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <LogoutOnUnauthorized />
            {children}
        </SessionProvider>
    );
}
