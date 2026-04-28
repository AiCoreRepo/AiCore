import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, CreditCard, UserX, UserCheck, RefreshCw } from 'lucide-react';
import { CreatorStatusBadge } from '@/components/admin/creators/CreatorStatusBadge';
import { CreatorDetail } from '@/api/admin-creators.api';
import { cn } from '@/utils/cn';
import { animations } from '@/constants/theme';

interface Props {
  detail: CreatorDetail;
  onBack: () => void;
  onToggleStatus: () => void;
  onPay: () => void;
  isToggling: boolean;
}

export const CreatorDetailHeader = memo<Props>(({ detail, onBack, onToggleStatus, onPay, isToggling }) => (
  <motion.div
    variants={animations.fadeIn}
    initial="initial"
    animate="animate"
    className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6"
  >
    {/* Back */}
    <button
      onClick={onBack}
      className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-100 transition-colors self-start"
    >
      <ArrowLeft className="w-4 h-4" />
      Creator Management
    </button>

    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
          <span className="text-[#D4AF37] font-bold text-2xl">
            {detail.store_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-100">{detail.store_name}</h1>
            {detail.verified && <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <CreatorStatusBadge isActive={detail.is_active} size="sm" />
            <span className="text-xs text-neutral-500 font-mono">/@{detail.store_slug}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="sm:ml-auto flex items-center gap-3 flex-wrap">
        <button
          onClick={onPay}
          className="px-5 py-2 rounded-xl text-sm font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-black transition-all duration-200 flex items-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          Pay Creator
        </button>

        <button
          onClick={onToggleStatus}
          disabled={isToggling}
          className={cn(
            'px-5 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 flex items-center gap-2 disabled:opacity-50',
            detail.is_active
              ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
          )}
        >
          {isToggling ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : detail.is_active ? (
            <UserX className="w-4 h-4" />
          ) : (
            <UserCheck className="w-4 h-4" />
          )}
          {detail.is_active ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  </motion.div>
));
CreatorDetailHeader.displayName = 'CreatorDetailHeader';
