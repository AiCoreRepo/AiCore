import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  ArrowLeft, Building2, CreditCard, ShieldCheck, 
  RefreshCw, CheckCircle2, ChevronRight, AlertCircle
} from 'lucide-react';
import { CreatorListItem } from '@/api/admin-creators.api';
import { PayoutType } from '@/api/admin-payout.api';
import { useInitiatePayout } from '@/hooks/useAdminPayout';

interface CheckoutState {
  amount: number;
  payoutType: PayoutType;
  creator: CreatorListItem;
  pendingBalance: number;
}

const UPI_RE = /^[a-zA-Z0-9._\-]+@[a-zA-Z0-9]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;

const fmt = (v: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(v);

export default function AdminPayoutProcessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as CheckoutState | null;

  const [toUpi, setToUpi] = useState('');
  const [fromUpi, setFromUpi] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutateAsync: initiatePayout, isPending } = useInitiatePayout();

  // Protect route if navigated directly without state or invalid amount
  if (!state || !state.creator || !Number.isFinite(state.amount) || state.amount <= 0) {
    return <Navigate to="/admin-artisans" replace />;
  }

  const { creator, amount, payoutType, pendingBalance } = state;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!UPI_RE.test(toUpi.trim())) e.toUpi = 'Invalid destination UPI ID';
    if (!fromUpi.trim()) e.fromUpi = 'Required. Enter your Admin UPI ID';
    if (fromUpi.trim() && !UPI_RE.test(fromUpi.trim())) e.fromUpi = 'Invalid source UPI ID';
    if (!PHONE_RE.test(phone.trim())) e.phone = 'Enter valid 10-digit mobile number';
    
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Package the Admin "From" UPI inside the note to avoid backend schema changes
    const finalNote = note.trim() 
      ? `[From: ${fromUpi.trim()}] ${note.trim()}`
      : `[From: ${fromUpi.trim()}]`;

    try {
      await initiatePayout({
        creatorId: creator.creator_id,
        amount,
        payoutType,
        upiId: toUpi.trim(),
        phoneNumber: phone.trim(),
        note: finalNote,
      });
      // Redirect back to creator detail page after success
      navigate(`/admin-artisans/${creator.creator_id}`, { replace: true });
    } catch (err) {
      // Error handled by the hook (toast)
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-6 lg:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Navigation */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Authorize Payout</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Secure transfer to {creator.store_name} via PayU Nodal Account
            </p>
          </div>
        </div>

        {/* Main Grid Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Transaction Summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-black/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
              {/* Decorative gradient glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-amber-500/5 blur-[50px] rounded-t-full pointer-events-none" />
              
              <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-6">Payment Summary</h2>
              
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Paying to</p>
                  <p className="text-lg text-white font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-500" />
                    {creator.store_name}
                  </p>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div>
                  <p className="text-xs text-neutral-500 mb-1">Amount to Transfer</p>
                  <p className="text-4xl text-amber-400 font-bold tracking-tight">{fmt(amount)}</p>
                  <p className="text-xs font-mono text-neutral-600 mt-2">
                    {payoutType === 'FULL' ? 'Full Settlement' : 'Custom Settlement'}
                  </p>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500">Remaining Balance</span>
                  <span className="text-neutral-300 font-medium">
                    {fmt(Math.max(0, pendingBalance - amount))}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex gap-3 text-blue-400/90 text-sm leading-relaxed">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>Funds will be instantly disbursed to the creator's registered bank account via UPI. This action cannot be undone.</p>
            </div>
          </div>

          {/* Right Column: Checkout Form */}
          <div className="lg:col-span-8">
            <div className="bg-black/20 border border-white/5 rounded-3xl p-6 lg:p-10 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-neutral-400" />
                Transfer Details
              </h2>

              <form onSubmit={handleAuthorize} className="space-y-8">
                
                <div className="space-y-6">
                  {/* Pay To */}
                  <div className="space-y-2 relative group">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wide ml-1 transition-colors group-focus-within:text-amber-500">
                      Transfer To (Creator UPI)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. creator@okicici"
                      value={toUpi}
                      onChange={(e) => { setToUpi(e.target.value); setErrors(p => ({ ...p, toUpi: '' })); }}
                      disabled={isPending}
                      className={`w-full px-5 py-4 border bg-[#0a0a0a] rounded-2xl text-white text-base font-medium placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all ${errors.toUpi ? 'border-red-500/50' : 'border-white/10'}`}
                      style={{ WebkitTextFillColor: '#ffffff', caretColor: '#ffffff' }}
                    />
                    {errors.toUpi && <p className="text-red-400 text-xs ml-1">{errors.toUpi}</p>}
                  </div>

                  {/* Pay From */}
                  <div className="space-y-2 relative group">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wide ml-1 transition-colors group-focus-within:text-amber-500">
                      Pay From (Admin UPI / Reference)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. platform-escrow@payu"
                      value={fromUpi}
                      onChange={(e) => { setFromUpi(e.target.value); setErrors(p => ({ ...p, fromUpi: '' })); }}
                      disabled={isPending}
                      className={`w-full px-5 py-4 border bg-[#0a0a0a] rounded-2xl text-white text-base font-medium placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all ${errors.fromUpi ? 'border-red-500/50' : 'border-white/10'}`}
                      style={{ WebkitTextFillColor: '#ffffff', caretColor: '#ffffff' }}
                    />
                    <p className="text-[10px] text-neutral-500 ml-1">Included in payout note for reconciliation.</p>
                    {errors.fromUpi && <p className="text-red-400 text-xs ml-1">{errors.fromUpi}</p>}
                  </div>
                  
                  {/* Creator Mobile */}
                  <div className="space-y-2 relative group">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wide ml-1 transition-colors group-focus-within:text-amber-500">
                      Creator Mobile Number
                    </label>
                    <input
                      type="tel"
                      placeholder="9XXXXXXXXX"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })); }}
                      disabled={isPending}
                      className={`w-full px-5 py-4 border bg-[#0a0a0a] rounded-2xl text-white text-base font-medium placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all ${errors.phone ? 'border-red-500/50' : 'border-white/10'}`}
                      style={{ WebkitTextFillColor: '#ffffff', caretColor: '#ffffff' }}
                    />
                    {errors.phone && <p className="text-red-400 text-xs ml-1">{errors.phone}</p>}
                  </div>
                  
                  {/* Note */}
                  <div className="space-y-2 relative group">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wide ml-1 transition-colors group-focus-within:text-amber-500">
                      Internal Note <span className="text-neutral-600 font-normal lowercase tracking-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Clearing March dues"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      disabled={isPending}
                      className="w-full px-5 py-4 border border-white/10 bg-[#0a0a0a] rounded-2xl text-white text-base font-medium placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all"
                      style={{ WebkitTextFillColor: '#ffffff', caretColor: '#ffffff' }}
                    />
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/5 flex gap-4 items-center">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 lg:flex-none lg:w-64 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-bold text-[15px] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.3)]"
                  >
                    {isPending ? (
                      <><RefreshCw className="w-5 h-5 animate-spin" /> Processing Transfer...</>
                    ) : (
                      <><CheckCircle2 className="w-5 h-5" /> Authorize {fmt(amount)}</>
                    )}
                  </button>
                  <p className="text-xs text-neutral-500 hidden lg:block">
                    Powered by PayU Gateway <br/> Escrow Disbursement
                  </p>
                </div>
              </form>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
