import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut, apiPost } from '@/services/api';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;

  full_name: string | null;
  email: string | null;
  image: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  role: 'MASTER_ADMIN' | 'DIRECTOR' | 'MANAGER' | 'COORDINATOR' | 'ANALYST';
  sector_id: string | null;
  cpf?: string;
  position?: string;
  function?: string;
  status_updated_at?: string;
  status_updated_by?: string;
  created_at: string;
  updated_at: string;
}

export function useProfiles() {
  const { user } = useAuth();

  const { data: profiles = [], isLoading, error } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const data = await apiGet('/profiles');
      console.log('API /profiles raw data:', data);
      return data;
    },
    enabled: !!user,
  });

  return { profiles, isLoading, error };
}

export function useCurrentProfile() {
  const { user } = useAuth();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', user?.email],
    queryFn: async () => {
      if (!user) return null;
      return apiGet('/profile/me');
    },
    enabled: !!user,
  });

  const queryClient = useQueryClient();

  const updateProfile = useMutation<any, Error, Partial<Profile>>({
    mutationFn: async (updates) => {
      if (!user) throw new Error('Not authenticated');
      return apiPost('/profile/update', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.refetchQueries({ queryKey: ['profile', user?.email] });
    },
  });

  const uploadAvatar = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!user) throw new Error('Not authenticated');
      return apiPost('/profile/upload', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.refetchQueries({ queryKey: ['profile', user?.email] });
    },
  });

  const changePassword = useMutation<any, Error, any>({
    mutationFn: async (data) => {
      if (!user) throw new Error('Not authenticated');
      return apiPost('/profile/change-password', data);
    },
  });

  return { profile, isLoading, error, updateProfile, uploadAvatar, changePassword };
}

