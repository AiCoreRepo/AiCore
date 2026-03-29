import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { DollarSign, Package, Banknote, AlertCircle, TrendingUp } from 'lucide-react';
import { useCreatorAnalyticsDetails } from '@/hooks/useAdminAnalytics';
import { PayoutStatus, DEFAULT_CURRENCY } from '@/constants/admin-analytics.constants';
import { animations, typography } from '@/constants/theme';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/badge';

interface Props {
  creatorId: string;
}

export const CreatorFinancialsPanel: React.FC<Props> = ({ creatorId }) => {
  const { data, isLoading, isError } = useCreatorAnalyticsDetails(creatorId);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: DEFAULT_CURRENCY }).format(val);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case PayoutStatus.COMPLETED:
        return 'default'; // standard shadcn might map to black/white
      case PayoutStatus.PENDING:
        return 'secondary';
      case PayoutStatus.FAILED:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-20 bg-red-500/5 rounded-2xl border border-red-500/20">
        <p className="text-red-400">Failed to load financial details. Please try again later.</p>
      </div>
    );
  }

  const summaryCards = [
    {
      label: 'Platform to Creator (Lifetime)',
      value: formatCurrency(data.summary.creator_earnings),
      icon: TrendingUp,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'Amount Paid',
      value: formatCurrency(data.summary.total_paid),
      icon: Banknote,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Remaining to Pay',
      value: formatCurrency(data.summary.pending_balance),
      icon: DollarSign,
      color: 'text-[#D4AF37]',
      bg: 'bg-[#D4AF37]/10 border-[#D4AF37]/20',
    },
    {
      label: 'Units Sold',
      value: data.summary.units_sold,
      icon: Package,
      color: 'text-neutral-300',
      bg: 'bg-neutral-500/10 border-neutral-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'flex items-center gap-4 p-5 rounded-2xl border bg-black/20',
              stat.bg,
            )}
          >
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', stat.bg)}>
              <stat.icon className={cn('w-5 h-5', stat.color)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-100">{stat.value}</p>
              <p className="text-xs text-neutral-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Product Breakdown Box */}
        <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-neutral-100 mb-4" style={{ fontFamily: typography.fontSerif }}>
            Product Sales Breakdown
          </h3>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-neutral-400 uppercase bg-white/5">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Units Sold</th>
                  <th className="px-4 py-3 rounded-r-lg font-medium text-right">Total Net Sales</th>
                </tr>
              </thead>
              <tbody>
                {data.product_breakdown.map((prod) => (
                  <tr key={prod.product_id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-neutral-200">
                      <div className="truncate max-w-[200px]" title={prod.product_name}>{prod.product_name}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-300">{prod.units_sold}</td>
                    <td className="px-4 py-3 text-right text-[#D4AF37] font-semibold">{formatCurrency(prod.total_sales)}</td>
                  </tr>
                ))}
                {data.product_breakdown.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-neutral-500 italic">
                      No products sold yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payout History Box */}
        <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-neutral-100 mb-4" style={{ fontFamily: typography.fontSerif }}>
            Payout Ledger
          </h3>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-neutral-400 uppercase bg-white/5">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium uppercase text-right rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.payout_history.map((payout) => (
                  <tr key={payout.payout_id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-neutral-400">
                      {format(new Date(payout.created_at), 'dd MMM yyyy, HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-neutral-200 font-semibold">{formatCurrency(payout.amount)}</td>
                    <td className="px-4 py-3 text-right">
                       <Badge variant={getStatusBadgeVariant(payout.status)} className={cn(
                           payout.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 
                           payout.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : ''
                       )}>
                         {payout.status}
                       </Badge>
                    </td>
                  </tr>
                ))}
                {data.payout_history.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-neutral-500 italic">
                      No past payouts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
