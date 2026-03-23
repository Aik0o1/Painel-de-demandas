import { useCurrentProfile } from "./useProfiles";

export function usePermissions() {
    const { profile, isLoading } = useCurrentProfile();

    const can = (module: string, action: 'read' | 'create' | 'update' | 'delete') => {
        if (isLoading || !profile) return false;

        // Master Admin can do everything
        if (profile.role === 'MASTER_ADMIN') return true;

        const permissions = profile.permissions || {};
        const modulePerms = permissions[module] || {};

        return !!modulePerms[action];
    };

    return { can, isLoading, profile };
}
