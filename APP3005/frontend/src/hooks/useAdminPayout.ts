import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  initiateCreatorPayout,
  fetchCreatorPayoutSummary,
  cancelCreatorPayout,
  createManualPayoutEntry,
  InitiatePayoutPayload,
  ManualPayoutEntryPayload,
} from '../api/admin-payout.api';
import { toast } from 'sonner';

// ── Query Keys ─────────────────────────────────────────────────────────────────

export const PAYOUT_QUERY_KEYS = {
  summary: (creatorId: string) => ['admin', 'payouts', 'creator', creatorId] as const,
};

// ── Hooks ──────────────────────────────────────────────────────────────────────

/**
 * Fetches total_earnings, total_paid, pending_balance, and payout history.
 */
export function useCreatorPayoutSummary(
  creatorId: string,
  page  = 1,
  limit = 20,
) {
  return useQuery({
    queryKey: [...PAYOUT_QUERY_KEYS.summary(creatorId), page, limit],
    queryFn:  () => fetchCreatorPayoutSummary(creatorId, page, limit),
    enabled:  !!creatorId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Initiates a payout via PayU and invalidates the creator's summary.
 */
export function useInitiatePayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InitiatePayoutPayload) => initiateCreatorPayout(payload),
    onSuccess: (_, variables) => {
      toast.success('Payout initiated — status: PROCESSING');
      queryClient.invalidateQueries({
        queryKey: PAYOUT_QUERY_KEYS.summary(variables.creatorId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to initiate payout');
    },
  });
}

/**
 * Cancels a PENDING payout and re-fetches the creator's summary.
 */
export function useCancelPayout(creatorId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payoutId: string) => cancelCreatorPayout(payoutId),
    onSuccess: () => {
      toast.success('Payout cancelled');
      queryClient.invalidateQueries({
        queryKey: PAYOUT_QUERY_KEYS.summary(creatorId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel payout');
    },
  });
}

/**
 * Creates a manual payout ledger entry and re-fetches creator summary.
 */
export function useCreateManualPayout(creatorId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ManualPayoutEntryPayload) => createManualPayoutEntry(payload),
    onSuccess: () => {
      toast.success('Manual payout entry added');
      queryClient.invalidateQueries({
        queryKey: PAYOUT_QUERY_KEYS.summary(creatorId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add manual payout entry');
    },
  });
}
