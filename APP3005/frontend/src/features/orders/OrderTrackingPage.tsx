import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Truck, CheckCircle, Package, MapPin, Phone, Mail, RefreshCw, Clock } from 'lucide-react';
import { ordersApi } from './api/orders.api';
import { Order } from './types/order.types';
import { formatRefundStatus } from './utils/order.utils';

// ── Status pipeline — labels match admin page STATUS_META exactly ─────────────
const STEPS = [
    { status: 'PENDING', label: 'Pending Approval', icon: CheckCircle },
    { status: 'BOOKED', label: 'Confirmed', icon: CheckCircle },
    { status: 'DISPATCHED', label: 'Dispatched', icon: Package },
    { status: 'SHIPPED', label: 'In Transit', icon: Truck },
    { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: MapPin },
    { status: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
];

// Step index for progress bar — same STATUS_ORDER as admin page
const STATUS_INDEX: Record<string, number> = {
    PENDING: 0,
    PENDING_APPROVAL: 0,   // alias — same visual position
    BOOKED: 1,
    DISPATCHED: 2,
    SHIPPED: 3,
    OUT_FOR_DELIVERY: 4,
    DELIVERED: 5,
};

function getStepIndex(status: string): number {
    return STATUS_INDEX[status] ?? 0;
}

function formatDate(raw: string | undefined | null): string {
    if (!raw) return '—';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Status messages — mirror admin STATUS_META labels exactly ────────────────
function getStatusMessage(status: string) {
    switch (status) {
        case 'DELIVERED':
            return {
                title: 'Delivered',
                subtitle: 'Your order has been successfully delivered',
                color: 'text-emerald-600',  // matches admin #10B981
            };
        case 'OUT_FOR_DELIVERY':
            return {
                title: 'Out for Delivery',
                subtitle: 'Your delivery partner is on the way to you',
                color: 'text-pink-600',     // matches admin #EC4899
            };
        case 'SHIPPED':
            return {
                title: 'In Transit',
                subtitle: 'Your order is on its way to you',
                color: 'text-indigo-500',   // matches admin #6366F1
            };
        case 'DISPATCHED':
            return {
                title: 'Dispatched',
                subtitle: 'Your order has been dispatched from the warehouse',
                color: 'text-purple-500',   // matches admin #8B5CF6
            };
        case 'BOOKED':
            return {
                title: 'Confirmed',
                subtitle: 'Your order has been confirmed by the team',
                color: 'text-blue-500',     // matches admin #3B82F6
            };
        case 'CANCELLED':
            return {
                title: 'Cancelled',
                subtitle: 'This order has been cancelled',
                color: 'text-red-500',      // matches admin #EF4444
            };
        case 'PENDING_APPROVAL':
        case 'PENDING':
        default:
            return {
                title: 'Pending Approval',
                subtitle: 'Your order is awaiting confirmation from our team',
                color: 'text-amber-500',    // matches admin #F59E0B
            };
    }
}


// ── Normalize backend's camelCase response → snake_case used by UI ─────────
// Backend getOrderTracking() returns camelCase (currentStatus, orderNumber…)
// but the Order type & all UI code reads snake_case (current_status, order_number…)
function normalizeOrder(raw: any): Order {
    const normalized: any = {
        // IDs
        order_id: raw.order_id ?? raw.orderId,
        order_number: raw.order_number ?? raw.orderNumber,
        user_id: raw.user_id ?? raw.userId,

        // Status — THIS is the critical one
        current_status: raw.current_status ?? raw.currentStatus ?? 'PENDING',

        // Money
        total_amount: raw.total_amount ?? raw.totalAmount ?? 0,

        // Payment
        payment_method: raw.payment_method ?? raw.paymentMethod,
        payment_status: raw.payment_status ?? raw.paymentStatus,

        // Tracking
        tracking_number: raw.tracking_number ?? raw.trackingNumber ?? null,
        delivery_partner: raw.delivery_partner ?? raw.deliveryPartner ?? null,

        // Timestamps
        created_at: raw.created_at ?? raw.createdAt,
        updated_at: raw.updated_at ?? raw.updatedAt,

        // Cancellation
        cancellation_reason: raw.cancellation_reason ?? raw.cancellationReason ?? null,

        // Post-Delivery Status
        return_status: raw.return_status ?? raw.returnStatus ?? null,
        replace_status: raw.replace_status ?? raw.replaceStatus ?? null,
        refund_status: raw.refund_status ?? raw.refundStatus ?? null,

        // Address — both casing patterns
        shipping_address: raw.shipping_address ?? raw.shippingAddress ?? null,

        // Items — keep as-is (already included)
        items: raw.items ?? [],
    };
    
    // Mask logic
    if (normalized.refund_status === 'COMPLETED') {
        if (normalized.return_status && normalized.return_status !== 'COMPLETED') normalized.return_status = 'COMPLETED';
        if (normalized.replace_status && normalized.replace_status !== 'COMPLETED') normalized.replace_status = 'COMPLETED';
    } else if (normalized.refund_status === 'FAILED') {
        normalized.refund_status = 'PROCESSING';
    }

    return normalized as Order;
}

import { useRefundSSE, RefundSseEvent } from './hooks/useRefundSSE';

export const OrderTrackingPage = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const fromCart = searchParams.get('from') === 'cart';

    // ── SSE Real-time Refund Updates ──────────────────────────────────────────
    useRefundSSE({
        watchOrderIds: orderId ? [orderId] : undefined,
        onUpdate: (event: RefundSseEvent) => {
            console.log('[OrderTracking] SSE Update received:', event);
            setOrder((prev) => {
                if (!prev) return prev;
                let targetStatus = event.status;
                if (targetStatus === 'FAILED') targetStatus = 'PROCESSING';

                const updated = {
                    ...prev,
                    refund_status: targetStatus,
                };

                if (targetStatus === 'COMPLETED') {
                    if (updated.return_status && updated.return_status !== 'COMPLETED') updated.return_status = 'COMPLETED';
                    if (updated.replace_status && updated.replace_status !== 'COMPLETED') updated.replace_status = 'COMPLETED';
                }

                return updated;
            });
            // Update last refresh timestamp to trigger UI cues if any
            setLastRefresh(new Date());
        },
    });

    // Always fetch FRESH data via the existing ordersApi (Axios with auth interceptor)
    const fetchOrder = useCallback(async (id: string) => {
        try {
            const raw = await ordersApi.getOrder(id);
            // Normalize camelCase → snake_case so all UI reads work correctly
            setOrder(normalizeOrder(raw));
            setLastRefresh(new Date());
        } catch (err) {
            console.error('Failed to fetch order:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (orderId) fetchOrder(orderId);
    }, [orderId, fetchOrder]);

    // Auto-refresh every 30 s for live status updates
    useEffect(() => {
        if (!orderId) return;
        const interval = setInterval(() => fetchOrder(orderId), 30_000);
        return () => clearInterval(interval);
    }, [orderId, fetchOrder]);

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#FAF8F3] to-[#F5F3EE] flex items-center justify-center">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#C9A55C] border-t-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Truck className="w-6 h-6 text-[#C9A55C]" />
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#FAF8F3] to-[#F5F3EE] flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-[#2C2416] mb-2">Order Not Found</h2>
                    <p className="text-[#6B6B6B] mb-6">We couldn't find the order you're looking for.</p>
                    <button
                        onClick={() => navigate('/my-orders')}
                        className="px-6 py-3 bg-[#2C2416] text-white rounded-lg hover:bg-[#4A3F2C] transition-colors font-medium"
                    >
                        Back to Orders
                    </button>
                </div>
            </div>
        );
    }

    const currentStatus = order.current_status || 'PENDING';
    const isCancelled = currentStatus === 'CANCELLED';
    const isDelivered = currentStatus === 'DELIVERED';
    const currentStepIndex = getStepIndex(currentStatus);
    const statusMessage = getStatusMessage(currentStatus);
    const addr = order.shipping_address;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#FAF8F3] to-[#F5F3EE]">

            {/* Header */}
            <div className="bg-white border-b border-[#E0E0D8] sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={() => navigate(`/my-orders${fromCart ? '?from=cart' : ''}`)}
                            className="flex items-center gap-2 text-sm font-medium text-[#6B6B6B] hover:text-[#2C2416] transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Orders</span>
                        </button>
                        <div className="flex items-center gap-4">
                            {/* Manual refresh */}
                            <button
                                onClick={() => { setLoading(true); fetchOrder(orderId!); }}
                                title="Refresh status"
                                className="flex items-center gap-1.5 text-xs text-[#6B6B6B] hover:text-[#C9A55C] transition-colors"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Refresh</span>
                            </button>
                            <div className="text-right">
                                <p className="text-xs text-[#6B6B6B]">Order Number</p>
                                <p className="text-sm font-bold text-[#2C2416]">{order.order_number}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <div className="grid lg:grid-cols-3 gap-6">

                    {/* ── Left Column ─────────────────────────────────────── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Status Card */}
                        <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">

                            {/* Title */}
                            <div className="text-center mb-8">
                                <h1 className={`text-2xl sm:text-3xl font-serif font-bold mb-2 ${statusMessage.color}`}>
                                    {statusMessage.title}
                                </h1>
                                <p className="text-sm text-[#6B6B6B]">{statusMessage.subtitle}</p>
                                {!isDelivered && !isCancelled && (
                                    <p className="text-xs text-[#999999] mt-1">Estimated Delivery: 3–5 Days</p>
                                )}
                                {isCancelled && order.cancellation_reason && (
                                    <div className="mt-4 p-3 bg-red-50 rounded-lg mx-auto max-w-sm">
                                        <p className="text-xs text-red-800">
                                            <span className="font-semibold">Reason:</span> {order.cancellation_reason}
                                        </p>
                                    </div>
                                )}
                                {order.refund_status && (
                                    <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg mx-auto max-w-sm">
                                        <p className="text-xs text-emerald-800">
                                            <span className="font-semibold">Refund:</span> {formatRefundStatus(order.refund_status)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Progress Tracker */}
                            {!isCancelled && (
                                <div className="mb-8">
                                    <div className="relative">
                                        {/* Background line */}
                                        <div className="absolute left-0 right-0 top-6 h-1 bg-[#E0E0D8]">
                                            <div
                                                className="h-full bg-[#74B886] transition-all duration-700 ease-out"
                                                style={{
                                                    width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%`,
                                                }}
                                            />
                                        </div>

                                        {/* Steps */}
                                        <div className="relative flex justify-between">
                                            {STEPS.map((step, index) => {
                                                const isCompleted = index <= currentStepIndex;
                                                const isCurrent = index === currentStepIndex;
                                                const StepIcon = step.icon;
                                                return (
                                                    <div key={index} className="flex flex-col items-center flex-1">
                                                        <div className={`
                                                            w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-500
                                                            ${isCompleted
                                                                ? 'bg-[#74B886] shadow-lg'
                                                                : 'bg-white border-2 border-[#E0E0D8]'
                                                            }
                                                            ${isCurrent ? 'ring-4 ring-[#74B886]/30 scale-110' : ''}
                                                        `}>
                                                            <StepIcon className={`w-6 h-6 ${isCompleted ? 'text-white' : 'text-[#999999]'}`} />
                                                        </div>
                                                        <p className={`text-xs sm:text-sm font-medium text-center ${isCompleted ? 'text-[#2C2416]' : 'text-[#999999]'}`}>
                                                            {step.label}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tracking info (if available) */}
                            {(order.tracking_number || order.delivery_partner) && (
                                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                                    <Truck className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                    <div className="text-sm">
                                        {order.delivery_partner && (
                                            <span className="font-semibold text-[#2C2416]">{order.delivery_partner}</span>
                                        )}
                                        {order.tracking_number && (
                                            <span className="text-[#6B6B6B] ml-2 font-mono text-xs">{order.tracking_number}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Timeline message */}
                            <div className="text-center p-4 bg-gradient-to-r from-[#FDFBF7] to-[#F5F3EE] rounded-lg">
                                <p className="text-sm text-[#6B6B6B]">
                                    {isDelivered
                                        ? `Delivered on ${formatDate(order.updated_at)}`
                                        : `Order placed on ${formatDate(order.created_at)}`
                                    }
                                </p>
                                <p className="text-xs text-[#BBBBBB] mt-1 flex items-center justify-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Last updated: {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white rounded-2xl shadow-md p-6">
                            <h2 className="text-lg font-serif font-bold text-[#2C2416] mb-4">Order Summary</h2>
                            <div className="space-y-4">
                                {order.items?.map((item) => (
                                    <div key={item.order_item_id} className="flex gap-4">
                                        <div className="w-20 h-20 bg-[#F9F9F9] rounded-lg border border-[#E0E0D8] flex-shrink-0 overflow-hidden">
                                            {item.product_image ? (
                                                <img
                                                    src={item.product_image}
                                                    alt={item.product_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="w-8 h-8 text-[#CCCCCC]" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-sm text-[#2C2416] mb-1 line-clamp-2">
                                                {item.product_name}
                                            </h3>
                                            <p className="text-xs text-[#6B6B6B]">Qty: {item.quantity}</p>
                                            <p className="text-sm font-bold text-[#2C2416] mt-1">
                                                ₹{Number(item.total_price).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 pt-4 border-t border-[#E0E0D8]">
                                <div className="flex justify-between items-center">
                                    <span className="text-base font-bold text-[#2C2416]">Total Amount</span>
                                    <span className="text-xl font-bold text-[#2C2416]">
                                        ₹{Number(order.total_amount).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Right Column ─────────────────────────────────────── */}
                    <div className="space-y-6">

                        {/* Delivery Address — from real order data */}
                        <div className="bg-white rounded-2xl shadow-md p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin className="w-5 h-5 text-[#C9A55C]" />
                                <h2 className="text-base font-bold text-[#2C2416]">Delivery Address</h2>
                            </div>
                            {addr ? (
                                <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-1">
                                    {(addr.first_name || addr.last_name) && (
                                        <p className="font-semibold text-[#2C2416]">
                                            {[addr.first_name, addr.last_name].filter(Boolean).join(' ')}
                                        </p>
                                    )}
                                    {addr.address_line1 && <p>{addr.address_line1}</p>}
                                    {addr.address_line2 && <p>{addr.address_line2}</p>}
                                    {(addr.city || addr.state) && (
                                        <p>{[addr.city, addr.state].filter(Boolean).join(', ')}</p>
                                    )}
                                    {(addr.pincode || addr.country) && (
                                        <p>{[addr.pincode, addr.country].filter(Boolean).join(', ')}</p>
                                    )}
                                    {addr.phone && <p className="mt-2">Phone: {addr.phone}</p>}
                                </div>
                            ) : (
                                <p className="text-sm text-[#999999]">Address not available</p>
                            )}
                        </div>

                        {/* Need Help? */}
                        <div className="bg-gradient-to-br from-[#2C2416] to-[#4A3F2C] rounded-2xl shadow-md p-6 text-white">
                            <h2 className="text-base font-bold mb-3">Need Help?</h2>
                            <p className="text-xs text-white/80 mb-4">
                                Our support team is here to assist you with any questions about your order.
                            </p>
                            <div className="space-y-3">
                                <a
                                    href="tel:+911234567890"
                                    className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
                                >
                                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/70">Call Us</p>
                                        <p className="text-sm font-semibold">+91 123 456 7890</p>
                                    </div>
                                </a>
                                <a
                                    href="mailto:support@aivestire.com"
                                    className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
                                >
                                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/70">Email Us</p>
                                        <p className="text-sm font-semibold">support@aivestire.com</p>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};