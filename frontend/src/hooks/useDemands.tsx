import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export type DemandPriority = 'low' | 'medium' | 'high' | 'critical';
export type DemandStatus = 'pending' | 'in_progress' | 'completed';

export interface Demand {
  id: string;
  title: string;
  description: string | null;
  priority: DemandPriority;
  status: DemandStatus;
  created_by: string;
  assigned_to: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DemandWithProfiles extends Demand {
  creator?: { full_name: string | null; email: string | null; image?: string | null };
  assignee?: { full_name: string | null; email: string | null; image?: string | null };
}

interface CreateDemandInput {
  title: string;
  description?: string;
  priority: DemandPriority;
  assigned_to?: string;
  due_date?: string;
}

interface UpdateDemandInput {
  id: string;
  title?: string;
  description?: string;
  priority?: DemandPriority;
  status?: DemandStatus;
  assigned_to?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
}

export function useDemands() {
  const { data: session } = useSession();
  const user = session?.user;
  const queryClient = useQueryClient();

  const { data: demands = [], isLoading, error } = useQuery({
    queryKey: ['demands'],
    queryFn: async () => {
      // apiGet returns parsed JSON directly
      return apiGet('/demands');
    },
    enabled: !!user,
  });

  const createDemand = useMutation({
    mutationFn: async (input: CreateDemandInput) => {
      if (!user) throw new Error('Not authenticated');
      return apiPost('/demands', input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demands'] });
      toast.success('Demand created successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to create demand: ' + error.message);
    },
  });

  const updateDemand = useMutation({
    mutationFn: async ({ id, ...input }: UpdateDemandInput) => {
      return apiPut(`/demands/${id}`, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demands'] });
      toast.success('Demand updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update demand: ' + error.message);
    },
  });

  const deleteDemand = useMutation({
    mutationFn: async (id: string) => {
      return apiDelete(`/demands/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demands'] });
      toast.success('Demand deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete demand: ' + error.message);
    },
  });

  return {
    demands,
    isLoading,
    error,
    createDemand,
    updateDemand,
    deleteDemand,
  };
}
