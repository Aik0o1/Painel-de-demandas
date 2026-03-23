import { useAuth } from "@/hooks/useAuth";
import { useCurrentProfile } from "@/hooks/useProfiles";
import { useRouter } from "next/router";
import { Loader2 } from "lucide-react";
import { useEffect, ReactNode } from "react";
import { toast } from "sonner";

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading: authLoading, signOut } = useAuth();
    const { profile, isLoading: profileLoading } = useCurrentProfile();
    const router = useRouter();

    const loading = authLoading || profileLoading;

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/");
        }
    }, [loading, user, router]);

    useEffect(() => {
        if (!loading && user && profile) {
            const isBanned = profile.status === 'INACTIVE' || profile.status === 'BLOCKED';
            if (isBanned) {
                toast.error("Sua conta não está ativa. Entre em contato com o administrador.");
                signOut();
            }
        }
    }, [loading, user, profile, signOut]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect in useEffect
    }

    if (profile) {
        const isBanned = profile.status === 'INACTIVE' || profile.status === 'BLOCKED';
        if (isBanned) {
            return (
                <div className="flex h-screen w-full items-center justify-center flex-col gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-destructive" />
                    <p className="text-destructive font-semibold">Acesso negado: Conta {profile.status === 'BLOCKED' ? 'Bloqueada' : 'Inativa'}</p>
                </div>
            );
        }
    }

    return <>{children}</>;
}
