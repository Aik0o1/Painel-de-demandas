"use client";

import { useCurrentProfile } from "@/hooks/useProfiles";
import { useSectors } from "@/hooks/useSectors";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles?: string[];
    allowedSectorSlugs?: string[];
}

export function RoleGuard({ children, allowedRoles, allowedSectorSlugs }: RoleGuardProps) {
    const { status } = useSession();
    const { profile, isLoading: isProfileLoading } = useCurrentProfile();
    const { sectors, isLoading: isSectorsLoading } = useSectors();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        if (status === "loading" || isProfileLoading || isSectorsLoading) {
            return;
        }

        if (status === "unauthenticated" || !profile) {
            router.push("/login");
            return;
        }

        // Master Admins always have access
        if (profile.role === "MASTER_ADMIN") {
            setIsAuthorized(true);
            return;
        }

        let hasRoleAccess = true;
        let hasSectorAccess = true;

        if (allowedRoles && allowedRoles.length > 0) {
            hasRoleAccess = allowedRoles.includes(profile.role);
        }

        if (allowedSectorSlugs && allowedSectorSlugs.length > 0) {
            const userSector = sectors.find((s: any) => s.id === profile.sector_id);
            if (!userSector || !allowedSectorSlugs.includes(userSector.slug)) {
                hasSectorAccess = false;
            }
        }

        setIsAuthorized(hasRoleAccess && hasSectorAccess);

        // If explicitly denied, we could redirect or just show an error message
        if (!(hasRoleAccess && hasSectorAccess)) {
            // Optional: router.push('/dashboard');
        }
    }, [status, profile, isProfileLoading, sectors, isSectorsLoading, allowedRoles, allowedSectorSlugs, router]);

    if (status === "loading" || isProfileLoading || isSectorsLoading || isAuthorized === null) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p>Verificando permissões de acesso...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="bg-destructive/10 p-6 rounded-full mb-6">
                    <ShieldAlert className="w-16 h-16 text-destructive" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-4">Acesso Negado</h1>
                <p className="text-muted-foreground max-w-md mb-8">
                    Você não tem permissão para acessar esta página. Apenas usuários do setor correspondente ou administradores podem visualizar este conteúdo.
                </p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                    Voltar ao Painel
                </button>
            </div>
        );
    }

    return <>{children}</>;
}
