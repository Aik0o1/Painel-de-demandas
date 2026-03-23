import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/services/api';
import { useAuth } from './useAuth';

export interface DashboardMetrics {
    counts: {
        total: number;
        completion_rate: number;
        in_progress: number;
        pending: number;
    };
    trend: Array<{
        date: string;
        total: number;
        completed: number;
    }>;
}

export function useDashboardMetrics() {
    const { user } = useAuth();

    const { data: metrics, isLoading, error } = useQuery({
        queryKey: ['dashboard-metrics'],
        queryFn: async () => {
            // Endpoint specified by user
            return apiGet('/dashboard/metrics');
        },
        enabled: !!user,
    });

    return { metrics, isLoading, error };
}
