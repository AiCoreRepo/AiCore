import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Order } from '../../features/orders/types/order.types';

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order }) => {
    if (!order) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-white text-[#2C2416] p-0 overflow-hidden border-none shadow-2xl">
                {/* Header */}
                <div className="bg-[#FAFAF8] px-6 py-4 border-b border-[#E0E0D8]">
                    <DialogTitle className="text-xl font-bold font-serif text-[#2C2416]">
                        Order Details
                    </DialogTitle>
                    <p className="text-sm text-[#6B6B6B] mt-1">
                        #{order.order_number}
                    </p>
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    {/* Status Section */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-full ${order.current_status === 'DELIVERED' ? 'bg-green-100 text-green-600' :
                                    order.current_status === 'CANCELLED' ? 'bg-red-100 text-red-600' :
                                        'bg-yellow-100 text-yellow-600'
                                }`}>
                                {order.current_status === 'DELIVERED' && <CheckCircle className="w-5 h-5" />}
                                {order.current_status === 'CANCELLED' && <AlertCircle className="w-5 h-5" />}
                                {['PENDING', 'SHIPPED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'ORDER_PLACED', 'BOOKED'].includes(order.current_status) && <Clock className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">
                                    {order.current_status.replace(/_/g, ' ')}
                                </h3>
                                <p className="text-sm text-[#6B6B6B]">
                                    {formatDate(order.created_at)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="mb-8">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-[#999999] mb-4">
                            Items in this order
                        </h4>
                        <div className="space-y-4">
                            {order.items.map((item) => (
                                <div key={item.order_item_id} className="flex gap-4 p-4 bg-[#FAFAF8] rounded-lg border border-[#E0E0D8]">
                                    <div className="w-20 h-20 bg-white rounded-md overflow-hidden border border-[#E0E0D8] flex-shrink-0">
                                        {item.product_image ? (
                                            <img
                                                src={item.product_image}
                                                alt={item.product_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[#CCCCCC]">
                                                <Package className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="font-semibold text-[#2C2416] mb-1">
                                            {item.product_name}
                                        </h5>
                                        <p className="text-sm text-[#6B6B6B] mb-2">
                                            Qty: {item.quantity} × ₹{item.unit_price.toLocaleString('en-IN')}
                                        </p>
                                        <p className="text-sm font-medium text-[#C9A55C]">
                                            Total: ₹{item.total_price.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="grid grid-cols-2 gap-6 pt-6 border-t border-[#E0E0D8]">
                        <div>
                            <h4 className="text-sm font-bold uppercase tracking-wider text-[#999999] mb-2">
                                Payment Method
                            </h4>
                            <p className="font-medium text-[#2C2416]">
                                {order.payment_method}
                            </p>
                            <p className={`text-sm ${order.payment_status === 'COMPLETED' ? 'text-green-600' : 'text-orange-600'}`}>
                                {order.payment_status}
                            </p>
                        </div>
                        <div className="text-right">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-[#999999] mb-2">
                                Total Amount
                            </h4>
                            <p className="text-2xl font-bold text-[#C9A55C] font-serif">
                                ₹{order.total_amount.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
