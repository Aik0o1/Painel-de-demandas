import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/services/api';
import { useAuth } from './useAuth';

export interface AuditLogItem {
    id: string; // Mongoose _id or virtual id
    _id?: string;
    userId?: string;
    userName?: string;
    userEmail?: string;
    actor_name?: string; // Legacy fallback
    action: string;
    module: string;
    resource?: string; // Legacy fallback
    ipAddress?: string;
    ip_address?: string; // Legacy fallback
    userAgent?: string;
    description?: string;
    details?: any; // Legacy or diff
    metadata?: any;
    createdAt: string;
    created_at?: string; // Legacy fallback
}

export function useAuditLogs() {
    const { user } = useAuth();

    // Only fetch if user is admin - though API should enforce it too
    const isAdmin = user?.role === 'MASTER_ADMIN' || user?.role === 'DIRECTOR';

    const { data: logs = [], isLoading, error } = useQuery({
        queryKey: ['audit-logs'],
        queryFn: async () => {
            return apiGet('/audit-logs');
        },
        enabled: !!user, // We let the API handle 403 if not admin, or we can gate here
    });

    return { logs, isLoading, error };
}
