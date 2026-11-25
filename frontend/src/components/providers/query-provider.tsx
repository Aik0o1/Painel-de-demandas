"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Sem staleTime, cada componente que monta (e cada foco de janela)
                // refazia a mesma requisição, estourando o rate limit do backend.
                staleTime: 30_000,
                refetchOnWindowFocus: false,
                retry: 1,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
