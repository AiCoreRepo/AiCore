/**
 * useAdminCreators – React Query hooks for creator management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminCreators,
  fetchAdminCreatorById,
  fetchAdminCreatorProducts,
  toggleAdminCreatorStatus,
} from '../api/admin-creators.api';
import {
  CreatorStatusFilter,
  CREATOR_QUERY_KEYS,
  CREATOR_PAGINATION,
} from '../constants/creator-management.constants';

// ── List Hook ─────────────────────────────────────────────────────────────────

export function useAdminCreators(params: {
  search?: string;
  status?: CreatorStatusFilter;
  page?: number;
  limit?: number;
}) {
  const key = CREATOR_QUERY_KEYS.list({
    search: params.search ?? '',
    status: params.status ?? CreatorStatusFilter.ALL,
    page: String(params.page ?? CREATOR_PAGINATION.DEFAULT_PAGE),
    limit: String(params.limit ?? CREATOR_PAGINATION.DEFAULT_LIMIT),
  });

  return useQuery({
    queryKey: key,
    queryFn: () =>
      fetchAdminCreators({
        ...params,
        page: params.page ?? CREATOR_PAGINATION.DEFAULT_PAGE,
        limit: params.limit ?? CREATOR_PAGINATION.DEFAULT_LIMIT,
      }),
    staleTime: 30_000,
  });
}

// ── Detail Hook ───────────────────────────────────────────────────────────────

export function useAdminCreatorById(creatorId: string) {
  return useQuery({
    queryKey: CREATOR_QUERY_KEYS.detail(creatorId),
    queryFn: () => fetchAdminCreatorById(creatorId),
    enabled: !!creatorId,
    staleTime: 30_000,
  });
}

// ── Creator Products Hook ─────────────────────────────────────────────────────

export function useAdminCreatorProducts(
  creatorId: string,
  params: { status?: string; page?: number; limit?: number },
) {
  const key = CREATOR_QUERY_KEYS.products(creatorId, {
    status: params.status ?? 'ALL',
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });

  return useQuery({
    queryKey: key,
    queryFn: () => fetchAdminCreatorProducts(creatorId, params),
    enabled: !!creatorId,
    staleTime: 30_000,
  });
}

// ── Toggle Status Mutation ────────────────────────────────────────────────────

export function useToggleCreatorStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      creatorId,
      action,
    }: {
      creatorId: string;
      action: 'ACTIVE' | 'INACTIVE';
    }) => toggleAdminCreatorStatus(creatorId, action),

    // Optimistic update on the list cache
    onMutate: async ({ creatorId, action }) => {
      await queryClient.cancelQueries({ queryKey: CREATOR_QUERY_KEYS.ALL });

      // Snapshot all creator list queries
      const previousSnapshots: Array<{ key: readonly unknown[]; data: unknown }> = [];
      queryClient.getQueriesData({ queryKey: CREATOR_QUERY_KEYS.ALL }).forEach(([key, data]) => {
        previousSnapshots.push({ key: key as readonly unknown[], data });
      });

      // Optimistically flip is_active on list queries
      queryClient.setQueriesData(
        { queryKey: CREATOR_QUERY_KEYS.ALL },
        (old: any) => {
          if (!old?.creators) return old;
          return {
            ...old,
            creators: old.creators.map((c: any) =>
              c.creator_id === creatorId
                ? { ...c, is_active: action === 'ACTIVE' }
                : c,
            ),
          };
        },
      );

      // Optimistically flip on the detail cache
      queryClient.setQueryData(
        CREATOR_QUERY_KEYS.detail(creatorId),
        (old: any) =>
          old ? { ...old, is_active: action === 'ACTIVE' } : old,
      );

      return { previousSnapshots };
    },

    onError: (_err, _vars, context) => {
      // Rollback all optimistic changes
      context?.previousSnapshots?.forEach(({ key, data }) => {
        queryClient.setQueryData(key, data);
      });
    },

    onSettled: (_data, _err, { creatorId }) => {
      queryClient.invalidateQueries({ queryKey: CREATOR_QUERY_KEYS.ALL });
      queryClient.invalidateQueries({
        queryKey: CREATOR_QUERY_KEYS.detail(creatorId),
      });
    },
  });
}
