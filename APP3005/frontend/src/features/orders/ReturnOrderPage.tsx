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
    { n: '3', title: 'Get Wallet Refund', desc: 'Once verified, the approved refund is credited to your wallet.' },
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
        <div className="min-h-screen bg-white flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#2C2416]" />
        </div>
    );

    const firstItem = order?.items?.[0];

    return (
        <div className="min-h-screen bg-[#F9F9F9]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── TOP NAV (Myntra style clean) ────────────────────────── */}
            <div className="sticky top-0 z-30 bg-white border-b border-[#EEE] shadow-sm">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-sm font-bold text-[#2C2416] hover:text-[#C9A55C] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="uppercase tracking-wide">Back</span>
                    </button>
                    <h1 className="text-sm font-bold text-[#2C2416] uppercase tracking-widest">Return Item</h1>
                    <div className="w-10" /> {/* Spacer */}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">

                {/* ── PRODUCT CARD (Small & Clickable) ──────────────────── */}
                {firstItem && (
                    <button
                        onClick={() => navigate(`/my-orders/${orderId}`)}
                        className="w-full bg-white rounded-xl border border-[#EEE] p-4 flex items-center gap-4 text-left hover:border-[#C9A55C]/30 transition-all group"
                    >
                        <div className="w-20 h-24 bg-[#F5F5F5] rounded-lg overflow-hidden flex-shrink-0">
                            {firstItem.product_image ? (
                                <img src={firstItem.product_image} alt={firstItem.product_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-8 h-8 text-[#CCC]" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-sm font-bold text-[#2C2416] truncate mb-1">{firstItem.product_name}</h2>
                            <p className="text-xs text-[#6B6B6B] mb-2 uppercase tracking-tighter">Order ID: {order?.order_number}</p>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#C9A55C] uppercase">
                                View Order Details
                                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </div>
                    </button>
                )}

                {/* ── RETURN FORM ────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-[#EEE] shadow-sm overflow-hidden">
                    <div className="px-6 py-8 border-b border-[#F9F9F9]">
                        <h2 className="text-lg font-bold text-[#2C2416]">Reason for Return</h2>
                        <p className="text-xs text-[#6B6B6B] mt-1">Please select the most appropriate reason for returning this item.</p>
                    </div>

                    <div className="px-6 py-6 space-y-6">
                        {/* Reason List */}
                        <div className="divide-y divide-[#F9F9F9]">
                            {RETURN_REASONS.map((reason) => {
                                const isSelected = selectedReason === reason.value;
                                return (
                                    <label
                                        key={reason.value}
                                        className={`flex items-start gap-4 py-5 cursor-pointer group transition-colors ${isSelected ? 'bg-amber-50/30' : 'hover:bg-[#F9F9F9]'}`}
                                    >
                                        <div className="pt-0.5">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-[#C9A55C] bg-[#C9A55C]' : 'border-[#DDD] group-hover:border-[#C9A55C]/50'}`}>
                                                {isSelected && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                                            </div>
                                            <input
                                                type="radio"
                                                name="return_reason"
                                                className="hidden"
                                                checked={isSelected}
                                                onChange={() => setSelectedReason(reason.value)}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-bold transition-colors ${isSelected ? 'text-[#2C2416]' : 'text-[#4A3D24]'}`}>
                                                {reason.label.replace(reason.emoji, '').trim()}
                                            </p>
                                            <p className="text-[11px] text-[#999] mt-0.5 leading-relaxed">
                                                {REASON_META[reason.value]?.desc || 'Standard return reason policy applies.'}
                                            </p>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>

                        {/* Custom Reason */}
                        {selectedReason === 'OTHER' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-[10px] font-bold text-[#2C2416] mb-2 uppercase tracking-widest opacity-60">Specify Reason</label>
                                <textarea
                                    value={customReason}
                                    onChange={e => setCustomReason(e.target.value)}
                                    placeholder="Please describe your reason here..."
                                    className="w-full px-4 py-3 rounded-xl border border-[#EEE] bg-[#FAFAFA] text-sm text-[#2C2416] focus:outline-none focus:border-[#C9A55C] min-h-[80px]"
                                />
                            </div>
                        )}

                        {/* Additional Notes */}
                        <div className="pt-4 border-t border-[#F9F9F9]">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] font-bold text-[#2C2416] uppercase tracking-widest opacity-60">Additional Comments (Optional)</label>
                                <span className="text-[9px] text-[#BBB]">{feedback.length}/{MAX}</span>
                            </div>
                            <textarea
                                value={feedback}
                                onChange={e => setFeedback(e.target.value.slice(0, MAX))}
                                rows={4}
                                placeholder="Any extra details help our quality team..."
                                className="w-full px-4 py-3 rounded-xl border border-[#EEE] bg-[#FAFAFA] text-sm text-[#2C2416] focus:outline-none focus:border-[#C9A55C] transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-6 bg-white border-t border-[#F9F9F9] flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !selectedReason || (selectedReason === 'OTHER' && !customReason.trim())}
                            className="w-full py-4 rounded-xl bg-[#2C2416] text-white font-bold text-sm hover:bg-[#1A150D] shadow-lg shadow-[#2C2416]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    CONFIRM RETURN
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Return Policy Info */}
                <div className="bg-[#FFFCEB] rounded-xl border border-[#FBEFBE] p-5 flex gap-4">
                    <ShieldAlert className="w-5 h-5 text-[#B45309] flex-shrink-0" />
                    <div className="space-y-1">
                        <p className="text-[11px] font-bold text-[#B45309] uppercase tracking-wider">Secure Returns</p>
                        <p className="text-[11px] text-[#92400E] leading-relaxed">
                            Once your return is picked up, it usually takes 2-3 business days for our quality team to verify the product. After verification, the approved refund is credited to your wallet and will appear on the Wallet page.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReturnOrderPage;
