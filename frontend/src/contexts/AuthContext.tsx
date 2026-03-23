"use client";

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { apiPost } from '@/services/api';
import { toast } from 'sonner';

interface User {
    id: string;
    name: string;
    email: string;
    role?: string;
    avatar?: string;
    image?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => void;
    signUp: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        setIsLoading(status === 'loading');
    }, [status]);

    const signIn = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const result = await nextAuthSignIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                // Handle specific errors if needed, usually "CredentialsSignin"
                toast.error('Email ou senha incorretos.');
                throw new Error(result.error);
            }

            if (result?.ok) {
                toast.success('Login realizado com sucesso!');
                router.push('/dashboard');
            }
        } catch (error) {
            console.error('Login error:', error);
            // Error is already toasted above if it was a credential error.
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        await nextAuthSignOut({ redirect: false });
        // Force a hard reload to clear all client-side state/cache
        window.location.href = '/login';
        toast.message('Você saiu da conta.');
    };

    const signUp = async (email: string, password: string, name: string) => {
        try {
            setIsLoading(true);
            // Keep existing signUp logic if it points to a separate API route like /api/auth/register
            await apiPost('/auth/register', { email, password, name });
            toast.success('Cadastro realizado! Faça login para continuar.');
            router.push('/');
        } catch (error: any) {
            console.error('Signup error:', error);
            // Error handling usually in apiPost
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Map NextAuth session user to Context user
    const user: User | null = session?.user ? {
        id: (session.user as any).id || '',
        name: session.user.name || '',
        email: session.user.email || '',
        role: (session.user as any).role,
        image: session.user.image || '',
        avatar: session.user.image || '' // Backwards compatibility
    } : null;

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!session,
            isLoading,
            signIn,
            signOut,
            signUp
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}
