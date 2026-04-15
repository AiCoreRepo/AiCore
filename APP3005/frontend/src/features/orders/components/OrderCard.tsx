// ============================================
// ORDER CARD COMPONENT
// Premium animated order card with actions
// ============================================

import React, { useState } from 'react';
import { formatRefundStatus } from '@/features/orders/utils/order.utils';
import type { Order, PaymentMethod, PaymentStatus } from '../types/order.types';
import { StatusBadge } from './StatusBadge';
import { OrderTimeline } from './OrderTimeline';
import { formatOrderDate, getRelativeTime } from '../utils/order.utils';
import {
    ORDER_PAYMENT_METHOD_CONFIG,
    ORDER_PAYMENT_STATUS_CONFIG,
} from '@/constants/payment.constants';

// ── Payment Method Badge ──────────────────────────────────────────────────────
const PaymentMethodBadge: React.FC<{ method: PaymentMethod; status: PaymentStatus }> = ({ method, status }) => {
    const isCOD = method === 'COD';

    // Look up from shared constants (payment.constants.ts)
    const mc = ORDER_PAYMENT_METHOD_CONFIG[method] ?? ORDER_PAYMENT_METHOD_CONFIG.PREPAID;

    const statusKey =
        status === 'COMPLETED' ? (isCOD ? 'PAY_ON_DELIVERY' : 'PAID_ONLINE')
            : status === 'FAILED' ? 'FAILED'
                : status === 'REFUNDED' ? 'REFUNDED'
                    : isCOD ? 'PENDING_COD'
                        : 'PENDING_ONLINE';

    const sc = ORDER_PAYMENT_STATUS_CONFIG[statusKey as keyof typeof ORDER_PAYMENT_STATUS_CONFIG];

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {/* Method pill */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${mc.bg} ${mc.border} ${mc.text}`}>
                <span>{mc.icon}</span>
                {mc.label}
            </span>

            {/* Payment status pill */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.bg} ${sc.border} ${sc.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                {sc.label}
            </span>
        </div>
    );
};

interface OrderCardProps {
    order: Order;
    onCancel: () => void;
    onReturn: () => void;
    onReplace: () => void;
    onTrack: () => void;
    onViewDetails: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
    order,
    onCancel,
    onReturn,
    onReplace,
    onTrack,
    onViewDetails,
}) => {
    const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Get the primary product image (first item)
    const primaryItem = order.items[0];
    const imageUrl = primaryItem?.product_image || '/placeholder-product.png';

    return (
        <div className="order-card bg-white border border-gray-200 rounded-xl hover:shadow-xl hover:border-amber-200 transition-all duration-300">
            <div className="flex flex-col md:flex-row gap-4 p-5 md:p-6">
                {/* LEFT SECTION - Product Image */}
                <div className="flex-shrink-0">
                    <div className="order-card-image w-24 h-24 md:w-32 md:h-32 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                        <img
                            src={imageUrl}
                            alt={primaryItem?.product_name || 'Product'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.src = '/placeholder-product.png';
                            }}
                        />
                    </div>
                    {order.items.length > 1 && (
                        <div className="mt-2 text-xs text-gray-500 text-center font-medium">
                            +{order.items.length - 1} more
                        </div>
                    )}
                </div>

                {/* CENTER SECTION - Order Info */}
                <div className="flex-1 min-w-0">
                    {/* Product Name & Order Number */}
                    <div className="mb-3">
                        <h3 className="font-bold text-gray-900 text-base md:text-lg mb-1.5 line-clamp-2" style={{ letterSpacing: '0.2px' }}>
                            {primaryItem?.product_name}
                        </h3>
                        <p className="text-sm text-gray-500 font-medium mb-2">
                            Order #{order.order_number}
                        </p>
                        {/* Payment Method + Status — like Myntra/Flipkart */}
                        <PaymentMethodBadge
                            method={order.payment_method}
                            status={order.payment_status}
                        />
                    </div>

                    {/* Status Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wide font-medium">Status</p>
                            <StatusBadge status={order.current_status} type="order" size="sm" />
                        </div>

                        <div>
                            <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wide font-medium">Placed On</p>
                            <p className="text-sm font-semibold text-gray-700">
                                {getRelativeTime(order.created_at)}
                            </p>
                        </div>
                    </div>

                    {/* Additional Status Info */}
                    <div className="flex flex-wrap gap-2">
                        {order.return_status && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 text-yellow-700 text-xs font-semibold shadow-sm">
                                🔄 {order.return_status.replace(/_/g, ' ')}
                            </span>
                        )}

                        {order.replace_status && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 text-purple-700 text-xs font-semibold shadow-sm">
                                🔁 {order.replace_status.replace(/_/g, ' ')}
                            </span>
                        )}

                        {order.refund_status && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${order.refund_status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}`}>
                                💰 {formatRefundStatus(order.refund_status)}
                            </span>
                        )}
                    </div>

                    {/* Delivery Partner (if exists) */}
                    {order.delivery_partner && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-3">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                            </svg>
                            <span className="font-semibold">{order.delivery_partner}</span>
                            {order.tracking_number && (
                                <span className="text-gray-400">• {order.tracking_number}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT SECTION - Price & Actions */}
                <div className="flex flex-col md:items-end justify-between border-t md:border-t-0 md:border-l md:border-gray-200 md:pl-6 pt-4 md:pt-0">
                    {/* Total Amount */}
                    <div className="mb-4 md:mb-0">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">Total Amount</p>
                        <p className="text-xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                            ₹{order.total_amount.toLocaleString('en-IN')}

                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2.5 w-full md:w-auto md:min-w-[180px]">
                        {/* Track Order Button */}
                        <button
                            onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
                            className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                            {isTimelineExpanded ? 'Hide Timeline' : 'Track Order'}
                        </button>

                        {/* Three Dot Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="w-full px-5 py-2.5 text-sm font-semibold text-amber-700 border-2 border-amber-500 rounded-lg hover:bg-amber-50 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                More Options
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl z-10 border border-gray-200 animate-scale-in overflow-hidden">
                                    <div className="py-1">
                                        {order.can_cancel && (
                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    onCancel();
                                                }}
                                                className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                Cancel Order
                                            </button>
                                        )}

                                        {order.can_return && (
                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    onReturn();
                                                }}
                                                className="w-full px-4 py-3 text-left text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-3"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                </svg>
                                                Return Order
                                            </button>
                                        )}

                                        {order.can_replace && (
                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    onReplace();
                                                }}
                                                className="w-full px-4 py-3 text-left text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors flex items-center gap-3"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                Replace Item
                                            </button>
                                        )}

                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                onViewDetails();
                                            }}
                                            className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded Timeline */}
            {isTimelineExpanded && (
                <div className="px-5 md:px-6 pb-6 pt-0 border-t border-gray-200 animate-expand">
                    <div className="pt-5">
                        <OrderTimeline currentStatus={order.current_status} />
                    </div>
                </div>
            )}

            {/* Close menu when clicking outside */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}
        </div>
    );
};

export default OrderCard;
