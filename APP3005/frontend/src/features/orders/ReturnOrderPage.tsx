// ============================================================
// RETURN ORDER PAGE — Myntra/Ajio style full-page experience
// Route: /my-orders/:orderId/return
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Check, ChevronRight, Package,
    PackageX, AlertTriangle, XCircle, Ruler, Palette,
    ShieldAlert, FileQuestion, RotateCcw, MoreHorizontal,
    ArrowRight, Loader2
} from 'lucide-react';
import { ordersApi } from './api/orders.api';
import { RETURN_REASONS } from './utils/order.utils';
import type { ReturnOrderPayload, Order } from './types/order.types';
import { toast } from 'sonner';

// ── Reason icon/description map ────────────────────────────────────────────────
const REASON_META: Record<string, { icon: React.ReactNode; desc: string }> = {
    DAMAGED: { icon: <PackageX className="w-5 h-5" />, desc: 'Item arrived broken or damaged during transit' },
    DEFECTIVE: { icon: <AlertTriangle className="w-5 h-5" />, desc: 'Product malfunctions or has a manufacturing defect' },
    WRONG_ITEM: { icon: <XCircle className="w-5 h-5" />, desc: 'Received a completely different item than ordered' },
    SIZE_ISSUE: { icon: <Ruler className="w-5 h-5" />, desc: 'The fit is too big or too small' },
    COLOR_DIFFERENCE: { icon: <Palette className="w-5 h-5" />, desc: 'Color significantly differs from the website images' },
    QUALITY_ISSUE: { icon: <ShieldAlert className="w-5 h-5" />, desc: 'Material or overall build quality is poor' },
    NOT_AS_DESCRIBED: { icon: <FileQuestion className="w-5 h-5" />, desc: 'Product differs from its online description' },
    CHANGED_MIND: { icon: <RotateCcw className="w-5 h-5" />, desc: 'Purchased by mistake or no longer needed' },
    OTHER: { icon: <MoreHorizontal className="w-5 h-5" />, desc: 'Any other reason not listed here' },
};

