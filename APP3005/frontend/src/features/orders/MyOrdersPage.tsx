import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronRight, ChevronLeft, Package } from 'lucide-react';
import { UserDashboardLayout } from '@/components/layout/UserDashboardLayout';
import { ordersApi } from './api/orders.api';
import { Order } from './types/order.types';
import { OrderDetailsModal } from '@/components/orders/OrderDetailsModal';
import { OrderCancellationModal } from '@/components/orders/OrderCancellationModal';
import { toast } from 'sonner';

type FilterType = 'all' | 'processing' | 'shipped' | 'delivered';

const ITEMS_PER_PAGE = 3;

export const MyOrdersPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [currentPage, setCurrentPage] = useState(1);

    // Check if user came from cart - hide sidebar if true
    const fromCart = searchParams.get('from') === 'cart';
    const hideSidebar = fromCart;

    // Modal State
    const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
    const [cancelOrder, setCancelOrder] = useState<Order | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);

    const filters: { id: FilterType; label: string }[] = [
        { id: 'all', label: 'All Orders' },
        { id: 'processing', label: 'Processing' },
        { id: 'shipped', label: 'Shipped' },
        { id: 'delivered', label: 'Delivered' },
    ];

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        filterOrders();
        setCurrentPage(1);
    }, [searchQuery, activeFilter, orders]);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const data = await ordersApi.getMyOrders();
            setOrders(data);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterOrders = () => {
        let filtered = orders;

        if (activeFilter !== 'all') {
            filtered = filtered.filter(order => {
                const status = order.current_status.toUpperCase();
                if (activeFilter === 'processing') {
                    return ['ORDER_PLACED', 'PENDING', 'BOOKED', 'DISPATCHED'].includes(status);
                }
                if (activeFilter === 'shipped') return status === 'SHIPPED';
                if (activeFilter === 'delivered') return status === 'DELIVERED';
                return false;
            });
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(order =>
                order.order_number.toLowerCase().includes(query) ||
                order.items.some(item => item.product_name.toLowerCase().includes(query))
            );
        }

        setFilteredOrders(filtered);
    };

    const getStatusDisplay = (status: string) => {
        const normalizedStatus = status?.toUpperCase() || '';

        switch (normalizedStatus) {
            case 'DELIVERED':
                return { label: 'Delivered', className: 'bg-[#408EC6] text-white border-none' }; // Blue
            case 'SHIPPED':
                return { label: 'Shipped', className: 'bg-[#74B886] text-white border-none' }; // Green
            case 'CANCELLED':
                return { label: 'Cancelled', className: 'bg-red-100 text-red-600 border border-red-200' };
            case 'ORDER_PLACED':
            case 'PENDING':
            case 'BOOKED':
            case 'DISPATCHED':
                return { label: 'Processing', className: 'bg-[#E3D5B9] text-[#8C7A5B] border-none' }; // Beige/Gold-ish
            default:
                // Handle UNKNOWN or other statuses gracefully
                return {
                    label: normalizedStatus.replace(/_/g, ' ') || 'Processing',
                    className: 'bg-gray-100 text-gray-600'
                };
        }
    };

    const handleFilterChange = (filterId: FilterType) => {
        setActiveFilter(filterId);
        setCurrentPage(1); // Reset to first page when filter changes
    };

    const goToPage = (page: number) => {
        const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const handleCancelOrder = async (data: { reason: string; customReason?: string; feedback?: string }) => {
        if (!cancelOrder) return;

        setIsCancelling(true);
        try {
            await ordersApi.cancelOrder(cancelOrder.order_id, data);

            // Refresh orders
            await fetchOrders();

            // Close modal
            setCancelOrder(null);

            // Show success message
            toast.success('Order cancelled successfully');
        } catch (error: any) {
            console.error('Failed to cancel order:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel order. Please try again.');
        } finally {
            setIsCancelling(false);
        }
    };

    // Pagination Calculation
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredOrders.length);
    const currentOrders = filteredOrders.slice(startIndex, endIndex);

    return (
        <UserDashboardLayout hideSidebar={hideSidebar}>
            <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#FAF8F3] to-[#F5F3EE]">
                {/* Header Section */}
                <div className="bg-white border-b border-[#E0E0D8] sticky top-0 z-10 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Back Button Row (if needed) */}
                        {hideSidebar && (
                            <div className="py-1.5 border-b border-[#F0F0F0]">
                                <button
                                    onClick={() => navigate('/')}
                                    className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-[#6B6B6B] hover:text-[#2C2416] hover:bg-[#F5F3EE] rounded-lg transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span>Back to Home</span>
                                </button>
                            </div>
                        )}

                        {/* Title Row */}
                        <div className="py-3 flex items-center justify-between gap-4">
                            <div className="flex-1">
                                <h1 className="text-2xl sm:text-2xl font-serif font-bold text-[#2C2416] leading-tight">
                                    My Orders
                                </h1>
                                <p className="text-xs text-[#6B6B6B] mt-0.5">
                                    Track and manage your orders
                                </p>
                            </div>
                            {/* Back to Home Button - Always visible */}
                            <button
                                onClick={() => navigate('/')}
                                className="px-4 py-2 bg-[#C9A55C] text-white text-sm font-medium rounded-lg hover:bg-[#b08d4b] transition-colors whitespace-nowrap shadow-sm"
                            >
                                Back to Home
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
                    {/* Filters and Search */}
                    <div className="bg-white rounded-xl shadow-sm border border-[#E0E0D8] p-5 sm:p-6 mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                            {/* Tabs */}
                            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                                {filters.map((filter) => {
                                    const isActive = activeFilter === filter.id;
                                    return (
                                        <button
                                            key={filter.id}
                                            onClick={() => handleFilterChange(filter.id)}
                                            className={`px-5 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${isActive
                                                ? 'bg-[#C9A55C] text-white shadow-md'
                                                : 'bg-[#F5F3EE] text-[#6B6B6B] hover:bg-[#EAE8E4]'
                                                }`}
                                        >
                                            {filter.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Search */}
                            <div className="relative w-full lg:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
                                <input
                                    type="text"
                                    placeholder="Search by order number or product"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 border border-[#E0E0D8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A55C] focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Orders List */}
                    {isLoading ? (
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#C9A55C] border-t-transparent mx-auto"></div>
                            <p className="text-sm text-[#6B6B6B] mt-4">Loading your orders...</p>
                        </div>
                    ) : currentOrders.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-[#E0E0D8] p-12 text-center">
                            <div className="w-20 h-20 bg-[#F5F3EE] rounded-full flex items-center justify-center mx-auto mb-4">
                                <Package className="w-10 h-10 text-[#C9A55C]" />
                            </div>
                            <h3 className="text-lg font-semibold text-[#2C2416] mb-2">No Orders Found</h3>
                            <p className="text-sm text-[#6B6B6B] mb-6">
                                {searchQuery ? 'Try adjusting your search' : 'You haven\'t placed any orders yet'}
                            </p>
                            <button
                                onClick={() => navigate('/')}
                                className="px-6 py-2.5 bg-[#C9A55C] text-white text-sm font-medium rounded-lg hover:bg-[#b08d4b] transition-colors"
                            >
                                Start Shopping
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {currentOrders.map((order) => {
                                const statusDisplay = getStatusDisplay(order.current_status);
                                const firstItem = order.items?.[0];

                                return (
                                    <div
                                        key={order.order_id}
                                        className="bg-white rounded-xl shadow-sm border border-[#E0E0D8] overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                        {/* Order Header */}
                                        <div className="bg-gradient-to-r from-[#FDFBF7] to-[#F5F3EE] px-4 sm:px-6 py-3 border-b border-[#E0E0D8]">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div className="flex items-center gap-3">
                                                    <p className="text-xs sm:text-sm font-bold text-[#2C2416]">
                                                        {order.order_number}
                                                    </p>
                                                    <span className="text-xs text-[#999999]">
                                                        {new Date(order.created_at).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusDisplay.className}`}>
                                                    {statusDisplay.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Order Content */}
                                        <div className="p-4 sm:p-6">
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                {/* Product Image */}
                                                <div className="w-20 h-28 sm:w-24 sm:h-32 bg-[#F9F9F9] rounded-lg border border-[#E0E0D8] flex-shrink-0 overflow-hidden">
                                                    {firstItem?.product_image ? (
                                                        <img
                                                            src={firstItem.product_image}
                                                            alt={firstItem.product_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Package className="w-8 h-8 text-[#CCCCCC]" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Product Details */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-sm sm:text-base text-[#2C2416] mb-1 line-clamp-2">
                                                        {firstItem?.product_name || 'Product'}
                                                    </h4>
                                                    <p className="text-xs text-[#6B6B6B] mb-2">
                                                        Quantity: {firstItem?.quantity || 1}
                                                        {order.items.length > 1 && ` + ${order.items.length - 1} more item(s)`}
                                                    </p>
                                                    <p className="text-base sm:text-lg font-bold text-[#2C2416] mb-3">
                                                        ₹{Number(order.total_amount).toLocaleString('en-IN')}
                                                    </p>

                                                    {/* Action Buttons */}
                                                    <div className="flex flex-wrap gap-2">
                                                        {!['DELIVERED', 'CANCELLED'].includes(order.current_status) && (
                                                            <button
                                                                onClick={() => navigate(`/track-order/${order.order_id}${fromCart ? '?from=cart' : ''}`)}
                                                                className="px-4 py-2 border border-[#C9A55C] text-[#C9A55C] text-xs font-medium rounded-lg hover:bg-[#C9A55C] hover:text-white transition-colors"
                                                            >
                                                                Track Order
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setDetailsOrder(order)}
                                                            className="px-4 py-2 bg-[#C9A55C] text-white text-xs font-medium rounded-lg hover:bg-[#b08d4b] transition-colors"
                                                        >
                                                            View Details
                                                        </button>
                                                        {['PENDING', 'BOOKED'].includes(order.current_status) && (
                                                            <button
                                                                onClick={() => setCancelOrder(order)}
                                                                className="px-4 py-2 border border-red-300 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {filteredOrders.length > 0 && (
                        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-[#6B6B6B]">
                            <p>
                                Showing {startIndex + 1}-{endIndex} of {filteredOrders.length} orders
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 border border-[#E0E0D8] rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {totalPages > 0 && Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    let page;
                                    if (totalPages <= 5) {
                                        page = i + 1;
                                    } else if (currentPage <= 3) {
                                        page = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        page = totalPages - 4 + i;
                                    } else {
                                        page = currentPage - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => goToPage(page)}
                                            className={`px-3 py-2 border rounded-lg text-xs sm:text-sm font-medium transition-all ${currentPage === page
                                                ? 'bg-[#C9A55C] text-white border-[#C9A55C] shadow-md'
                                                : 'border-[#E0E0D8] hover:bg-white'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 border border-[#E0E0D8] rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Order Details Modal */}
            <OrderDetailsModal
                isOpen={!!detailsOrder}
                onClose={() => setDetailsOrder(null)}
                order={detailsOrder}
            />

            {/* Order Cancellation Modal */}
            <OrderCancellationModal
                isOpen={!!cancelOrder}
                onClose={() => setCancelOrder(null)}
                onConfirm={handleCancelOrder}
                orderNumber={cancelOrder?.order_number || ''}
                isLoading={isCancelling}
            />
        </UserDashboardLayout>
    );
};
