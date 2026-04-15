import React from 'react';
import {
    Package, CheckCircle, Clock, XCircle, Truck,
    MapPin, CreditCard, RefreshCw, RotateCcw, X,
    ShoppingBag, Calendar, Hash, User, Phone
} from 'lucide-react';
import { formatRefundStatus } from '@/features/orders/utils/order.utils';
import { Order } from '../../features/orders/types/order.types';

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtDate = (d?: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const fmtINR = (n?: number | Number | null) =>
    n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; icon: React.ReactNode; gradient: string; text: string; dot: string }> = {
    DELIVERED: { label: 'Delivered', icon: <CheckCircle className="w-5 h-5" />, gradient: 'from-emerald-500 to-green-600', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    CANCELLED: { label: 'Cancelled', icon: <XCircle className="w-5 h-5" />, gradient: 'from-red-500 to-rose-600', text: 'text-red-700', dot: 'bg-red-500' },
    SHIPPED: { label: 'Shipped', icon: <Truck className="w-5 h-5" />, gradient: 'from-blue-500 to-indigo-600', text: 'text-blue-700', dot: 'bg-blue-500' },
    DISPATCHED: { label: 'Dispatched', icon: <Truck className="w-5 h-5" />, gradient: 'from-purple-500 to-violet-600', text: 'text-purple-700', dot: 'bg-purple-500' },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery', icon: <Truck className="w-5 h-5" />, gradient: 'from-pink-500 to-rose-500', text: 'text-pink-700', dot: 'bg-pink-500' },
    BOOKED: { label: 'Confirmed', icon: <CheckCircle className="w-5 h-5" />, gradient: 'from-indigo-500 to-blue-600', text: 'text-indigo-700', dot: 'bg-indigo-500' },
    PENDING: { label: 'Pending', icon: <Clock className="w-5 h-5" />, gradient: 'from-amber-400 to-yellow-500', text: 'text-amber-700', dot: 'bg-amber-400' },
    ORDER_PLACED: { label: 'Order Placed', icon: <Clock className="w-5 h-5" />, gradient: 'from-amber-400 to-yellow-500', text: 'text-amber-700', dot: 'bg-amber-400' },
};

const getStatusCfg = (s: string) => STATUS_CFG[s] ?? {
    label: s.replace(/_/g, ' '), icon: <Package className="w-5 h-5" />,
    gradient: 'from-gray-400 to-gray-500', text: 'text-gray-700', dot: 'bg-gray-400',
};

// ── Main Component ─────────────────────────────────────────────────────────────
export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order }) => {
    if (!isOpen || !order) return null;

    const sc = getStatusCfg(order.current_status);
    const addr = order.shipping_address;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative bg-white rounded-3xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.25)] w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
                style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
            >
                {/* ── HERO HEADER ──────────────────────────────────────────── */}
                <div className={`relative bg-gradient-to-br ${sc.gradient} px-7 pt-7 pb-10 text-white overflow-hidden flex-shrink-0`}>
                    {/* decorative circles */}
                    <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
                    <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-black/10" />

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>

                    <div className="relative z-10 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {sc.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Order Details</p>
                            <h2 className="text-xl sm:text-2xl font-bold leading-tight mb-1">
                                {sc.label}
                            </h2>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/80 text-sm">
                                <span className="flex items-center gap-1.5">
                                    <Hash className="w-3.5 h-3.5" />
                                    {order.order_number}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {fmtDate(order.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Amount pill overlapping hero */}
                    <div className="relative z-10 mt-5 flex items-end justify-between">
                        <div className="flex flex-wrap gap-2">
                            {order.return_status && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
                                    <RotateCcw className="w-3 h-3" /> Return: {order.return_status.replace(/_/g, ' ')}
                                </span>
                            )}
                            {order.replace_status && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
                                    <RefreshCw className="w-3 h-3" /> Replace: {order.replace_status.replace(/_/g, ' ')}
                                </span>
                            )}
                            {order.refund_status && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
                                    💰 Refund: {formatRefundStatus(order.refund_status)}
                                </span>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-white/60 text-xs font-medium uppercase tracking-wide">Total</p>
                            <p className="text-2xl sm:text-3xl font-bold">{fmtINR(order.total_amount)}</p>
                        </div>
                    </div>
                </div>

                {/* ── SCROLLABLE BODY ───────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto bg-[#FAFAF8]">

                    {/* ── TRACKING INFO (if present) ────────────────────── */}
                    {(order.delivery_partner || order.tracking_number) && (
                        <div className="mx-6 -mt-4 mb-0 relative z-10">
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                                    <Truck className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Shipping</p>
                                    <p className="text-sm font-bold text-amber-900">
                                        {order.delivery_partner}
                                        {order.tracking_number && (
                                            <span className="font-normal text-amber-700 ml-2">· {order.tracking_number}</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-6 space-y-6">

                        {/* ── ITEMS ─────────────────────────────────────── */}
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <ShoppingBag className="w-4 h-4 text-[#C9A55C]" />
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[#999]">
                                    Items in this order ({order.items.length})
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {order.items.map((item, idx) => (
                                    <div
                                        key={item.order_item_id || idx}
                                        className="flex gap-4 bg-white rounded-2xl border border-[#EBEBEB] p-4 hover:border-[#C9A55C]/40 hover:shadow-sm transition-all"
                                    >
                                        {/* Image */}
                                        <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden border border-[#EBEBEB] bg-[#F9F9F9] flex-shrink-0">
                                            {item.product_image ? (
                                                <img
                                                    src={item.product_image}
                                                    alt={item.product_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="w-8 h-8 text-[#CCC]" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-semibold text-[#2C2416] text-sm sm:text-base leading-snug mb-1 line-clamp-2">
                                                    {item.product_name}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    {item.size && (
                                                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-[#F5F3EE] text-[#6B6B6B] rounded-md border border-[#E0E0D8]">
                                                            Size: {item.size}
                                                        </span>
                                                    )}
                                                    {item.color && (
                                                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-[#F5F3EE] text-[#6B6B6B] rounded-md border border-[#E0E0D8]">
                                                            Color: {item.color}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-end justify-between gap-2 mt-2">
                                                <p className="text-xs text-[#999]">
                                                    {item.quantity} × {fmtINR(item.unit_price)}
                                                </p>
                                                <p className="text-sm font-bold text-[#C9A55C]">
                                                    {fmtINR(item.total_price)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* ── TWO-COL: PAYMENT + ADDRESS ─────────────────── */}
                        <div className="grid sm:grid-cols-2 gap-4">

                            {/* Payment */}
                            <div className="bg-white rounded-2xl border border-[#EBEBEB] p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <CreditCard className="w-4 h-4 text-[#C9A55C]" />
                                    <p className="text-xs font-bold uppercase tracking-widest text-[#999]">Payment</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-[#6B6B6B]">Method</span>
                                        <span className="text-sm font-semibold text-[#2C2416]">{order.payment_method}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-[#6B6B6B]">Status</span>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${order.payment_status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                            order.payment_status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                                order.payment_status === 'REFUNDED' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-amber-100 text-amber-700'
                                            }`}>
                                            {order.payment_status}
                                        </span>
                                    </div>
                                    {order.refund_amount != null && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-[#6B6B6B]">Refund</span>
                                            <span className="text-sm font-semibold text-emerald-600">{fmtINR(order.refund_amount)}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-[#F0F0F0] pt-3 flex justify-between items-center">
                                        <span className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wide">Total Paid</span>
                                        <span className="text-lg font-bold text-[#C9A55C]">{fmtINR(order.total_amount)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="bg-white rounded-2xl border border-[#EBEBEB] p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <MapPin className="w-4 h-4 text-[#C9A55C]" />
                                    <p className="text-xs font-bold uppercase tracking-widest text-[#999]">Delivery Address</p>
                                </div>
                                {addr ? (
                                    <div className="space-y-1.5 text-sm">
                                        {(addr.first_name || addr.last_name) && (
                                            <div className="flex items-center gap-2">
                                                <User className="w-3.5 h-3.5 text-[#C9A55C] flex-shrink-0" />
                                                <span className="font-semibold text-[#2C2416]">
                                                    {[addr.first_name, addr.last_name].filter(Boolean).join(' ')}
                                                </span>
                                            </div>
                                        )}
                                        {addr.phone && (
                                            <div className="flex items-center gap-2 text-[#6B6B6B]">
                                                <Phone className="w-3.5 h-3.5 text-[#C9A55C] flex-shrink-0" />
                                                <span>{addr.phone}</span>
                                            </div>
                                        )}
                                        <p className="text-[#6B6B6B] leading-relaxed pt-1">
                                            {[
                                                addr.address_line1,
                                                addr.address_line2,
                                                addr.city,
                                                addr.state,
                                                addr.pincode,
                                                addr.country,
                                            ].filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-[#999]">No address on file</p>
                                )}
                            </div>
                        </div>

                        {/* ── RETURN / REPLACE DETAILS ───────────────────── */}
                        {(order.return_status || order.replace_status) && (
                            <div className="bg-white rounded-2xl border border-[#EBEBEB] p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <RefreshCw className="w-4 h-4 text-[#C9A55C]" />
                                    <p className="text-xs font-bold uppercase tracking-widest text-[#999]">Return / Replacement</p>
                                </div>
                                <div className="space-y-3">
                                    {order.return_status && (
                                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <RotateCcw className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-blue-900">Return Status</p>
                                                    {order.return_requested_at && (
                                                        <p className="text-[11px] text-blue-500">{fmtDate(order.return_requested_at)}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full">
                                                {order.return_status.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    )}
                                    {order.replace_status && (
                                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                    <RefreshCw className="w-4 h-4 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-purple-900">Replacement Status</p>
                                                    {order.replace_requested_at && (
                                                        <p className="text-[11px] text-purple-500">{fmtDate(order.replace_requested_at)}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full">
                                                {order.replace_status.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    )}
                                    <p className="text-[11px] text-[#999] flex items-center gap-1.5 mt-1">
                                        <Clock className="w-3 h-3" /> Estimated processing within 7 business days
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ── Cancellation Details ───────────────────────── */}
                        {order.current_status === 'CANCELLED' && order.cancellation_reason && (
                            <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <XCircle className="w-4 h-4 text-red-500" />
                                    <p className="text-xs font-bold uppercase tracking-widest text-red-400">Cancellation</p>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-red-500 text-xs">Reason</span>
                                        <span className="font-medium text-red-800">{order.cancellation_reason.replace(/_/g, ' ')}</span>
                                    </div>
                                    {order.cancel_feedback && (
                                        <div>
                                            <span className="text-red-500 text-xs">Feedback</span>
                                            <p className="mt-1 text-red-700 text-sm leading-relaxed">{order.cancel_feedback}</p>
                                        </div>
                                    )}
                                    {order.cancelled_at && (
                                        <p className="text-xs text-red-400 pt-1">{fmtDate(order.cancelled_at)}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── ORDER TIMELINE MINI ────────────────────── */}
                        <div className="bg-white rounded-2xl border border-[#EBEBEB] p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock className="w-4 h-4 text-[#C9A55C]" />
                                <p className="text-xs font-bold uppercase tracking-widest text-[#999]">Order Timeline</p>
                            </div>
                            <div className="flex items-center justify-between gap-1 flex-wrap sm:flex-nowrap">
                                {[
                                    { key: 'PENDING', label: 'Placed' },
                                    { key: 'BOOKED', label: 'Confirmed' },
                                    { key: 'DISPATCHED', label: 'Dispatched' },
                                    { key: 'SHIPPED', label: 'Shipped' },
                                    { key: 'OUT_FOR_DELIVERY', label: 'On Way' },
                                    { key: 'DELIVERED', label: 'Delivered' },
                                ].map((step, idx, arr) => {
                                    const statusOrder = ['PENDING', 'ORDER_PLACED', 'BOOKED', 'DISPATCHED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                                    const currentIdx = statusOrder.indexOf(order.current_status);
                                    const stepIdx = statusOrder.indexOf(step.key);
                                    const isDone = currentIdx >= stepIdx && order.current_status !== 'CANCELLED';
                                    const isCurrent = step.key === order.current_status;

                                    return (
                                        <React.Fragment key={step.key}>
                                            <div className="flex flex-col items-center gap-1 min-w-[48px]">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${isCurrent ? 'border-[#C9A55C] bg-[#C9A55C] text-white shadow-md' :
                                                    isDone ? 'border-emerald-400 bg-emerald-400 text-white' :
                                                        'border-[#E0E0D8] bg-white text-[#CCC]'
                                                    }`}>
                                                    {isDone && !isCurrent
                                                        ? <CheckCircle className="w-3.5 h-3.5" />
                                                        : <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-white' : 'bg-[#E0E0D8]'}`} />
                                                    }
                                                </div>
                                                <p className={`text-[9px] font-semibold text-center leading-tight ${isCurrent ? 'text-[#C9A55C]' : isDone ? 'text-emerald-600' : 'text-[#CCC]'
                                                    }`}>{step.label}</p>
                                            </div>
                                            {idx < arr.length - 1 && (
                                                <div className={`flex-1 h-0.5 mb-4 ${isDone && currentIdx > stepIdx ? 'bg-emerald-300' : 'bg-[#E8E8E8]'}`} />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── FOOTER ───────────────────────────────────────────────── */}
                <div className="border-t border-[#EBEBEB] bg-white px-6 py-4 flex items-center justify-between gap-4 flex-shrink-0">
                    <p className="text-xs text-[#999]">
                        Last updated: {fmtDate(order.updated_at)}
                    </p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gradient-to-r from-[#C9A55C] to-[#b08d4b] text-white text-sm font-semibold rounded-xl hover:from-[#b08d4b] hover:to-[#9a7a3e] transition-all shadow-md hover:shadow-lg"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
