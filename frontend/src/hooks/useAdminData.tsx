import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/services/api';
import { useAuth } from './useAuth';

export interface AuditLog {
    id: number;
    action: string;
    entity_table: string;
    entity_id: number;
    details: string; // We might need to map this from JSON old_values/new_values or strict action types
    ip_address: string;
    created_at: string;
    user_id: number; // The Schema uses INT for user_id, but the join will be needed to get names
    user?: {
        full_name: string;
        email: string;
    };
}

export function useAdminData() {
    const { user } = useAuth();

    const { data: dashboardData, isLoading, error } = useQuery({
        queryKey: ['admin', 'dashboard'],
        queryFn: async () => {
            return apiGet('/admin/dashboard');
        },
        enabled: !!user,
    });

    const auditLogs = dashboardData?.auditLogs || [];
    const reportStats = dashboardData?.reportCountWeek || 0;
    const auditStats = dashboardData?.auditCountToday || 0;

    return {
        auditLogs,
        isLoadingLogs: isLoading,
        reportCountWeek: reportStats,
        auditCountToday: auditStats,
        isLoadingStats: isLoading
    };
}
