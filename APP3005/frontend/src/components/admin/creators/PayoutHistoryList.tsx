import React from 'react';
import type { Payout } from '../../../api/admin-payout.api';
import { PayoutStatusBadge } from './PayoutStatusBadge';
import { useCancelPayout } from '../../../hooks/useAdminPayout';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Props {
  payouts:   Payout[];
  creatorId: string;
}

const fmt = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const PayoutHistoryList: React.FC<Props> = ({ payouts, creatorId }) => {
  const { mutate: cancelPayout, isPending } = useCancelPayout(creatorId);

  if (!payouts.length) {
    return (
      <p className="text-center text-neutral-500 text-sm py-6">No payout history yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      {payouts.map((p) => (
        <div
          key={p.payout_id}
          className="flex items-center justify-between gap-3 rounded-xl bg-neutral-950 border border-white/5 px-4 py-3"
        >
          {/* Left — amount + type */}
          <div className="min-w-0">
            <p className="text-white font-semibold">{fmt(Number(p.amount))}</p>
            <p className="text-neutral-500 text-xs mt-0.5">
              {p.payout_type === 'FULL' ? 'Full payout' : 'Partial payout'}
              {p.upi_id ? ` · ${p.upi_id}` : ''}
            </p>
            {p.failure_reason && (
              <p className="text-red-400 text-xs mt-0.5 truncate">{p.failure_reason}</p>
            )}
          </div>

          {/* Right — status + date + cancel */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <PayoutStatusBadge status={p.status} size="sm" />
            <span className="text-neutral-600 text-[11px]">
              {fmtDate(p.completed_at ?? p.initiated_at)}
            </span>
            {p.status === 'PENDING' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 text-[11px]"
                onClick={() => cancelPayout(p.payout_id)}
                disabled={isPending}
              >
                <X className="w-3 h-3 mr-0.5" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
