import React, { useMemo } from 'react';
import { DollarSign, Landmark, TrendingUp, Package } from 'lucide-react';
import { AnalyticsOverview } from '../../../types/admin-analytics.types';
import { DEFAULT_CURRENCY } from '../../../constants/admin-analytics.constants';
import { animations } from '../../../constants/theme';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';

interface Props {
  data?: AnalyticsOverview;
  isLoading: boolean;
}

export const AnalyticsOverviewCards: React.FC<Props> = ({ data, isLoading }) => {
  const cards = useMemo(() => {
    return [
      {
        title: 'Total Platform Sales',
        value: data?.total_sales ?? 0,
        icon: TrendingUp,
        currency: true,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/20',
      },
      {
        title: 'Platform Commission',
        value: data?.platform_commission ?? 0,
        icon: Landmark,
        currency: true,
        color: 'text-[#D4AF37]',
        bg: 'bg-[#D4AF37]/10 border-[#D4AF37]/20',
      },
      {
        title: 'Creator Earnings',
        value: data?.creator_earnings ?? 0,
        icon: DollarSign,
        currency: true,
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/10 border-indigo-500/20',
      },
      {
        title: 'Total Units Sold',
        value: data?.units_sold ?? 0,
        icon: Package,
        currency: false,
        color: 'text-neutral-300',
        bg: 'bg-neutral-500/10 border-neutral-500/20',
      },
    ];
  }, [data]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: DEFAULT_CURRENCY,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 p-5 rounded-2xl border bg-black/20 border-white/5 animate-pulse">
            <div className="w-11 h-11 rounded-xl bg-white/5"></div>
            <div className="space-y-2">
              <div className="h-5 w-20 bg-white/5 rounded"></div>
              <div className="h-3 w-16 bg-white/5 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={animations.fadeIn}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={cn(
                'flex items-center gap-4 p-5 rounded-2xl border bg-black/20',
                card.bg
            )}
          >
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', card.bg)}>
                <Icon className={cn('w-5 h-5', card.color)} />
            </div>
            <div>
                <p className="text-2xl font-bold text-neutral-100">
                    {card.currency ? formatCurrency(card.value) : card.value}
                </p>
                <p className="text-xs text-neutral-500">{card.title}</p>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
};
