import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, CheckCircle, Truck, Package, ShoppingBag, Clock } from 'lucide-react';
import { Order, OrderStatus } from '../../features/orders/types/order.types';

interface OrderTrackingModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
}

const TRACKING_STEPS = [
    { status: 'ORDER_PLACED', label: 'Order Placed', icon: ShoppingBag },
    { status: 'processed', label: 'Processing', icon: Clock }, // Covers BOOKED, DISPATCHED
    { status: 'SHIPPED', label: 'Shipped', icon: Truck },
    { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
    { status: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
];

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ isOpen, onClose, order }) => {
    if (!order) return null;

    const getCurrentStepIndex = (status: OrderStatus) => {
        switch (status) {
            case 'ORDER_PLACED': return 0;
            case 'BOOKED':
            case 'DISPATCHED': return 1;
            case 'SHIPPED': return 2;
            case 'OUT_FOR_DELIVERY': return 3;
            case 'DELIVERED': return 4;
            case 'CANCELLED': return -1;
            default: return 0;
        }
    };

    const currentStep = getCurrentStepIndex(order.current_status);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-white text-[#2C2416] p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-[#FAFAF8] px-6 py-4 border-b border-[#E0E0D8] flex items-center justify-between">
                    <div>
                        <DialogTitle className="text-xl font-bold font-serif text-[#2C2416]">
                            Track Order
                        </DialogTitle>
                        <p className="text-sm text-[#6B6B6B] mt-1">
                            #{order.order_number}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[#E0E0D8] rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-[#6B6B6B]" />
                    </button>
                </div>

                <div className="p-8">
                    {order.current_status === 'CANCELLED' ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <X className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-red-600 mb-2">Order Cancelled</h3>
                            <p className="text-[#6B6B6B]">
                                This order was cancelled on {new Date(order.updated_at).toLocaleDateString()}.
                            </p>
                        </div>
                    ) : (
                        <div className="relative pl-8 border-l-2 border-[#E0E0D8] space-y-8">
                            {TRACKING_STEPS.map((step, index) => {
                                const isCompleted = index <= currentStep;
                                const isCurrent = index === currentStep;
                                const Icon = step.icon;

                                return (
                                    <div key={step.label} className="relative">
                                        <div className={`absolute -left-[41px] top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500
                                            ${isCompleted
                                                ? 'bg-[#C9A55C] border-[#C9A55C] text-white shadow-md scale-110'
                                                : 'bg-white border-[#E0E0D8] text-[#E0E0D8]'
                                            }
                                        `}>
                                            {isCompleted ? <CheckCircle className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full bg-[#E0E0D8]" />}
                                        </div>

                                        <div className={`transition-opacity duration-500 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                                            <h4 className={`font-semibold ${isCurrent ? 'text-[#C9A55C]' : 'text-[#2C2416]'}`}>
                                                {step.label}
                                            </h4>
                                            {isCurrent && (
                                                <p className="text-xs text-[#6B6B6B] mt-1">
                                                    Current Status
                                                </p>
                                            )}
                                            {index === 0 && (
                                                <p className="text-xs text-[#999999] mt-1">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {order.tracking_number && (
                        <div className="mt-8 pt-6 border-t border-[#E0E0D8]">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-[#999999] mb-2">
                                Tracking Number
                            </h4>
                            <div className="flex items-center justify-between bg-[#FAFAF8] p-3 rounded-lg border border-[#E0E0D8]">
                                <span className="font-mono text-[#2C2416] font-medium tracking-wide">
                                    {order.tracking_number}
                                </span>
                                <button
                                    onClick={() => navigator.clipboard.writeText(order.tracking_number || '')}
                                    className="text-xs text-[#C9A55C] hover:text-[#B8944F] font-semibold"
                                >
                                    COPY
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
