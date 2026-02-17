import React, { useState, useEffect } from 'react';
import {
    ShoppingBag, Search, Calendar, CreditCard, Package,
    Truck, CheckCircle2, XCircle, Clock, MapPin,
    ChevronRight, Store, User, Phone, Edit3, Save, X as XIcon,
    PackageCheck, PackageX, Loader2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors, typography } from '@/constants/theme';
import { Sidebar } from '@/components/admin/Sidebar';

interface OrderItem {
    order_item_id: string;
    product_id: string;
    product_name: string;
    product_image?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface ShippingAddress {
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
}

interface Order {
    order_id: string;
    order_number: string;
    user_id: string;
    total_amount: number;
    current_status: string;
    payment_method: string;
    payment_status: string;
    created_at: string;
    items: OrderItem[];
    shipping_address?: ShippingAddress;
    tracking_number?: string;
    delivery_partner?: string;
}

type FilterType = 'all' | 'PENDING' | 'BOOKED' | 'DISPATCHED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

const AdminOrdersPage = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [editingOrder, setEditingOrder] = useState<string | null>(null);
    const [newStatus, setNewStatus] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [deliveryPartner, setDeliveryPartner] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const filters = [
        { id: 'all' as FilterType, label: 'All Orders', icon: ShoppingBag },
        { id: 'PENDING' as FilterType, label: 'Pending', icon: Clock },
        { id: 'BOOKED' as FilterType, label: 'Booked', icon: CheckCircle2 },
        { id: 'DISPATCHED' as FilterType, label: 'Dispatched', icon: Package },
        { id: 'SHIPPED' as FilterType, label: 'Shipped', icon: Truck },
        { id: 'DELIVERED' as FilterType, label: 'Delivered', icon: PackageCheck },
        { id: 'CANCELLED' as FilterType, label: 'Cancelled', icon: XCircle },
    ];

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        filterOrders();
    }, [searchQuery, activeFilter, orders]);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/orders/all`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setOrders(data);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterOrders = () => {
        let filtered = orders;

        if (activeFilter !== 'all') {
            filtered = filtered.filter(order => order.current_status === activeFilter);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(order =>
                order.order_number.toLowerCase().includes(query) ||
                order.user_id.toLowerCase().includes(query)
            );
        }

        setFilteredOrders(filtered);
    };

    const getOrderCountByFilter = (filter: FilterType) => {
        if (filter === 'all') return orders.length;
        return orders.filter(order => order.current_status === filter).length;
    };

    const startEditingOrder = (order: Order) => {
        setEditingOrder(order.order_id);
        setNewStatus(order.current_status);
        setTrackingNumber(order.tracking_number || '');
        setDeliveryPartner(order.delivery_partner || '');
    };

    const cancelEditing = () => {
        setEditingOrder(null);
        setNewStatus('');
        setTrackingNumber('');
        setDeliveryPartner('');
    };

    const updateOrderStatus = async (orderId: string) => {
        setIsUpdating(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/orders/${orderId}/status`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        status: newStatus,
                        trackingNumber: trackingNumber || undefined,
                        deliveryPartner: deliveryPartner || undefined,
                        notes: `Status updated by admin to ${newStatus}`,
                    }),
                }
            );

            if (response.ok) {
                await fetchOrders();
                cancelEditing();
            } else {
                const errorData = await response.json();
                alert(`Failed to update order: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to update order:', error);
            alert('Failed to update order status');
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { color: string; bg: string; icon: any; label: string }> = {
            'PENDING': {
                color: '#F59E0B',
                bg: 'bg-orange-500/10',
                icon: Clock,
                label: 'Pending Approval'
            },
            'BOOKED': {
                color: '#3B82F6',
                bg: 'bg-blue-500/10',
                icon: CheckCircle2,
                label: 'Order Confirmed'
            },
            'DISPATCHED': {
                color: '#8B5CF6',
                bg: 'bg-purple-500/10',
                icon: Package,
                label: 'Dispatched'
            },
            'SHIPPED': {
                color: '#6366F1',
                bg: 'bg-indigo-500/10',
                icon: Truck,
                label: 'In Transit'
            },
            'OUT_FOR_DELIVERY': {
                color: '#EC4899',
                bg: 'bg-pink-500/10',
                icon: Truck,
                label: 'Out for Delivery'
            },
            'DELIVERED': {
                color: '#10B981',
                bg: 'bg-green-500/10',
                icon: PackageCheck,
                label: 'Delivered'
            },
            'CANCELLED': {
                color: '#EF4444',
                bg: 'bg-red-500/10',
                icon: XCircle,
                label: 'Cancelled'
            },
        };
        return configs[status] || configs['PENDING'];
    };

    const statusOptions = [
        { value: 'PENDING', label: 'Pending', icon: Clock },
        { value: 'BOOKED', label: 'Booked', icon: CheckCircle2 },
        { value: 'DISPATCHED', label: 'Dispatched', icon: Package },
        { value: 'SHIPPED', label: 'Shipped', icon: Truck },
        { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
        { value: 'DELIVERED', label: 'Delivered', icon: PackageCheck },
        { value: 'CANCELLED', label: 'Cancelled', icon: XCircle },
    ];

    return (
        <div className="flex min-h-screen bg-neutral-950">
            <Sidebar />

            <div className="flex-1 ml-[280px]" style={{ fontFamily: typography.fontSans }}>
                {/* Header */}
                <div className="bg-neutral-900/80 border-b border-neutral-800 sticky top-0 z-20 backdrop-blur-xl">
                    <div className="px-8 py-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: typography.fontSerif }}>
                                    Order Management
                                </h1>
                                <p className="text-neutral-400 text-sm">
                                    Manage and track all customer orders
                                </p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-3xl font-bold" style={{ color: colors.gold }}>
                                        {filteredOrders.length}
                                    </p>
                                    <p className="text-xs text-neutral-500 uppercase tracking-wider">Total</p>
                                </div>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                            <input
                                type="text"
                                placeholder="Search orders by number, user ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37] transition-all"
                            />
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="px-8 pb-4 overflow-x-auto no-scrollbar">
                        <div className="flex gap-2 min-w-max">
                            {filters.map((filter) => {
                                const count = getOrderCountByFilter(filter.id);
                                const isActive = activeFilter === filter.id;
                                const Icon = filter.icon;

                                return (
                                    <button
                                        key={filter.id}
                                        onClick={() => setActiveFilter(filter.id)}
                                        className={`
                                            relative px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-300
                                            flex items-center gap-2 whitespace-nowrap
                                            ${isActive
                                                ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20'
                                                : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300'
                                            }
                                        `}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{filter.label}</span>
                                        <span className={`
                                            ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                                            ${isActive ? 'bg-black/20 text-black' : 'bg-neutral-700 text-neutral-400'}
                                        `}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Orders List */}
                <div className="p-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: colors.gold }} />
                            <p className="text-neutral-400">Loading orders...</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <div className="w-24 h-24 rounded-full bg-neutral-800/50 flex items-center justify-center mb-6">
                                <ShoppingBag className="w-12 h-12 text-neutral-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-neutral-300 mb-2">No orders found</h3>
                            <p className="text-neutral-500 text-sm">
                                {searchQuery ? 'Try adjusting your search' : 'Orders will appear here once customers place them'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredOrders.map((order, index) => {
                                const statusConfig = getStatusConfig(order.current_status);
                                const StatusIcon = statusConfig.icon;
                                const isEditing = editingOrder === order.order_id;

                                return (
                                    <motion.div
                                        key={order.order_id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-700 transition-all duration-300"
                                    >
                                        <div className="p-6">
                                            {/* Order Header */}
                                            <div className="flex items-start justify-between mb-6">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <h3 className="text-lg font-bold text-white">
                                                            {order.order_number}
                                                        </h3>
                                                        <div
                                                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bg}`}
                                                            style={{ color: statusConfig.color }}
                                                        >
                                                            <StatusIcon className="w-3.5 h-3.5" />
                                                            <span className="text-xs font-semibold">
                                                                {statusConfig.label}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-4 gap-6">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Calendar className="w-4 h-4 text-neutral-500" />
                                                            <div>
                                                                <p className="text-neutral-500 text-xs mb-0.5">Placed On</p>
                                                                <p className="text-neutral-300 font-medium">
                                                                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        year: 'numeric'
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 text-sm">
                                                            <CreditCard className="w-4 h-4 text-neutral-500" />
                                                            <div>
                                                                <p className="text-neutral-500 text-xs mb-0.5">Payment</p>
                                                                <p className="text-neutral-300 font-medium">
                                                                    {order.payment_method}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Package className="w-4 h-4 text-neutral-500" />
                                                            <div>
                                                                <p className="text-neutral-500 text-xs mb-0.5">Items</p>
                                                                <p className="text-neutral-300 font-medium">
                                                                    {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 text-sm">
                                                            <ShoppingBag className="w-4 h-4 text-neutral-500" />
                                                            <div>
                                                                <p className="text-neutral-500 text-xs mb-0.5">Total</p>
                                                                <p className="text-xl font-bold" style={{ color: colors.gold }}>
                                                                    ₹{order.total_amount.toLocaleString('en-IN')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {!isEditing && (
                                                    <button
                                                        onClick={() => startEditingOrder(order)}
                                                        className="ml-4 px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all flex items-center gap-2 text-sm font-semibold"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                        Update Status
                                                    </button>
                                                )}
                                            </div>

                                            {/* Tracking Info */}
                                            {(order.tracking_number || order.delivery_partner) && !isEditing && (
                                                <div className="flex items-center gap-4 px-4 py-3 bg-neutral-800/30 rounded-xl border border-neutral-800">
                                                    <Truck className="w-5 h-5 text-[#D4AF37]" />
                                                    <div className="flex-1">
                                                        {order.tracking_number && (
                                                            <p className="text-sm text-neutral-300">
                                                                <span className="text-neutral-500">Tracking:</span> <span className="font-semibold">{order.tracking_number}</span>
                                                            </p>
                                                        )}
                                                        {order.delivery_partner && (
                                                            <p className="text-xs text-neutral-500">
                                                                {order.delivery_partner}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Edit Panel */}
                                            <AnimatePresence>
                                                {isEditing && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="mt-6 pt-6 border-t border-neutral-800"
                                                    >
                                                        <div className="bg-neutral-800/30 rounded-xl p-6 border border-neutral-800">
                                                            <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                                                <Edit3 className="w-4 h-4" style={{ color: colors.gold }} />
                                                                Update Order Status
                                                            </h4>

                                                            <div className="grid grid-cols-3 gap-4 mb-6">
                                                                <div>
                                                                    <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
                                                                        Order Status
                                                                    </label>
                                                                    <div className="relative">
                                                                        <select
                                                                            value={newStatus}
                                                                            onChange={(e) => setNewStatus(e.target.value)}
                                                                            className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-[#D4AF37] transition-all appearance-none cursor-pointer"
                                                                        >
                                                                            {statusOptions.map(opt => (
                                                                                <option key={opt.value} value={opt.value}>
                                                                                    {opt.label}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                        <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 w-5 h-5 text-neutral-500 pointer-events-none" />
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
                                                                        Tracking Number
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={trackingNumber}
                                                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                                                        placeholder="e.g., TRK123456789"
                                                                        className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] transition-all"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
                                                                        Delivery Partner
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={deliveryPartner}
                                                                        onChange={(e) => setDeliveryPartner(e.target.value)}
                                                                        placeholder="e.g., FedEx, DHL"
                                                                        className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] transition-all"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-3">
                                                                <button
                                                                    onClick={() => updateOrderStatus(order.order_id)}
                                                                    disabled={isUpdating}
                                                                    className="px-6 py-3 bg-[#D4AF37] text-black rounded-xl font-bold hover:bg-[#C5A028] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#D4AF37]/20"
                                                                >
                                                                    {isUpdating ? (
                                                                        <>
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                            Updating...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Save className="w-4 h-4" />
                                                                            Save Changes
                                                                        </>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={cancelEditing}
                                                                    disabled={isUpdating}
                                                                    className="px-6 py-3 bg-neutral-800 text-neutral-300 rounded-xl font-semibold hover:bg-neutral-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    <XIcon className="w-4 h-4" />
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminOrdersPage;
