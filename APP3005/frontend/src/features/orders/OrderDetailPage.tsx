// ============================================================
// ORDER DETAIL PAGE
// Route: /my-orders/:orderId
// Mobile-first, full-page, uses existing status configs
// ============================================================

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { UserDashboardLayout } from '@/components/layout/UserDashboardLayout';
import { formatRefundStatus } from './utils/order.utils';
import { useRefundSSE } from './hooks/useRefundSSE';
import { usePayU } from '@/hooks/usePayU';
import { paymentApi } from './api/payment.api';
import {
    ArrowLeft,
    Package,
    Truck,
    CheckCircle,
    Clock,
    XCircle,
    MapPin,
    CreditCard,
    RotateCcw,
    RefreshCw,
    Phone,
    User,
    Hash,
    Calendar,
    ChevronRight,
    ShoppingBag,
    AlertCircle,
    Loader2,
    Home,
    BadgeIndianRupee,
    Receipt,
} from 'lucide-react';
import { ordersApi } from './api/orders.api';
import type { Order, OrderStatus, ReturnStatus, ReplacementStatus } from './types/order.types';
import {
    ORDER_STATUS_CONFIG,
    PAYMENT_STATUS_CONFIG,
    RETURN_STATUS_CONFIG,
    REPLACEMENT_STATUS_CONFIG,
    ORDER_TIMELINE_STEPS,
    isStepCompleted,
    isStepActive,
} from './utils/order.utils';

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d?: string | null): string => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const fmtINR = (n?: number | Number | null): string =>
    n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

// ── Status icon map (matches STATUS_CFG from user request) ────────────────────
const STATUS_ICON: Record<string, React.ReactNode> = {
    DELIVERED: <CheckCircle className="w-5 h-5" />,
    CANCELLED: <XCircle className="w-5 h-5" />,
    SHIPPED: <Truck className="w-5 h-5" />,
    DISPATCHED: <Truck className="w-5 h-5" />,
    OUT_FOR_DELIVERY: <Truck className="w-5 h-5" />,
    BOOKED: <CheckCircle className="w-5 h-5" />,
    PENDING: <Clock className="w-5 h-5" />,
    ORDER_PLACED: <Clock className="w-5 h-5" />,
    PENDING_APPROVAL: <Clock className="w-5 h-5" />,
};

// Gradient map (per user's request)
const STATUS_GRADIENT: Record<string, string> = {
    DELIVERED: 'from-emerald-500 to-green-600',
    CANCELLED: 'from-red-500 to-rose-600',
    SHIPPED: 'from-blue-500 to-indigo-600',
    DISPATCHED: 'from-purple-500 to-violet-600',
    OUT_FOR_DELIVERY: 'from-pink-500 to-rose-500',
    BOOKED: 'from-[#C9A55C] to-[#A9833D]',
    PENDING: 'from-amber-400 to-yellow-500',
    ORDER_PLACED: 'from-amber-400 to-yellow-500',
    PENDING_APPROVAL: 'from-amber-400 to-yellow-500',
};

// ── Small reusable section heading ────────────────────────────────────────────
const Section: React.FC<{ icon: React.ReactNode; title: string; className?: string; children: React.ReactNode }> = ({
    icon, title, className = '', children,
}) => (
    <div className={`bg-white rounded-2xl border border-[#EBEBEB] shadow-sm overflow-hidden ${className}`}>
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#F5F5F5]">
            <span className="text-[#C9A55C]">{icon}</span>
            <h2 className="text-sm font-bold text-[#2C2416] tracking-tight">{title}</h2>
        </div>
        <div className="px-5 py-4">{children}</div>
    </div>
);

