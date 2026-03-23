import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/services/api';

export interface Sector {
    id: string;
    name: string;
    slug: string;
}

export function useSectors() {
    const { data: sectors, isLoading, error } = useQuery({
        queryKey: ['sectors'],
        queryFn: async () => {
            return apiGet('/sectors');
        },
    });

    return { sectors: sectors || [], isLoading, error };
}
