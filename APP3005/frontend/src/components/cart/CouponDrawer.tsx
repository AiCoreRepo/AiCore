// ============================================
// COUPON DRAWER — Myntra-inspired Premium Design
// Slide-in from left, matching AddressSelector pattern
// ============================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, Tag, Clock, AlertCircle, Copy, Check, Sparkles, TicketPercent } from 'lucide-react';
import type { AvailableCoupon, CouponApplyResponse } from '@/api/coupons.api';

const GOLD = '#D4AF37';
const GOLD_HOVER = '#C5A028';

interface CouponDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    availableCoupons: AvailableCoupon[];
    isLoadingCoupons: boolean;
    appliedCoupon: CouponApplyResponse | null;
    isApplying: boolean;
    couponError: string | null;
    onApplyCoupon: (code: string) => Promise<boolean>;
    onRemoveCoupon: () => void;
    onFetchCoupons: () => Promise<void>;
}

export const CouponDrawer: React.FC<CouponDrawerProps> = ({
    isOpen, onClose, availableCoupons, isLoadingCoupons,
    appliedCoupon, isApplying, couponError,
    onApplyCoupon, onRemoveCoupon, onFetchCoupons,
}) => {
    const [manualCode, setManualCode] = useState('');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [applyingCode, setApplyingCode] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            onFetchCoupons();
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen, onFetchCoupons]);

    const handleManualApply = async () => {
        if (!manualCode.trim()) return;
        const ok = await onApplyCoupon(manualCode);
        if (ok) { setManualCode(''); onClose(); }
    };

    const handleCardApply = async (code: string) => {
        setApplyingCode(code);
        const ok = await onApplyCoupon(code);
        setApplyingCode(null);
        if (ok) onClose();
    };

    // Copy to clipboard ONLY — do NOT fill into the input field
    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code).catch(() => { });
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const fmtExpiry = (d: string) => {
        const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
        if (diff <= 0) return 'Expiring today';
        if (diff === 1) return 'Expires tomorrow';
        if (diff <= 7) return `${diff} days left`;
        return `Till ${new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
    };

    const eligible = availableCoupons.filter(c => c.isEligible);
    const ineligible = availableCoupons.filter(c => !c.isEligible);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed inset-y-0 left-0 z-50 w-full max-w-xl shadow-2xl flex flex-col"
                        style={{ backgroundColor: '#f4f4f5' }}
                    >
                        {/* ─── Header ─── */}
                        <div className="flex items-center gap-3 px-4 py-3.5 bg-white border-b border-gray-200">
                            <button onClick={onClose} className="p-1.5 -ml-1 hover:bg-gray-100 rounded-full transition-colors">
                                <ArrowLeft className="w-5 h-5 text-gray-700" />
                            </button>
                            <div className="flex-1">
                                <h2 className="font-bold text-[15px] text-gray-900">Apply Coupons</h2>
                                {availableCoupons.length > 0 && (
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        {eligible.length} coupon{eligible.length !== 1 ? 's' : ''} available
                                    </p>
                                )}
                            </div>
                            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* ─── Manual Code Input ─── */}
                        <div className="bg-white px-4 py-3.5 border-b border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2.5">
                                <input
                                    type="text"
                                    value={manualCode}
                                    onChange={e => setManualCode(e.target.value.toUpperCase())}
                                    onKeyDown={e => e.key === 'Enter' && handleManualApply()}
                                    placeholder="Enter coupon code"
                                    className="flex-1 h-11 px-4 bg-white border border-gray-200 rounded-lg text-sm font-semibold tracking-wider focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400 placeholder:font-normal"
                                />
                                <button
                                    onClick={handleManualApply}
                                    disabled={!manualCode.trim() || isApplying}
                                    className="h-11 px-6 text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed"
                                    style={{
                                        backgroundColor: manualCode.trim() && !isApplying ? GOLD : undefined,
                                        color: manualCode.trim() && !isApplying ? '#fff' : undefined,
                                    }}
                                    onMouseEnter={e => { if (manualCode.trim()) e.currentTarget.style.backgroundColor = GOLD_HOVER; }}
                                    onMouseLeave={e => { if (manualCode.trim()) e.currentTarget.style.backgroundColor = GOLD; }}
                                >
                                    {isApplying && !applyingCode ? '...' : 'APPLY'}
                                </button>
                            </div>
                            {couponError && !applyingCode && (
                                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                    className="text-red-500 text-[11px] mt-2 flex items-center gap-1 pl-0.5">
                                    <AlertCircle className="w-3 h-3 flex-shrink-0" /> {couponError}
                                </motion.p>
                            )}
                        </div>

                        {/* ─── Coupon List ─── */}
                        <div className="flex-1 overflow-y-auto overscroll-contain">
                            <div className="px-4 py-4">
                                {isLoadingCoupons ? (
                                    <div className="py-20 text-center">
                                        <div className="animate-spin w-7 h-7 border-2 border-gray-200 border-t-[#D4AF37] rounded-full mx-auto mb-3" />
                                        <p className="text-xs text-gray-400">Finding best coupons…</p>
                                    </div>
                                ) : availableCoupons.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${GOLD}15` }}>
                                            <Tag className="w-7 h-7" style={{ color: GOLD }} />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-600">No coupons available</p>
                                        <p className="text-xs text-gray-400 mt-1">Check back later for offers!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {/* Applied coupon */}
                                        {appliedCoupon && (
                                            <section>
                                                <SectionLabel icon={<Check className="w-3.5 h-3.5 text-green-500" />} text="Applied Coupon" />
                                                <div className="rounded-xl border-2 border-green-200 bg-white overflow-hidden">
                                                    <div className="px-4 py-3 flex items-center justify-between bg-green-50/60">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-extrabold tracking-wider text-gray-900 uppercase">{appliedCoupon.code}</span>
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500 text-white">
                                                                    SAVING ₹{(appliedCoupon.discountAmount / 100).toLocaleString('en-IN')}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-green-600 font-medium mt-0.5">Coupon applied successfully</p>
                                                        </div>
                                                        <button onClick={onRemoveCoupon}
                                                            className="text-[11px] font-bold text-red-400 hover:text-red-600 uppercase px-3 py-1.5 hover:bg-red-50 rounded-lg transition-all">
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </section>
                                        )}

                                        {/* Eligible coupons */}
                                        {eligible.length > 0 && (
                                            <section>
                                                <SectionLabel
                                                    icon={<Sparkles className="w-3.5 h-3.5" style={{ color: GOLD }} />}
                                                    text={appliedCoupon ? 'More Coupons' : 'Best Coupons For You'}
                                                />
                                                <div className="space-y-3">
                                                    {eligible.map((c, i) => (
                                                        <CouponTicket key={c.code} coupon={c} index={i}
                                                            isApplied={appliedCoupon?.code === c.code}
                                                            isApplying={applyingCode === c.code}
                                                            copiedCode={copiedCode}
                                                            onApply={handleCardApply} onCopy={handleCopy} fmtExpiry={fmtExpiry}
                                                        />
                                                    ))}
                                                </div>
                                            </section>
                                        )}

                                        {/* Ineligible coupons */}
                                        {ineligible.length > 0 && (
                                            <section>
                                                <SectionLabel icon={null} text="More Offers" muted />
                                                <div className="space-y-3">
                                                    {ineligible.map((c, i) => (
                                                        <CouponTicket key={c.code} coupon={c} index={i}
                                                            isApplied={false} isApplying={false}
                                                            copiedCode={copiedCode}
                                                            onApply={handleCardApply} onCopy={handleCopy} fmtExpiry={fmtExpiry}
                                                        />
                                                    ))}
                                                </div>
                                            </section>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

/* ── Helpers ── */

const SectionLabel: React.FC<{ icon: React.ReactNode; text: string; muted?: boolean }> = ({ icon, text, muted }) => (
    <div className={`flex items-center gap-1.5 mb-3 ${muted ? 'text-gray-400' : 'text-gray-500'}`}>
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-[0.12em]">{text}</span>
    </div>
);

/* ═══════════════════════════════════════════════════════
   COUPON TICKET — Myntra-style voucher with two halves
   ═══════════════════════════════════════════════════════ */

interface CouponTicketProps {
    coupon: AvailableCoupon;
    index: number;
    isApplied: boolean;
    isApplying: boolean;
    copiedCode: string | null;
    onApply: (code: string) => void;
    onCopy: (code: string) => void;
    fmtExpiry: (d: string) => string;
}

const CouponTicket: React.FC<CouponTicketProps> = ({
    coupon, index, isApplied, isApplying, copiedCode, onApply, onCopy, fmtExpiry,
}) => {
    const ok = coupon.isEligible;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            className={`
                rounded-xl overflow-hidden transition-all
                ${!ok && !isApplied ? 'opacity-50' : ''}
                ${isApplied ? 'ring-2 ring-green-200' : ''}
            `}
            style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
        >
            {/* ────── LEFT ACCENT + TOP HALF ────── */}
            <div className="flex">
                {/* Left color accent strip */}
                <div className="w-[5px] flex-shrink-0" style={{ backgroundColor: ok ? GOLD : '#d4d4d4' }} />

                {/* Main card area */}
                <div className="flex-1 bg-white">
                    {/* Top section: discount info + APPLY */}
                    <div className="px-4 py-3 flex items-start gap-3">
                        {/* Coupon icon */}
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{
                                backgroundColor: ok ? `${GOLD}12` : '#f5f5f5',
                            }}
                        >
                            <TicketPercent className="w-5 h-5" style={{ color: ok ? GOLD : '#a3a3a3' }} />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-gray-800 leading-tight">{coupon.discountLabel}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{coupon.title}</p>
                            {coupon.description && coupon.description !== coupon.title && (
                                <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{coupon.description}</p>
                            )}
                        </div>

                        {/* APPLY / USED / APPLIED button */}
                        <div className="flex-shrink-0 pt-0.5">
                            {isApplied ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                                    <Check className="w-3.5 h-3.5" /> Applied
                                </span>
                            ) : coupon.isFullyUsed ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-50 px-3 py-1.5 rounded-lg">
                                    <AlertCircle className="w-3.5 h-3.5" /> USED
                                </span>
                            ) : (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => ok && onApply(coupon.code)}
                                    disabled={!ok || isApplying}
                                    className="h-8 px-5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{
                                        backgroundColor: ok ? GOLD : '#e5e7eb',
                                        color: ok ? '#fff' : '#a3a3a3',
                                    }}
                                    onMouseEnter={e => { if (ok) e.currentTarget.style.backgroundColor = GOLD_HOVER; }}
                                    onMouseLeave={e => { if (ok) e.currentTarget.style.backgroundColor = GOLD; }}
                                >
                                    {isApplying ? '···' : 'APPLY'}
                                </motion.button>
                            )}
                        </div>
                    </div>

                    {/* ── Perforated separator ── */}
                    <div className="relative mx-4">
                        <div className="border-t border-dashed border-gray-200" />
                    </div>

                    {/* Bottom section: code + meta + copy */}
                    <div className="px-4 py-2.5 flex items-center justify-between gap-3">
                        {/* Left: code badge + meta */}
                        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                            {/* Code badge */}
                            <span
                                className="inline-flex items-center gap-1 text-[10px] font-extrabold tracking-[0.15em] uppercase px-2.5 py-1 rounded border border-dashed"
                                style={{
                                    color: ok ? GOLD : '#a3a3a3',
                                    borderColor: ok ? `${GOLD}60` : '#d4d4d4',
                                    backgroundColor: ok ? `${GOLD}06` : '#fafafa',
                                }}
                            >
                                {coupon.code}
                            </span>

                            {/* Scope badge */}
                            {coupon.scopeLabel && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 whitespace-nowrap">
                                    {coupon.scopeLabel}
                                </span>
                            )}

                            {/* Min order */}
                            {coupon.minOrderAmount > 0 && (
                                <span className="text-[10px] text-gray-400">
                                    Min ₹{coupon.minOrderAmount.toLocaleString('en-IN')}
                                </span>
                            )}

                            {/* Expiry */}
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> {fmtExpiry(coupon.expiresAt)}
                            </span>

                            {/* Usage info */}
                            {coupon.usageInfo && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${coupon.isFullyUsed ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                                    {coupon.usageInfo}
                                </span>
                            )}
                        </div>

                        {/* Copy button */}
                        <button
                            onClick={() => onCopy(coupon.code)}
                            className="flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-md transition-all hover:bg-gray-50"
                            style={{ color: copiedCode === coupon.code ? '#16a34a' : GOLD }}
                        >
                            {copiedCode === coupon.code ? (
                                <><Check className="w-3 h-3" /> Copied!</>
                            ) : (
                                <><Copy className="w-3 h-3" /> COPY</>
                            )}
                        </button>
                    </div>

                    {/* Ineligible reason */}
                    {!ok && coupon.ineligibleReason && (
                        <div className="mx-4 mb-3 text-[10px] text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            <span>{coupon.ineligibleReason}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Notch cutouts on the dashed line ── */}
            <style>{`
                /* Pseudo circles on the card edges at the dashed separator line */
            `}</style>
        </motion.div>
    );
};

export default CouponDrawer;
