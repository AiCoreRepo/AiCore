// ============================================
// PAY CREATOR MODAL — Clean 2-step payout dialog
// Step 1: Choose Full or Custom amount
// Step 2: Fill UPI / Phone / Note and confirm
// ============================================

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Banknote, CreditCard,
  Wallet, TrendingUp, Clock, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreatorListItem } from '@/api/admin-creators.api';
import { useCreatorPayoutSummary } from '@/hooks/useAdminPayout';
import { useCreatorAnalyticsDetails } from '@/hooks/useAdminAnalytics';
import { PayoutType } from '@/api/admin-payout.api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(v);

// ─── Props ───────────────────────────────────────────────────────────────────

interface PayCreatorModalProps {
  isOpen:  boolean;
  onClose: () => void;
  creator: CreatorListItem | null;
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export const PayCreatorModal: React.FC<PayCreatorModalProps> = ({ isOpen, onClose, creator }) => {
  const [payoutType, setPayoutType] = useState<PayoutType>('FULL');
  const [amount,     setAmount]     = useState('');
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const { data: summary, isLoading } = useCreatorPayoutSummary(creator?.creator_id ?? '');
  const { data: analytics } = useCreatorAnalyticsDetails(creator?.creator_id ?? '', !!creator?.creator_id);

  const pendingFromPayout = Number(summary?.pending_balance ?? 0);
  const pendingFromAnalytics = Number(analytics?.summary?.pending_balance ?? 0);
  const pendingBalance = Math.max(pendingFromPayout, pendingFromAnalytics, 0);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      if (pendingBalance > 0) {
        setPayoutType('FULL');
        setAmount(String(pendingBalance));
      } else {
        setPayoutType('PARTIAL');
        setAmount('');
      }
      setErrors({});
    }
  }, [isOpen, pendingBalance]);

  if (!creator) return null;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleTypeChange = (type: PayoutType) => {
    if (type === 'FULL' && pendingBalance <= 0) {
      return;
    }

    setPayoutType(type);
    if (type === 'FULL') {
      setAmount(String(pendingBalance));
      setErrors((p) => ({ ...p, amount: '' }));
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    const raw = amount.trim();
    const num = Number(raw);

    if (!raw) {
      e.amount = 'Please enter amount';
    } else if (!Number.isFinite(num)) {
      e.amount = 'Please enter a valid amount';
    } else if (num <= 0) {
      e.amount = 'Amount must be greater than 0';
    } else if (pendingBalance > 0 && num > pendingBalance) {
      e.amount = `Amount cannot exceed pending balance (${fmt(pendingBalance)})`;
    }

    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    // Redirect to the new payment processing page
    onClose();
    navigate(`/admin-payout-process/${creator.creator_id}`, {
      state: {
        amount: Number(amount),
        payoutType,
        creator,
        pendingBalance
      }
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#0f0f0f] border border-white/10 text-neutral-200 sm:max-w-md p-0 overflow-hidden">

        {/* ── Top gradient bar ── */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300" />

        <div className="px-6 pt-5 pb-6 space-y-5">

          {/* Header */}
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white leading-tight">
                  Pay {creator.store_name}
                </DialogTitle>
                <p className="text-xs text-neutral-500 mt-0.5">Creator payout via PayU</p>
              </div>
            </div>
          </DialogHeader>

          {/* ── Balance strip ── */}
          {isLoading ? (
            <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
          ) : (
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Earnings',  value: fmt(summary?.total_earnings  ?? 0), icon: TrendingUp, gold: false },
                { label: 'Paid Out',  value: fmt(summary?.total_paid      ?? 0), icon: Wallet,     gold: false },
                { label: 'Pending',   value: fmt(pendingBalance),               icon: Clock,      gold: true  },
              ].map(({ label, value, icon: Icon, gold }) => (
                <div
                  key={label}
                  className={`rounded-xl px-3 py-3 border ${gold ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/[0.03] border-white/5'}`}
                >
                  <Icon className={`w-3.5 h-3.5 mx-auto mb-1 ${gold ? 'text-amber-400' : 'text-neutral-500'}`} />
                  <p className={`text-base font-bold leading-none ${gold ? 'text-amber-400' : 'text-neutral-200'}`}>{value}</p>
                  <p className="text-[10px] text-neutral-600 mt-1">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* ══════════════════════════════════════════
              PAYOUT FORM (Single Step)
          ══════════════════════════════════════════ */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Payout Type Toggle */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-400 font-medium">Payout Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange('FULL')}
                  disabled={pendingBalance <= 0}
                  className={`py-2.5 rounded-xl border text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2
                    ${payoutType === 'FULL'
                      ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                      : 'bg-black/40 border-white/10 text-neutral-500 hover:text-neutral-300'}
                    ${pendingBalance <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Banknote className="w-4 h-4" />
                  Full Balance
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('PARTIAL')}
                  className={`py-2.5 rounded-xl border text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2
                    ${payoutType === 'PARTIAL'
                      ? 'bg-white/10 border-white/30 text-white'
                      : 'bg-black/40 border-white/10 text-neutral-500 hover:text-neutral-300'}`}
                >
                  <CreditCard className="w-4 h-4" />
                  Custom Amount
                </button>
              </div>
            </div>

            {/* Amount field */}
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-400 font-medium">Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">₹</span>
                <input
                  type="number"
                  min="1"
                  max={pendingBalance}
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: '' })); }}
                  readOnly={payoutType === 'FULL' && pendingBalance > 0}
                  className={`w-full pl-8 pr-4 py-2.5 rounded-xl bg-black/40 border text-white text-sm font-semibold placeholder:text-neutral-500
                    focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/40 transition-all
                    ${payoutType === 'FULL' && pendingBalance > 0 ? 'cursor-default bg-black/60 text-amber-200' : ''}
                    ${errors.amount ? 'border-red-500/50' : 'border-white/10'}`}
                  style={{ WebkitTextFillColor: payoutType === 'FULL' && pendingBalance > 0 ? '#fde68a' : '#ffffff', caretColor: '#ffffff' }}
                />
              </div>
              {errors.amount && <p className="text-red-400 text-xs">{errors.amount}</p>}
              <p className="text-[11px] text-neutral-500 px-1">
                Platform payable amount: <span className="text-amber-400 font-semibold">{fmt(pendingBalance)}</span>
              </p>
              {payoutType === 'PARTIAL' && (
                <div className="flex items-center justify-between text-[11px] font-medium px-1">
                  <span className="text-neutral-500">Max: {fmt(pendingBalance)}</span>
                  <span className={Number(amount || 0) > pendingBalance ? 'text-red-400' : 'text-amber-500/80'}>
                    Remaining: {fmt(Math.max(0, pendingBalance - Number(amount || 0)))}
                  </span>
                </div>
              )}
            </div>

            {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                    bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                >
                  Proceed to Payment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

        </div>
      </DialogContent>
    </Dialog>
  );
};
