import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Truck, CheckCircle, Package, MapPin, Phone, Mail, Home } from 'lucide-react';
import { ordersApi } from './api/orders.api';
import { Order } from './types/order.types';

export const OrderTrackingPage = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    // Check if user came from cart
    const fromCart = searchParams.get('from') === 'cart';

    useEffect(() => {
        if (orderId) {
            fetchOrder(orderId);
        }
    }, [orderId]);

    const fetchOrder = async (id: string) => {
        try {
            const data = await ordersApi.getOrder(id);
            setOrder(data);
        } catch (error) {
            console.error('Failed to fetch order:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#FAF8F3] to-[#F5F3EE] flex items-center justify-center">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#C9A55C] border-t-transparent"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Truck className="w-6 h-6 text-[#C9A55C]" />
                    </div>
                </div>
            </div>
        );
    };

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

    const steps = [
        { status: 'PENDING', label: 'Order Placed', icon: CheckCircle },
        { status: 'BOOKED', label: 'Confirmed', icon: CheckCircle },
        { status: 'DISPATCHED', label: 'Processing', icon: Package },
        { status: 'SHIPPED', label: 'Shipped', icon: Truck },
        { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: MapPin },
        { status: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
    ];

    const getCurrentStepIndex = () => {
        const status = order.current_status;
        if (status === 'DELIVERED') return 5;
        if (status === 'OUT_FOR_DELIVERY') return 4;
        if (status === 'SHIPPED') return 3;
        if (status === 'DISPATCHED') return 2;
        if (status === 'BOOKED') return 1;
        if (status === 'PENDING') return 0;
        return 0;
    };

    const currentStepIndex = getCurrentStepIndex();
    const isDelivered = order.current_status === 'DELIVERED';
    const isCancelled = order.current_status === 'CANCELLED';

    const getStatusMessage = () => {
        if (isCancelled) {
            return {
                title: 'Order Cancelled',
                subtitle: 'This order has been cancelled',
                color: 'text-red-600'
            };
        }

        switch (order.current_status) {
            case 'DELIVERED':
                return {
                    title: 'Delivered Successfully',
                    subtitle: 'Your order has been delivered',
                    color: 'text-green-600'
                };
            case 'OUT_FOR_DELIVERY':
                return {
                    title: 'Out for Delivery',
                    subtitle: 'Your delivery partner is on the way',
                    color: 'text-[#C9A55C]'
                };
            case 'SHIPPED':
                return {
                    title: 'On the Way',
                    subtitle: 'Your order is being shipped to you',
                    color: 'text-blue-600'
                };
            case 'DISPATCHED':
                return {
                    title: 'Processing',
                    subtitle: 'Your order is being prepared for shipment',
                    color: 'text-blue-600'
                };
            case 'BOOKED':
                return {
                    title: 'Order Confirmed',
                    subtitle: 'We have confirmed your order',
                    color: 'text-green-600'
                };
            case 'PENDING':
            default:
                return {
                    title: 'Order Placed',
                    subtitle: 'We have received your order',
                    color: 'text-[#C9A55C]'
                };
        }
    };

    const statusMessage = getStatusMessage();

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#FAF8F3] to-[#F5F3EE]">
            {/* Header */}
            <div className="bg-white border-b border-[#E0E0D8] sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate(`/my-orders${fromCart ? '?from=cart' : ''}`)}
                            className="flex items-center gap-2 text-sm font-medium text-[#6B6B6B] hover:text-[#2C2416] transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Orders</span>
                        </button>
                        <div className="text-right">
                            <p className="text-xs text-[#6B6B6B]">Order Number</p>
                            <p className="text-sm font-bold text-[#2C2416]">{order.order_number}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Tracking */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Card */}
                        <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
                            <div className="text-center mb-8">
                                <h1 className={`text-2xl sm:text-3xl font-serif font-bold mb-2 ${statusMessage.color}`}>
                                    {statusMessage.title}
                                </h1>
                                <p className="text-sm text-[#6B6B6B]">{statusMessage.subtitle}</p>
                                {!isDelivered && !isCancelled && (
                                    <p className="text-xs text-[#999999] mt-2">
                                        Estimated Delivery: 3-5 Days
                                    </p>
                                )}
                                {isCancelled && order.cancellation_reason && (
                                    <div className="mt-4 p-3 bg-red-50 rounded-lg">
                                        <p className="text-xs text-red-800">
                                            <span className="font-semibold">Reason:</span> {order.cancellation_reason}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Progress Tracker - Only show if not cancelled */}
                            {!isCancelled && (
                                <div className="mb-8">
                                    <div className="relative">
                                        {/* Progress Line */}
                                        <div className="absolute left-0 right-0 top-6 h-1 bg-[#E0E0D8]">
                                            <div
                                                className="h-full bg-[#74B886] transition-all duration-500"
                                                style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                                            ></div>
                                        </div>

                                        {/* Steps */}
                                        <div className="relative flex justify-between">
                                            {steps.map((step, index) => {
                                                const isCompleted = index <= currentStepIndex;
                                                const StepIcon = step.icon;

                                                return (
                                                    <div key={index} className="flex flex-col items-center flex-1">
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-500 ${isCompleted
                                                            ? 'bg-[#74B886] shadow-lg'
                                                            : 'bg-white border-2 border-[#E0E0D8]'
                                                            }`}>
                                                            <StepIcon className={`w-6 h-6 ${isCompleted ? 'text-white' : 'text-[#999999]'}`} />
                                                        </div>
                                                        <p className={`text-xs sm:text-sm font-medium text-center ${isCompleted ? 'text-[#2C2416]' : 'text-[#999999]'
                                                            }`}>
                                                            {step.label}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Timeline Message */}
                            <div className="text-center p-4 bg-gradient-to-r from-[#FDFBF7] to-[#F5F3EE] rounded-lg">
                                <p className="text-sm text-[#6B6B6B]">
                                    {isDelivered
                                        ? `Delivered on ${new Date(order.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                                        : `Order placed on ${new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white rounded-2xl shadow-md p-6">
                            <h2 className="text-lg font-serif font-bold text-[#2C2416] mb-4">Order Summary</h2>
                            <div className="space-y-4">
                                {order.items.map((item) => (
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

                    {/* Right Column - Details & Support */}
                    <div className="space-y-6">
                        {/* Delivery Address */}
                        <div className="bg-white rounded-2xl shadow-md p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin className="w-5 h-5 text-[#C9A55C]" />
                                <h2 className="text-base font-bold text-[#2C2416]">Delivery Address</h2>
                            </div>
                            <div className="text-sm text-[#6B6B6B] leading-relaxed">
                                <p className="font-medium text-[#2C2416] mb-2">John Doe</p>
                                <p>123 Fashion Street</p>
                                <p>Mumbai, Maharashtra</p>
                                <p>400001, India</p>
                                <p className="mt-2">Phone: +91 98765 43210</p>
                            </div>
                        </div>

                        {/* Need Help? */}
                        <div className="bg-gradient-to-br from-[#2C2416] to-[#4A3F2C] rounded-2xl shadow-md p-6 text-white">
                            <h2 className="text-base font-bold mb-3">Need Help?</h2>
                            <p className="text-xs text-white/90 mb-4">
                                Our support team is here to assist you with any questions about your order.
                            </p>
                            <div className="space-y-3">
                                <a
                                    href="tel:+911234567890"
                                    className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
                                >
                                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-white/70">Call Us</p>
                                        <p className="text-sm font-semibold">+91 123 456 7890</p>
                                    </div>
                                </a>
                                <a
                                    href="mailto:support@aivestire.com"
                                    className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
                                >
                                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
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