// ── Process steps ─────────────────────────────────────────────────────────────
const STEPS = [
    { n: '1', title: 'Select a Reason', desc: 'Help us understand why you\'re returning this item.' },
    { n: '2', title: 'Schedule Pickup', desc: 'We will coordinate a convenient doorstep pickup time.' },
    { n: '3', title: 'Get Refund', desc: 'Once verified, your refund will be initiated instantly.' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export const ReturnOrderPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();

    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const MAX = 500;

    useEffect(() => {
        (async () => {
            try {
                const orders = await ordersApi.getMyOrders();
                const found = orders.find(o => o.order_id === orderId);
                if (!found) throw new Error('Order not found');
                setOrder(found);
            } catch { /* ignore */ }
            setIsLoading(false);
        })();
    }, [orderId]);

    const handleSubmit = async () => {
        if (!selectedReason || !orderId) return;
        setIsSubmitting(true);
        try {
            await ordersApi.requestReturn(orderId, {
                return_reason: selectedReason as ReturnOrderPayload['return_reason'],
                custom_reason: selectedReason === 'OTHER' ? customReason : undefined,
                feedback: feedback || undefined,
            });
            toast.success('Return requested successfully');
            navigate(`/my-orders/${orderId}`);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to request return. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return (
        <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#C9A55C]" />
        </div>
    );

    const firstItem = order?.items?.[0];

    return (
        <div className="min-h-screen bg-[#F5F3EE]" style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>

            {/* ── TOP NAV ────────────────────────────────────────────────── */}
            <div className="sticky top-0 z-30 bg-white border-b border-[#E0E0D8] shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sm font-medium text-[#6B6B6B] hover:text-[#2C2416] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <ChevronRight className="w-3.5 h-3.5 text-[#CCC]" />
                    <span className="text-sm font-semibold text-[#2C2416]">Return Order</span>
                    {order && (
                        <>
                            <ChevronRight className="w-3.5 h-3.5 text-[#CCC]" />
                            <span className="text-sm text-[#999]">{order.order_number}</span>
                        </>
                    )}
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
                <div className="grid lg:grid-cols-[340px_1fr] gap-8">

                    {/* ── LEFT PANEL ─────────────────────────────────────── */}
                    <div className="space-y-6">
                        <div className="bg-[#1A150D] rounded-2xl overflow-hidden shadow-xl">
                            {/* Product preview */}
                            {firstItem && (
                                <div className="relative">
                                    {firstItem.product_image ? (
                                        <img src={firstItem.product_image} alt={firstItem.product_name}
                                            className="w-full h-52 object-cover opacity-60" />
                                    ) : (
                                        <div className="w-full h-52 bg-[#2C2416] flex items-center justify-center">
                                            <Package className="w-16 h-16 text-[#C9A55C]/30" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A150D] via-[#1A150D]/60 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-5">
                                        <p className="text-white font-bold text-sm leading-snug line-clamp-2">
                                            {firstItem.product_name}
                                        </p>
                                        {order && (
                                            <p className="text-[#C9A55C] text-xs font-semibold mt-1">
                                                {order.order_number}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Process steps */}
                            <div className="p-6 space-y-6">
                                <h3 className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Return Process</h3>
                                {STEPS.map((s) => (
                                    <div key={s.n} className="flex gap-4 items-start">
                                        <div className="w-8 h-8 rounded-full border border-[#C9A55C]/40 flex items-center justify-center flex-shrink-0 bg-[#C9A55C]/10">
                                            <span className="text-[#C9A55C] font-bold text-sm">{s.n}</span>
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold text-sm">{s.title}</p>
                                            <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{s.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT PANEL — Form ─────────────────────────────── */}
                    <div className="bg-white rounded-2xl border border-[#E8E8E8] shadow-sm overflow-hidden flex flex-col">
                        <div className="px-5 sm:px-8 py-6 border-b border-[#F0F0F0]">
                            <h1 className="text-xl sm:text-2xl font-bold text-[#2C2416]">Return Item</h1>
                            <p className="text-[#6B6B6B] text-sm mt-1">
                                Tell us what went wrong and we'll take care of the rest.
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 space-y-6 sm:space-y-8">

                            {/* ── REASON SELECTION ─────────────────────── */}
                            <div>
                                <label className="block text-sm font-bold text-[#2C2416] mb-4">
                                    What is the reason for return? <span className="text-red-500">*</span>
                                </label>

                                {/* List-style reasons — like Myntra */}
                                <div className="space-y-2">
                                    {RETURN_REASONS.map((reason) => {
                                        const meta = REASON_META[reason.value] ?? REASON_META.OTHER;
                                        const isSelected = selectedReason === reason.value;
                                        return (
                                            <button
                                                key={reason.value}
                                                type="button"
                                                onClick={() => setSelectedReason(reason.value)}
                                                className={`w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 rounded-xl border-2 text-left transition-all duration-200 group ${isSelected
                                                    ? 'border-[#C9A55C] bg-amber-50/70'
                                                    : 'border-[#EBEBEB] bg-white hover:border-[#C9A55C]/50 hover:bg-[#FDFBF7]'
                                                    }`}
                                            >
                                                {/* Icon */}
                                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-[#C9A55C] text-white' : 'bg-[#F5F3EE] text-[#6B6B6B] group-hover:bg-[#C9A55C]/10 group-hover:text-[#C9A55C]'
                                                    }`}>
                                                    {meta.icon}
                                                </div>

                                                {/* Text */}
                                                <div className="flex-1">
                                                    <p className={`font-semibold text-sm ${isSelected ? 'text-[#2C2416]' : 'text-[#4A3D24]'}`}>
                                                        {reason.label.replace(reason.emoji, '').trim()}
                                                    </p>
                                                    <p className="text-xs text-[#999] mt-0.5">{meta.desc}</p>
                                                </div>

                                                {/* Radio */}
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'border-[#C9A55C] bg-[#C9A55C]' : 'border-[#CCC]'
                                                    }`}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ── CUSTOM REASON (if OTHER) ──────────────── */}
                            {selectedReason === 'OTHER' && (
                                <div>
                                    <label className="block text-sm font-bold text-[#2C2416] mb-2">
                                        Please specify <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={customReason}
                                        onChange={e => setCustomReason(e.target.value)}
                                        placeholder="e.g. The fabric feels different than described"
                                        className="w-full px-4 py-3.5 rounded-xl border-2 border-[#EBEBEB] bg-white text-[#2C2416] placeholder-[#CCC] text-sm focus:outline-none focus:border-[#C9A55C] focus:ring-4 focus:ring-[#C9A55C]/10 transition-all"
                                    />
                                </div>
                            )}

                            {/* ── ADDITIONAL NOTES ─────────────────────── */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <label className="text-sm font-bold text-[#2C2416]">
                                        Additional Notes
                                        <span className="text-[#999] font-normal text-xs ml-2">(Optional)</span>
                                    </label>
                                    <span className={`text-xs font-semibold ${feedback.length > MAX * 0.9 ? 'text-red-500' : 'text-[#CCC]'}`}>
                                        {feedback.length}/{MAX}
                                    </span>
                                </div>
                                <textarea
                                    value={feedback}
                                    onChange={e => setFeedback(e.target.value.slice(0, MAX))}
                                    rows={4}
                                    placeholder="Describe the issue in more detail so we can serve you better..."
                                    className="w-full px-4 py-3.5 rounded-xl border-2 border-[#EBEBEB] bg-white text-[#2C2416] placeholder-[#CCC] text-sm focus:outline-none focus:border-[#C9A55C] focus:ring-4 focus:ring-[#C9A55C]/10 transition-all resize-none"
                                />
                            </div>
                        </div>

                        {/* ── FOOTER ACTIONS ─────────────────────────────── */}
                        <div className="px-5 sm:px-8 py-5 border-t border-[#F0F0F0] bg-white flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-[#6B6B6B] border border-transparent sm:border-[#EBEBEB] hover:border-[#CCC] font-semibold hover:bg-[#F5F3EE] transition-all text-sm disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !selectedReason || (selectedReason === 'OTHER' && !customReason.trim())}
                                className="w-full sm:w-auto px-10 py-3.5 rounded-xl bg-[#2C2416] text-[#C9A55C] font-bold text-sm hover:bg-[#1A150D] shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Submitting…
                                    </>
                                ) : (
                                    <>
                                        Confirm Return
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReturnOrderPage;
