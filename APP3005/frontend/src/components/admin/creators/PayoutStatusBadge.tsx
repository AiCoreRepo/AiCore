import React from 'react';
import type { PayoutStatus } from '../../../api/admin-payout.api';

const CONFIG: Record<
  PayoutStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PENDING:    { label: 'Pending',    bg: 'bg-yellow-500/10',  text: 'text-yellow-400',  dot: 'bg-yellow-400'  },
  PROCESSING: { label: 'Processing', bg: 'bg-blue-500/10',    text: 'text-blue-400',    dot: 'bg-blue-400'    },
  SUCCESS:    { label: 'Paid',       bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  FAILED:     { label: 'Failed',     bg: 'bg-red-500/10',     text: 'text-red-400',     dot: 'bg-red-400'     },
  CANCELLED:  { label: 'Cancelled',  bg: 'bg-neutral-500/10', text: 'text-neutral-400', dot: 'bg-neutral-400' },
};

interface Props {
  status: PayoutStatus;
  size?:  'sm' | 'md';
}

export const PayoutStatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const c   = CONFIG[status] ?? CONFIG.PENDING;
  const cls = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${c.bg} ${c.text} ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};
