import React, { memo, useMemo } from 'react';
import { Package, CheckCircle, Clock, X, TrendingUp } from 'lucide-react';
import { CreatorDetail } from '@/api/admin-creators.api';
import { cn } from '@/utils/cn';

interface Props {
  detail: CreatorDetail;
}

export const CreatorSummaryCards = memo<Props>(({ detail }) => {
  const formatINR = (paise: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);

  const stats = useMemo(() => [
    {
      label: 'Total Sales',
      value: detail.total_sales_formatted ?? formatINR(detail.total_sales || 0),
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Total Products',
      value: detail.product_summary.total,
      icon: Package,
      color: 'text-[#D4AF37]',
      bg: 'bg-[#D4AF37]/10',
      border: 'border-[#D4AF37]/20',
    },
    {
      label: 'Approved',
      value: detail.product_summary.approved,
      icon: CheckCircle,
      color: 'text-neutral-300',
      bg: 'bg-white/5',
      border: 'border-white/10',
    },
    {
      label: 'Pending',
      value: detail.product_summary.pending,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      label: 'Rejected',
      value: detail.product_summary.rejected,
      icon: X,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    },
  ], [detail]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            'flex items-center gap-3 p-4 rounded-2xl border bg-black/20',
            stat.border,
          )}
        >
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', stat.bg)}>
            <stat.icon className={cn('w-5 h-5', stat.color)} />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-bold text-neutral-100 truncate">{stat.value}</p>
            <p className="text-xs text-neutral-500">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
});
CreatorSummaryCards.displayName = 'CreatorSummaryCards';
