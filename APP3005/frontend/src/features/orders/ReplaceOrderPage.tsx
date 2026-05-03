// ============================================================
// REPLACE ORDER PAGE — Myntra/Ajio style full-page experience
// Route: /my-orders/:orderId/replace
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Check, ChevronRight, Package,
    PackageX, AlertTriangle, XCircle, Ruler, Palette,
    ShieldAlert, FileQuestion, ArrowRight, Loader2
} from 'lucide-react';
import { UserDashboardLayout } from '@/components/layout/UserDashboardLayout';
import { ordersApi } from './api/orders.api';
import { REPLACEMENT_REASONS } from './utils/order.utils';
import type { ReplaceOrderPayload, Order } from './types/order.types';
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
    OTHER: { icon: <Package className="w-5 h-5" />, desc: 'Any other reason not listed here' },
};

// ── Process steps ─────────────────────────────────────────────────────────────
const STEPS = [
    { n: '1', title: 'Select a Reason', desc: "Help us understand why you need a replacement." },
    { n: '2', title: 'Pickup & Verification', desc: 'We will coordinate a pickup and verify your item.' },
    { n: '3', title: 'Receive New Item', desc: 'A fresh replacement will be shipped immediately.' },
];
const SUBHEADER_OFFSET_CLASS = 'top-[61px] lg:top-0';

// ── Component ─────────────────────────────────────────────────────────────────
export const ReplaceOrderPage: React.FC = () => {
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
            await ordersApi.requestReplacement(orderId, {
                replace_reason: selectedReason as ReplaceOrderPayload['replace_reason'],
                custom_reason: selectedReason === 'OTHER' ? customReason : undefined,
                feedback: feedback || undefined,
            });
            toast.success('Replacement requested successfully');
            navigate(`/my-orders/${orderId}`);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to request replacement. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return (
        <UserDashboardLayout>
            <div className="min-h-[calc(100vh-61px)] bg-white flex items-center justify-center px-4 lg:min-h-screen">
                <Loader2 className="w-10 h-10 animate-spin text-[#2C2416]" />
            </div>
        </UserDashboardLayout>
    );

    const firstItem = order?.items?.[0];

    return (
        <UserDashboardLayout>
            <div className="min-h-screen bg-[#F9F9F9]" style={{ fontFamily: "'Inter', sans-serif" }}>

                {/* ── TOP NAV (Myntra style clean) ────────────────────────── */}
                <div className={`sticky ${SUBHEADER_OFFSET_CLASS} z-30 bg-white border-b border-[#EEE] shadow-sm`}>
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-sm font-bold text-[#2C2416] hover:text-[#C9A55C] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="uppercase tracking-wide">Back</span>
                    </button>
                    <h1 className="text-sm font-bold text-[#2C2416] uppercase tracking-widest">Replace Item</h1>
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

                {/* ── REPLACEMENT FORM ───────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-[#EEE] shadow-sm overflow-hidden">
                    <div className="px-6 py-8 border-b border-[#F9F9F9]">
                        <h2 className="text-lg font-bold text-[#2C2416]">Reason for Replacement</h2>
                        <p className="text-xs text-[#6B6B6B] mt-1">Select the reason and we'll send you a fresh replacement.</p>
                    </div>

                    <div className="px-6 py-6 space-y-6">
                        {/* Reason List */}
                        <div className="divide-y divide-[#F9F9F9]">
                            {REPLACEMENT_REASONS.map((reason) => {
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
                                                name="replace_reason"
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
                                                {REASON_META[reason.value]?.desc || 'Standard replacement policy applies.'}
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
                                    placeholder="Please describe why you need a replacement..."
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
                                placeholder="Anything else you'd like us to know?"
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
                                    CONFIRM REPLACEMENT
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Replacement Process Info */}
                <div className="bg-[#f0f9ff] rounded-xl border border-[#bae6fd] p-5 flex gap-4">
                    <Package className="w-5 h-5 text-[#0369a1] flex-shrink-0" />
                    <div className="space-y-1">
                        <p className="text-[11px] font-bold text-[#0369a1] uppercase tracking-wider">Fast Replacement</p>
                        <p className="text-[11px] text-[#075985] leading-relaxed">
                            Once approved, your replacement item will be dispatched within 24 hours. You will receive tracking details via email and SMS.
                        </p>
                    </div>
                </div>
            </div>
            </div>
        </UserDashboardLayout>
    );
};

export default ReplaceOrderPage;
