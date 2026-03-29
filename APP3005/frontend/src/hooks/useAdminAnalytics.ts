import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAnalyticsOverview,
  fetchCreatorsAnalytics,
  fetchCreatorAnalyticsDetails,
  createAdminPayout,
} from '../api/admin-analytics.api';
import { ADMIN_ANALYTICS_QUERY_KEYS } from '../constants/admin-analytics.constants';
import { CreatePayoutPayload } from '../types/admin-analytics.types';
import { toast } from 'sonner';

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ADMIN_ANALYTICS_QUERY_KEYS.OVERVIEW,
    queryFn: fetchAnalyticsOverview,
    staleTime: 1000 * 60 * 5, // 5 mins
  });
}

export function useCreatorsAnalytics() {
  return useQuery({
    queryKey: ADMIN_ANALYTICS_QUERY_KEYS.CREATORS_ANALYTICS,
    queryFn: fetchCreatorsAnalytics,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreatorAnalyticsDetails(creatorId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ADMIN_ANALYTICS_QUERY_KEYS.CREATOR_DETAILS(creatorId),
    queryFn: () => fetchCreatorAnalyticsDetails(creatorId),
    enabled: !!creatorId && enabled,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreatePayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePayoutPayload) => createAdminPayout(payload),
    onSuccess: (_, variables) => {
      toast.success('Payout processed successfully');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ADMIN_ANALYTICS_QUERY_KEYS.OVERVIEW });
      queryClient.invalidateQueries({ queryKey: ADMIN_ANALYTICS_QUERY_KEYS.CREATORS_ANALYTICS });
      queryClient.invalidateQueries({ queryKey: ADMIN_ANALYTICS_QUERY_KEYS.CREATOR_DETAILS(variables.creatorId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to process payout');
    },
  });
}
