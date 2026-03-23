import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export const metadata: Metadata = {
    title: "PAINEL DE DEMANDAS",
    description: "Internal Demand Management System",
    icons: {
        icon: '/favicon.ico',
    }
};

import { AuthProvider as LegacyAuthProvider } from "@/contexts/AuthContext";

// ... existing imports

import { QueryProvider } from "@/components/providers/query-provider";

// ... existing imports

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-br" suppressHydrationWarning>
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            </head>
            <body className={`${montserrat.variable} ${montserrat.className} font-sans`}>
                <QueryProvider>
                    <AuthProvider>
                        <LegacyAuthProvider>
                            <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
                                {children}
                                <Toaster />
                            </ThemeProvider>
                        </LegacyAuthProvider>
                    </AuthProvider>
                </QueryProvider>
            </body>
        </html>
    );
}