// ── Row helper ─────────────────────────────────────────────────────────────
const Row: React.FC<{ label: string; value: React.ReactNode; highlight?: boolean }> = ({ label, value, highlight }) => (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[#F9F9F9] last:border-0">
        <span className="text-xs text-[#999] font-medium flex-shrink-0 mt-0.5">{label}</span>
        <span className={`text-xs font-semibold text-right ${highlight ? 'text-[#C9A55C]' : 'text-[#2C2416]'}`}>{value}</span>
    </div>
);

// ── Timeline step labels ──────────────────────────────────────────────────────
const TIMELINE_LABELS: Partial<Record<OrderStatus, string>> = {
    ORDER_PLACED: 'Ordered',
    BOOKED: 'Confirmed',
    DISPATCHED: 'Dispatched',
    SHIPPED: 'Shipped',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
};

// ── Return pipeline steps ──────────────────────────────────────────────────
const RETURN_PIPELINE: ReturnStatus[] = ['REQUESTED', 'APPROVED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'QC_PASSED', 'COMPLETED'];
const REPLACE_PIPELINE: ReplacementStatus[] = ['REQUESTED', 'APPROVED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'DISPATCHED', 'DELIVERED', 'COMPLETED'];
const SUBHEADER_OFFSET_CLASS = 'top-[61px] lg:top-0';

// ── Main Component ────────────────────────────────────────────────────────────
export const OrderDetailPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const { redirectToPayU } = usePayU();

    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRetryingPayment, setIsRetryingPayment] = useState(false);

    // ── SSE Real-time Refund Updates ──────────────────────────────────────────
    useRefundSSE({
        watchOrderIds: orderId ? [orderId] : undefined,
        onUpdate: (event) => {
            console.log('[OrderDetail] SSE Update received:', event);
            setOrder((prev) => {
                if (!prev) return prev;
                
                let targetStatus = event.status;
                if (targetStatus === 'FAILED') targetStatus = 'PROCESSING';
                
                const updatedStatusFields: any = { refund_status: targetStatus };
                
                // If refund Completes, seamlessly resolve ongoing returns/replacements instantly in UI
                if (targetStatus === 'COMPLETED') {
                    if (prev.return_status && prev.return_status !== 'COMPLETED') {
                        updatedStatusFields.return_status = 'COMPLETED';
                    }
                    if (prev.replace_status && prev.replace_status !== 'COMPLETED') {
                        updatedStatusFields.replace_status = 'COMPLETED';
                    }
                }

                return {
                    ...prev,
                    ...updatedStatusFields,
                };
            });
        },
    });

    useEffect(() => {
        if (!orderId) return;
        (async () => {
            setIsLoading(true);
            setError(null);
            try {
                const orders = await ordersApi.getMyOrders();
                const found = orders.find(o => o.order_id === orderId);
                if (!found) throw new Error('Order not found');
                
                // State coercion logic for user view
                if (found.refund_status === 'COMPLETED') {
                    if (found.return_status && found.return_status !== 'COMPLETED') {
                        found.return_status = 'COMPLETED';
                    }
                    if (found.replace_status && found.replace_status !== 'COMPLETED') {
                        found.replace_status = 'COMPLETED';
                    }
                } else if (found.refund_status === 'FAILED') {
                    // Mask internal PayU failures from users; to them it's still processing while admin retries
                    found.refund_status = 'PROCESSING';
                }

                setOrder(found);
            } catch (e: any) {
                setError(e.message || 'Failed to load order');
            } finally {
                setIsLoading(false);
            }
        })();
    }, [orderId]);

    const handleRetryPayment = async () => {
        if (!order) return;
        setIsRetryingPayment(true);
        try {
            sessionStorage.setItem('pending_order_id', order.order_id);
            sessionStorage.setItem('pending_order_number', order.order_number);
            const payuPayload = await paymentApi.initiatePayment(order.order_id);
            redirectToPayU(payuPayload);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || 'Failed to initiate payment');
        } finally {
            setIsRetryingPayment(false);
        }
    };

    // ── Loading ────────────────────────────────────────────────────────────
    if (isLoading) return (
        <UserDashboardLayout>
            <div className="min-h-[calc(100vh-61px)] bg-[#FAFAF8] flex items-center justify-center px-4 lg:min-h-screen">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-[#C9A55C]" />
                    <p className="text-sm text-[#6B6B6B]">Loading order details…</p>
                </div>
            </div>
        </UserDashboardLayout>
    );

    // ── Error ──────────────────────────────────────────────────────────────
    if (error || !order) return (
        <UserDashboardLayout>
            <div className="min-h-[calc(100vh-61px)] bg-[#FAFAF8] flex items-center justify-center p-4 lg:min-h-screen">
                <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-lg border border-[#EBEBEB]">
                    <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-7 h-7 text-red-500" />
                    </div>
                    <h2 className="font-bold text-[#2C2416] text-lg mb-2">Order Not Found</h2>
                    <p className="text-[#999] text-sm mb-6">{error || 'We could not load this order.'}</p>
                    <button
                        onClick={() => navigate('/my-orders')}
                        className="w-full py-3 bg-[#2C2416] text-[#C9A55C] font-bold rounded-xl text-sm hover:bg-[#1A150D] transition-colors"
                    >
                        Back to My Orders
                    </button>
                </div>
            </div>
        </UserDashboardLayout>
    );

    // ── Derived values ─────────────────────────────────────────────────────
    const statusKey = order.current_status as string;
    // Use existing ORDER_STATUS_CONFIG from utils; fall back gracefully
    const statusCfg = ORDER_STATUS_CONFIG[order.current_status] ?? {
        label: statusKey.replace(/_/g, ' '),
        color: '#6B7280',
        bgColor: '#F3F4F6',
        icon: '•',
    };
    const gradient = STATUS_GRADIENT[statusKey] ?? 'from-gray-400 to-gray-500';
    const statusIcon = STATUS_ICON[statusKey] ?? <Clock className="w-5 h-5" />;

    const addr = order.shipping_address;
    const isCancelled = order.current_status === 'CANCELLED';
    const isDelivered = order.current_status === 'DELIVERED';

    // payment config
    const payCfg = PAYMENT_STATUS_CONFIG[order.payment_status] ?? {
        label: order.payment_status,
        color: '#6B7280',
        bgColor: '#F3F4F6',
    };

    return (
        <UserDashboardLayout>
            <div className="min-h-screen bg-[#F5F3EE]" style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>

                {/* ── STICKY TOP NAV ──────────────────────────────────────────── */}
                <div className={`sticky ${SUBHEADER_OFFSET_CLASS} z-30 bg-white border-b border-[#E0E0D8] shadow-sm`}>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2">
                    <button
                        onClick={() => navigate('/my-orders')}
                        className="flex items-center gap-1.5 text-sm font-medium text-[#6B6B6B] hover:text-[#2C2416] transition-colors flex-shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden xs:inline">My Orders</span>
                    </button>
                    <ChevronRight className="w-3.5 h-3.5 text-[#CCC] flex-shrink-0" />
                    <span className="text-sm font-bold text-[#2C2416] truncate">
                        {order.order_number}
                    </span>
                    <div className="ml-auto flex-shrink-0">
                        <span
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                            style={{ background: `linear-gradient(135deg, var(--s1), var(--s2))` }}
                        >
                            <span
                                className={`inline-block px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-gradient-to-r ${gradient} text-white`}
                            >
                                {statusCfg.label}
                            </span>
                        </span>
                    </div>
                </div>
                </div>

                {/* ── HERO STATUS BANNER ───────────────────────────────────────── */}
                <div className={`bg-gradient-to-r ${gradient} text-white`}>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                            {statusIcon}
                        </div>
                        <div>
                            <p className="text-lg font-bold leading-tight">{statusCfg.label}</p>
                            <p className="text-white/70 text-xs mt-0.5">
                                Ordered on {fmtDate(order.created_at)}
                            </p>
                        </div>
                    </div>
                    {/* Action buttons in header */}
                    <div className="flex flex-wrap gap-2">
                        {(order.payment_status === 'FAILED' || (order.payment_status === 'PENDING' && order.payment_method !== 'COD')) && !isCancelled && (
                            <button
                                onClick={handleRetryPayment}
                                disabled={isRetryingPayment}
                                className="px-4 py-2 rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 text-xs font-bold border border-transparent transition-all flex items-center gap-1.5 shadow-sm"
                            >
                                {isRetryingPayment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5 font-bold" />}
                                {isRetryingPayment ? 'Initiating...' : 'Pay Now'}
                            </button>
                        )}
                        {!isCancelled && !isDelivered && (order.payment_method === 'COD' || order.payment_status === 'COMPLETED') && (
                            <button
                                onClick={() => navigate(`/track-order/${order.order_id}`)}
                                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold border border-white/30 backdrop-blur-sm transition-all flex items-center gap-1.5"
                            >
                                <Truck className="w-3.5 h-3.5" />
                                Track Order
                            </button>
                        )}
                        {isDelivered && !order.return_status && !order.replace_status && (
                            <>
                                <button
                                    onClick={() => navigate(`/my-orders/${order.order_id}/return`)}
                                    className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold border border-white/30 transition-all flex items-center gap-1.5"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Return
                                </button>
                                <button
                                    onClick={() => navigate(`/my-orders/${order.order_id}/replace`)}
                                    className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold border border-white/30 transition-all flex items-center gap-1.5"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Replace
                                </button>
                            </>
                        )}
                    </div>
                </div>
                </div>

                {/* ── ORDER TIMELINE ───────────────────────────────────────────── */}
                {!isCancelled && (
                    <div className="bg-white border-b border-[#EBEBEB] shadow-sm">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 overflow-x-auto">
                        <div className="flex items-start min-w-[440px]">
                            {ORDER_TIMELINE_STEPS.map((step, idx) => {
                                const done = isStepCompleted(step, order.current_status);
                                const active = isStepActive(step, order.current_status);
                                const label = TIMELINE_LABELS[step] ?? step.replace(/_/g, ' ');
                                return (
                                    <React.Fragment key={step}>
                                        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                                            <div className={`
                                                w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                                                ${active
                                                    ? `bg-gradient-to-br ${gradient} border-transparent shadow-md`
                                                    : done
                                                        ? 'bg-emerald-500 border-emerald-500'
                                                        : 'bg-white border-[#E0E0D8]'
                                                }
                                            `}>
                                                {done && !active
                                                    ? <CheckCircle className="w-4 h-4 text-white" />
                                                    : active
                                                        ? <div className="w-2 h-2 rounded-full bg-white" />
                                                        : <div className="w-2 h-2 rounded-full bg-[#E0E0D8]" />
                                                }
                                            </div>
                                            <span className={`text-[9px] sm:text-[10px] font-semibold text-center leading-tight max-w-[56px] ${active ? 'text-[#2C2416]' : done ? 'text-emerald-600' : 'text-[#CCC]'
                                                }`}>
                                                {label}
                                            </span>
                                        </div>
                                        {idx < ORDER_TIMELINE_STEPS.length - 1 && (
                                            <div className={`flex-1 h-0.5 mt-4 mx-0.5 ${isStepCompleted(ORDER_TIMELINE_STEPS[idx + 1], order.current_status)
                                                ? 'bg-emerald-400'
                                                : 'bg-[#E8E8E8]'
                                                }`} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                    </div>
                )}

                {/* ── PAGE BODY ────────────────────────────────────────────────── */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">

                {/* ── ITEMS ──────────────────────────────────────────────── */}
                <Section icon={<ShoppingBag className="w-4 h-4" />} title={`Items in this Order (${order.items.length})`}>
                    <div className="divide-y divide-[#F5F5F5] -mx-5 -my-4">
                        {order.items.map((item, idx) => (
                            <div key={item.order_item_id || idx} className="flex gap-3 px-5 py-4">
                                {/* Product image */}
                                <div className="w-16 h-20 sm:w-20 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden border border-[#EBEBEB] bg-[#F9F9F9]">
                                    {item.product_image ? (
                                        <img
                                            src={item.product_image}
                                            alt={item.product_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="w-6 h-6 text-[#CCC]" />
                                        </div>
                                    )}
                                </div>

                                {/* Product info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-[#2C2416] text-sm leading-snug mb-1.5 line-clamp-2">
                                        {item.product_name}
                                    </h3>
                                    {/* Attribute chips */}
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        <span className="px-2 py-0.5 bg-[#F5F3EE] text-[#6B6B6B] text-[10px] font-semibold rounded-md border border-[#E0E0D8]">
                                            Qty: {item.quantity}
                                        </span>
                                        {item.size && (
                                            <span className="px-2 py-0.5 bg-[#F5F3EE] text-[#6B6B6B] text-[10px] font-semibold rounded-md border border-[#E0E0D8]">
                                                Size: {item.size}
                                            </span>
                                        )}
                                        {item.color && (
                                            <span className="px-2 py-0.5 bg-[#F5F3EE] text-[#6B6B6B] text-[10px] font-semibold rounded-md border border-[#E0E0D8]">
                                                Color: {item.color}
                                            </span>
                                        )}
                                    </div>
                                    {/* Price */}
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-[#999] text-[10px]">
                                            {item.quantity} × {fmtINR(item.unit_price)}
                                        </span>
                                        <span className="text-sm font-bold text-[#C9A55C]">
                                            {fmtINR(item.total_price)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* ── TWO-COLUMN on md+ ─────────────────────────────────── */}
                <div className="grid md:grid-cols-2 gap-4">

                    {/* ── DELIVERY ADDRESS ─────────────────────────────── */}
                    <Section icon={<MapPin className="w-4 h-4" />} title="Delivery Address">
                        {addr ? (
                            <div className="space-y-3">
                                {/* Name */}
                                {(addr.first_name || addr.last_name) && (
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-[#F5F3EE] flex items-center justify-center flex-shrink-0">
                                            <User className="w-4 h-4 text-[#C9A55C]" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-[#999] font-medium">Full Name</p>
                                            <p className="text-sm font-bold text-[#2C2416]">
                                                {[addr.first_name, addr.last_name].filter(Boolean).join(' ')}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Phone */}
                                {addr.phone && (
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-[#F5F3EE] flex items-center justify-center flex-shrink-0">
                                            <Phone className="w-4 h-4 text-[#C9A55C]" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-[#999] font-medium">Phone</p>
                                            <p className="text-sm font-semibold text-[#2C2416]">{addr.phone}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Address lines */}
                                {(addr.address_line1 || addr.address_line2) && (
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-[#F5F3EE] flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Home className="w-4 h-4 text-[#C9A55C]" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-[#999] font-medium">Address</p>
                                            {addr.address_line1 && (
                                                <p className="text-sm font-semibold text-[#2C2416]">{addr.address_line1}</p>
                                            )}
                                            {addr.address_line2 && (
                                                <p className="text-xs text-[#6B6B6B]">{addr.address_line2}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* City / State / Pincode */}
                                {(addr.city || addr.state || addr.pincode) && (
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-[#F5F3EE] flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <MapPin className="w-4 h-4 text-[#C9A55C]" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-[#999] font-medium">City / State / PIN</p>
                                            <p className="text-sm font-semibold text-[#2C2416]">
                                                {[addr.city, addr.state].filter(Boolean).join(', ')}
                                                {addr.pincode && ` – ${addr.pincode}`}
                                            </p>
                                            {addr.country && (
                                                <p className="text-xs text-[#999]">{addr.country}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 py-2">
                                <AlertCircle className="w-5 h-5 text-[#CCC]" />
                                <p className="text-sm text-[#999]">No delivery address recorded.</p>
                            </div>
                        )}
                    </Section>

                    {/* ── ORDER SUMMARY ─────────────────────────────────── */}
                    <Section icon={<Receipt className="w-4 h-4" />} title="Order Summary">
                        <div>
                            <Row label="Order Number" value={order.order_number} />
                            <Row label="Order Date" value={fmtDate(order.created_at)} />
                            <Row label="Total Items" value={order.items.length} />
                            {order.tracking_number && (
                                <Row label="Tracking ID" value={order.tracking_number} />
                            )}
                            {order.delivery_partner && (
                                <Row label="Courier" value={order.delivery_partner} />
                            )}
                            <Row
                                label="Order Total"
                                value={fmtINR(order.total_amount)}
                                highlight
                            />
                        </div>
                    </Section>
                </div>

                {/* ── PAYMENT INFO ──────────────────────────────────────────── */}
                <Section icon={<CreditCard className="w-4 h-4" />} title="Payment Information">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* Method */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#F5F3EE] flex items-center justify-center">
                                <BadgeIndianRupee className="w-5 h-5 text-[#C9A55C]" />
                            </div>
                            <div>
                                <p className="text-[10px] text-[#999] font-medium">Payment Method</p>
                                <p className="text-sm font-bold text-[#2C2416]">
                                    {order.payment_method === 'COD'
                                        ? 'Cash on Delivery'
                                        : order.payment_method === 'PAYU'
                                            ? 'PayU (Online)'
                                            : 'Prepaid'}
                                </p>
                            </div>
                        </div>

                        {/* Status badge */}
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="text-[10px] text-[#999] font-medium mb-1">Payment Status</p>
                                <span
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                                    style={{ background: payCfg.bgColor, color: payCfg.color }}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: payCfg.color }} />
                                    {payCfg.label}
                                </span>
                            </div>

                            {/* Amount */}
                            <div className="ml-auto sm:ml-0 text-right">
                                <p className="text-[10px] text-[#999] font-medium">Amount Paid</p>
                                <p className="text-lg font-bold text-[#C9A55C]">{fmtINR(order.total_amount)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Refund info */}
                    {(order.refund_status || order.refund_amount != null) && (
                        <div className="mt-4 pt-4 border-t border-[#F5F5F5] space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                {order.refund_status && (
                                    <div>
                                        <p className="text-[10px] text-[#999] font-medium">Refund Status</p>
                                        <p className="text-sm font-bold text-purple-600">
                                            {formatRefundStatus(order.refund_status)}
                                        </p>
                                    </div>
                                )}
                                {order.refund_amount != null && (
                                    <div className="text-right">
                                        <p className="text-[10px] text-[#999] font-medium">Refund Amount</p>
                                        <p className="text-base font-bold text-emerald-600">{fmtINR(order.refund_amount)}</p>
                                    </div>
                                )}
                            </div>

                            {order.refund_status === 'COMPLETED' && (
                                <div className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                                            Wallet Credit
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-emerald-800">
                                            Your approved refund has been credited to your wallet and is visible in Wallet transactions.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/wallet')}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 transition-colors hover:bg-emerald-100"
                                    >
                                        View Wallet
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </Section>

                {/* ── RETURN STATUS ─────────────────────────────────────────── */}
                {order.return_status && (
                    <Section icon={<RotateCcw className="w-4 h-4" />} title="Return Request">
                        <div>
                            {/* Status + date */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                                <span
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold self-start"
                                    style={{
                                        background: `${RETURN_STATUS_CONFIG[order.return_status]?.color}18`,
                                        color: RETURN_STATUS_CONFIG[order.return_status]?.color ?? '#6B6B6B',
                                    }}
                                >
                                    {RETURN_STATUS_CONFIG[order.return_status]?.label ?? order.return_status.replace(/_/g, ' ')}
                                </span>
                                {order.return_requested_at && (
                                    <p className="text-[10px] text-[#999] flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Requested {fmtDate(order.return_requested_at)}
                                    </p>
                                )}
                            </div>

                            {/* Return mini-pipeline */}
                            <div className="overflow-x-auto pb-1">
                                <div className="flex items-start min-w-[360px]">
                                    {RETURN_PIPELINE.map((step, idx) => {

                                        const cfg = RETURN_STATUS_CONFIG[step];
                                        const rIdx = RETURN_PIPELINE.indexOf(order.return_status as ReturnStatus);
                                        const sIdx = RETURN_PIPELINE.indexOf(step);
                                        const done = rIdx >= sIdx;
                                        return (
                                            <React.Fragment key={step}>
                                                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${done ? 'bg-blue-500 border-blue-500' : 'bg-white border-[#E0E0D8]'
                                                        }`}>
                                                        {done && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                                    </div>
                                                    <p className={`text-[9px] font-medium text-center leading-tight max-w-[52px] ${done ? 'text-blue-600' : 'text-[#CCC]'}`}>
                                                        {cfg?.label.replace('Return ', '').replace('QC ', 'QC ') ?? step.replace(/_/g, ' ')}
                                                    </p>
                                                </div>
                                                {idx < RETURN_PIPELINE.length - 1 && (
                                                    <div className={`flex-1 h-px mt-3 mx-0.5 ${rIdx > sIdx ? 'bg-blue-300' : 'bg-[#E8E8E8]'
                                                        }`} />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </Section>
                )}

                {/* ── REPLACEMENT STATUS ────────────────────────────────────── */}
                {order.replace_status && (
                    <Section icon={<RefreshCw className="w-4 h-4" />} title="Replacement Request">
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                                <span
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold self-start"
                                    style={{
                                        background: `${REPLACEMENT_STATUS_CONFIG[order.replace_status]?.color}18`,
                                        color: REPLACEMENT_STATUS_CONFIG[order.replace_status]?.color ?? '#6B6B6B',
                                    }}
                                >
                                    {REPLACEMENT_STATUS_CONFIG[order.replace_status]?.label ?? order.replace_status.replace(/_/g, ' ')}
                                </span>
                                {order.replace_requested_at && (
                                    <p className="text-[10px] text-[#999] flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Requested {fmtDate(order.replace_requested_at)}
                                    </p>
                                )}
                            </div>

                            <div className="overflow-x-auto pb-1">
                                <div className="flex items-start min-w-[420px]">
                                    {REPLACE_PIPELINE.map((step, idx) => {
                                        const cfg = REPLACEMENT_STATUS_CONFIG[step];
                                        const rIdx = REPLACE_PIPELINE.indexOf(order.replace_status as ReplacementStatus);
                                        const sIdx = REPLACE_PIPELINE.indexOf(step);
                                        const done = rIdx >= sIdx;
                                        return (
                                            <React.Fragment key={step}>
                                                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${done ? 'bg-purple-500 border-purple-500' : 'bg-white border-[#E0E0D8]'
                                                        }`}>
                                                        {done && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                                    </div>
                                                    <p className={`text-[9px] font-medium text-center leading-tight max-w-[52px] ${done ? 'text-purple-600' : 'text-[#CCC]'}`}>
                                                        {cfg?.label.replace('Replacement ', '').replace('New Item ', '') ?? step.replace(/_/g, ' ')}
                                                    </p>
                                                </div>
                                                {idx < REPLACE_PIPELINE.length - 1 && (
                                                    <div className={`flex-1 h-px mt-3 mx-0.5 ${rIdx > sIdx ? 'bg-purple-300' : 'bg-[#E8E8E8]'
                                                        }`} />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </Section>
                )}

                {/* ── CANCELLATION ─────────────────────────────────────────── */}
                {isCancelled && (
                    <div className="bg-red-50 rounded-2xl border border-red-100 overflow-hidden">
                        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-red-100">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <h2 className="text-sm font-bold text-red-700">Cancellation Details</h2>
                        </div>
                        <div className="px-5 py-4 space-y-3">
                            {order.cancellation_reason && (
                                <div>
                                    <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-1">Reason</p>
                                    <p className="text-sm font-semibold text-red-800">
                                        {order.cancellation_reason.replace(/_/g, ' ')}
                                    </p>
                                </div>
                            )}
                            {order.cancel_feedback && (
                                <div>
                                    <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-1">Feedback</p>
                                    <p className="text-sm text-red-700 leading-relaxed">{order.cancel_feedback}</p>
                                </div>
                            )}
                            {order.cancelled_at && (
                                <p className="text-[10px] text-red-400 flex items-center gap-1.5 pt-1">
                                    <Clock className="w-3 h-3" />
                                    Cancelled on {fmtDate(order.cancelled_at)}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* ── FOOTER META ───────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 pb-6">
                    <p className="text-[10px] text-[#CCC] flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        Order ID: {order.order_id}
                    </p>
                    <p className="text-[10px] text-[#CCC] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last updated: {fmtDate(order.updated_at)}
                    </p>
                </div>

            </div>
            </div>
        </UserDashboardLayout>
    );
};

export default OrderDetailPage;
