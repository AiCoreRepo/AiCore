// ============================================
// CREATOR FINANCIALS PANEL
// ============================================
// Shows summary cards + manual payout entry modal + separated payout ledger.

import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  DollarSign, Package, Banknote, TrendingUp,
  ChevronDown, ChevronUp, Plus,
} from 'lucide-react';
import { useCreatorAnalyticsDetails } from '@/hooks/useAdminAnalytics';
import { useCreateManualPayout, useCreatorPayoutSummary } from '@/hooks/useAdminPayout';
import { DEFAULT_CURRENCY } from '@/constants/admin-analytics.constants';
import { PayoutStatusBadge } from '@/components/admin/creators/PayoutStatusBadge';
import type { Payout, PayoutStatus, PayoutType } from '@/api/admin-payout.api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/utils/cn';

const fmt = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: DEFAULT_CURRENCY, maximumFractionDigits: 0 }).format(val);

interface StatCardProps { label: string; value: string | number; icon: React.ElementType; highlight?: boolean }
const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, highlight }) => (
  <div className={cn(
    'flex items-center gap-4 p-5 rounded-2xl border bg-black/20',
    highlight ? 'bg-amber-500/5 border-amber-500/20' : 'border-white/5',
  )}>
    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', highlight ? 'bg-amber-500/10' : 'bg-white/5')}>
      <Icon className={cn('w-5 h-5', highlight ? 'text-amber-400' : 'text-neutral-400')} />
    </div>
    <div>
      <p className={cn('text-2xl font-bold', highlight ? 'text-amber-400' : 'text-neutral-100')}>{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  </div>
);

interface Props { creatorId: string }

const MANUAL_STATUSES: PayoutStatus[] = ['SUCCESS', 'PENDING', 'FAILED', 'CANCELLED'];

const sourceLabel = (gateway: string | null | undefined) =>
  gateway?.toUpperCase() === 'MANUAL' ? 'Manual' : 'Platform';

export const CreatorFinancialsPanel: React.FC<Props> = ({ creatorId }) => {
  const { data: analytics, isLoading: analyticsLoading, isError } = useCreatorAnalyticsDetails(creatorId);
  const { data: payoutSummary, isLoading: payoutLoading } = useCreatorPayoutSummary(creatorId);
  const { mutateAsync: createManualPayout, isPending: isManualSaving } = useCreateManualPayout(creatorId);

  const [showHistory, setShowHistory] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [payoutType, setPayoutType] = useState<PayoutType>('PARTIAL');
  const [status, setStatus] = useState<PayoutStatus>('SUCCESS');
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pendingBalance = payoutSummary?.pending_balance ?? analytics?.summary?.pending_balance ?? 0;
  const totalEarnings = payoutSummary?.total_earnings ?? analytics?.summary?.creator_earnings ?? 0;
  const totalPaid = payoutSummary?.total_paid ?? analytics?.summary?.total_paid ?? 0;

  const payouts = useMemo(() => payoutSummary?.payouts ?? [], [payoutSummary?.payouts]);
  const manualPayouts = useMemo(
    () => payouts.filter((p) => p.payment_gateway?.toUpperCase() === 'MANUAL'),
    [payouts],
  );
  const platformPayouts = useMemo(
    () => payouts.filter((p) => p.payment_gateway?.toUpperCase() !== 'MANUAL'),
    [payouts],
  );

  if (analyticsLoading || payoutLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="text-center py-20 bg-red-500/5 rounded-2xl border border-red-500/20">
        <p className="text-red-400">Failed to load financial details. Please try again later.</p>
      </div>
    );
  }

  const validateManualEntry = () => {
    const next: Record<string, string> = {};
    const raw = amount.trim();
    const numericAmount = Number(raw);

    if (!raw) {
      next.amount = 'Amount is required';
    } else if (!Number.isFinite(numericAmount)) {
      next.amount = 'Enter a valid amount';
    } else if (numericAmount <= 0) {
      next.amount = 'Amount must be greater than 0';
    } else if (pendingBalance > 0 && numericAmount > pendingBalance) {
      next.amount = `Amount cannot exceed pending balance (${fmt(pendingBalance)})`;
    }

    if (remarks.trim().length > 500) {
      next.remarks = 'Remarks must be 500 characters or fewer';
    }

    setErrors(next);
    return !Object.keys(next).length;
  };

  const handleCreateManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateManualEntry()) return;

    await createManualPayout({
      creatorId,
      amount: Number(amount.trim()),
      status,
      payoutType,
      remarks: remarks.trim() || undefined,
    });

    setAmount('');
    setStatus('SUCCESS');
    setPayoutType('PARTIAL');
    setRemarks('');
    setErrors({});
    setIsManualModalOpen(false);
  };

  const renderLedgerTable = (entries: Payout[], showUpi: boolean, emptyText: string) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-neutral-400 uppercase bg-white/5">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Remarks</th>
            <th className="px-4 py-3 font-medium">Type</th>
            {showUpi && <th className="px-4 py-3 font-medium">UPI</th>}
            <th className="px-4 py-3 font-medium text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((p) => (
            <tr key={p.payout_id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-3 text-neutral-400 whitespace-nowrap">
                {format(new Date(p.initiated_at), 'dd MMM yyyy')}
              </td>
              <td className="px-4 py-3 text-neutral-100 font-semibold">{fmt(Number(p.amount))}</td>
              <td className="px-4 py-3 text-neutral-400 text-xs max-w-[220px] truncate" title={p.note ?? ''}>
                {p.note ?? '—'}
              </td>
              <td className="px-4 py-3 text-neutral-500 text-xs">
                {sourceLabel(p.payment_gateway)} · {p.payout_type}
              </td>
              {showUpi && (
                <td className="px-4 py-3 text-neutral-500 text-xs font-mono truncate max-w-[110px]">
                  {p.upi_id ?? '—'}
                </td>
              )}
              <td className="px-4 py-3 text-right">
                <PayoutStatusBadge status={p.status} size="sm" />
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={showUpi ? 6 : 5} className="px-4 py-8 text-center text-neutral-500 italic">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <div className="space-y-6 mt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Earnings (Platform → Creator)" value={fmt(totalEarnings)} icon={TrendingUp} />
        <StatCard label="Total Paid Out" value={fmt(totalPaid)} icon={Banknote} />
        <StatCard label="Pending Balance" value={fmt(pendingBalance)} icon={DollarSign} highlight />
        <StatCard label="Units Sold" value={analytics.summary.units_sold} icon={Package} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-neutral-100">Manual Entry</h3>
                <p className="text-xs text-neutral-500 mt-1">Create manual payout records from a modal form.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setErrors({});
                  setIsManualModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-sm font-bold transition-colors"
              >
                <Plus className="w-4 h-4" />
                Manual Entry
              </button>
            </div>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-4 text-left text-base font-bold text-neutral-100 hover:bg-white/[0.02] transition-colors border-b border-white/5"
            >
              <span>Payout Ledger</span>
              <div className="flex items-center gap-2 text-neutral-500 text-xs font-normal">
                <span>{payouts.length} records</span>
                {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showHistory && (
              <div className="space-y-4 p-4">
                <div className="rounded-xl border border-white/5 overflow-hidden">
                  <div className="px-4 py-3 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
                    <p className="text-sm font-semibold text-neutral-200">Manual Entries</p>
                    <span className="text-xs text-neutral-500">{manualPayouts.length}</span>
                  </div>
                  {renderLedgerTable(manualPayouts, false, 'No manual payout entries yet.')}
                </div>

                <div className="rounded-xl border border-white/5 overflow-hidden">
                  <div className="px-4 py-3 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
                    <p className="text-sm font-semibold text-neutral-200">Platform Payments</p>
                    <span className="text-xs text-neutral-500">{platformPayouts.length}</span>
                  </div>
                  {renderLedgerTable(platformPayouts, true, 'No platform payout records yet.')}
                </div>
              </div>
            )}

            {!showHistory && (
              <p className="px-6 py-4 text-neutral-600 text-xs italic">Click to expand ledger</p>
            )}
          </div>
        </div>

        <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="text-base font-bold text-neutral-100">Product Sales Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-neutral-400 uppercase bg-white/5">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Units</th>
                  <th className="px-4 py-3 rounded-r-lg font-medium text-right">Net Sales</th>
                </tr>
              </thead>
              <tbody>
                {analytics.product_breakdown.map((prod) => (
                  <tr key={prod.product_id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-neutral-200">
                      <div className="truncate max-w-[200px]" title={prod.product_name}>{prod.product_name}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-300">{prod.units_sold}</td>
                    <td className="px-4 py-3 text-right text-amber-400 font-semibold">{fmt(prod.total_sales)}</td>
                  </tr>
                ))}
                {analytics.product_breakdown.length === 0 && (
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
      </div>
    </div>

      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="bg-neutral-900 border-white/10 text-neutral-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manual Payout Entry</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Add amount, status, payout type, and remarks for a manual creator payout entry.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-2 space-y-4" onSubmit={handleCreateManualEntry}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="manual-amount" className="text-sm text-neutral-400 font-medium">Amount</label>
                <input
                  id="manual-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErrors((prev) => ({ ...prev, amount: '' }));
                  }}
                  disabled={isManualSaving}
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl bg-neutral-950 border text-white text-sm',
                    'focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all',
                    errors.amount ? 'border-red-500/50' : 'border-white/10',
                  )}
                  style={{ WebkitTextFillColor: '#ffffff', caretColor: '#ffffff' }}
                />
                {errors.amount && <p className="text-red-400 text-xs">{errors.amount}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="manual-status" className="text-sm text-neutral-400 font-medium">Status</label>
                <select
                  id="manual-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PayoutStatus)}
                  disabled={isManualSaving}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                  style={{ color: '#ffffff' }}
                >
                  {MANUAL_STATUSES.map((statusOption) => (
                    <option key={statusOption} value={statusOption} style={{ color: '#ffffff', backgroundColor: '#0a0a0a' }}>
                      {statusOption}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="manual-type" className="text-sm text-neutral-400 font-medium">Payout Type</label>
                <select
                  id="manual-type"
                  value={payoutType}
                  onChange={(e) => setPayoutType(e.target.value as PayoutType)}
                  disabled={isManualSaving}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                  style={{ color: '#ffffff' }}
                >
                  <option value="FULL" style={{ color: '#ffffff', backgroundColor: '#0a0a0a' }}>FULL</option>
                  <option value="PARTIAL" style={{ color: '#ffffff', backgroundColor: '#0a0a0a' }}>PARTIAL</option>
                </select>
                <p className="text-[11px] text-neutral-500">Pending balance available: {fmt(pendingBalance)}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="manual-remarks" className="text-sm text-neutral-400 font-medium">Remarks</label>
              <textarea
                id="manual-remarks"
                rows={3}
                value={remarks}
                onChange={(e) => {
                  setRemarks(e.target.value);
                  setErrors((prev) => ({ ...prev, remarks: '' }));
                }}
                disabled={isManualSaving}
                placeholder="Add settlement notes or reason"
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl bg-neutral-950 border text-white text-sm placeholder:text-neutral-500 resize-none',
                  'focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all',
                  errors.remarks ? 'border-red-500/50' : 'border-white/10',
                )}
                style={{ WebkitTextFillColor: '#ffffff', caretColor: '#ffffff' }}
              />
              {errors.remarks && <p className="text-red-400 text-xs">{errors.remarks}</p>}
            </div>

            <button
              type="submit"
              disabled={isManualSaving}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition-all disabled:opacity-60"
            >
              {isManualSaving ? 'Saving Entry...' : 'Create Manual Entry'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
