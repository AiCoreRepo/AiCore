import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronRight, ChevronLeft, Package } from 'lucide-react';
import { UserDashboardLayout } from '@/components/layout/UserDashboardLayout';
import { ordersApi } from './api/orders.api';
import { Order } from './types/order.types';
import { OrderCancellationModal } from '@/components/orders/OrderCancellationModal';
import { toast } from 'sonner';

type FilterType = 'all' | 'processing' | 'shipped' | 'delivered' | 'returned' | 'replaced';

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

    // Modal State — only cancel remains as modal; details/return/replace are full pages
    const [cancelOrder, setCancelOrder] = useState<Order | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    // Info popup for already-requested actions
    const [infoPopup, setInfoPopup] = useState<{ title: string; message: string } | null>(null);

    const filters: { id: FilterType; label: string }[] = [
        { id: 'all', label: 'All Orders' },
        { id: 'processing', label: 'Processing' },
        { id: 'shipped', label: 'Shipped' },
        { id: 'delivered', label: 'Delivered' },
        { id: 'returned', label: 'Returned' },
        { id: 'replaced', label: 'Replaced' },
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
                if (activeFilter === 'returned') return !!order.return_status;
                if (activeFilter === 'replaced') return !!order.replace_status;
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
                return { label: '✓ Delivered', className: 'bg-green-100 text-green-700 border border-green-200' };
            case 'OUT_FOR_DELIVERY':
                return { label: '🚚 Out for Delivery', className: 'bg-pink-100 text-pink-700 border border-pink-200' };
            case 'SHIPPED':
                return { label: '📦 Shipped', className: 'bg-blue-100 text-blue-700 border border-blue-200' };
            case 'DISPATCHED':
                return { label: '🚀 Dispatched', className: 'bg-purple-100 text-purple-700 border border-purple-200' };
            case 'BOOKED':
                return { label: '✅ Confirmed', className: 'bg-indigo-100 text-indigo-700 border border-indigo-200' };
            case 'CANCELLED':
                return { label: '✕ Cancelled', className: 'bg-red-100 text-red-600 border border-red-200' };
            case 'ORDER_PLACED':
            case 'PENDING':
                return { label: '⏳ Pending', className: 'bg-[#E3D5B9] text-[#8C7A5B] border-none' };
            default:
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
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
                            {/* Tabs */}
                            <div className="flex gap-2 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide flex-1 min-w-0 w-full">
                                {filters.map((filter) => {
                                    const isActive = activeFilter === filter.id;

                                    const count = filter.id === 'all' ? orders.length : orders.filter(order => {
                                        const status = order.current_status.toUpperCase();
                                        if (filter.id === 'processing') {
                                            return ['ORDER_PLACED', 'PENDING', 'BOOKED', 'DISPATCHED'].includes(status);
                                        }
                                        if (filter.id === 'shipped') return status === 'SHIPPED';
                                        if (filter.id === 'delivered') return status === 'DELIVERED';
                                        if (filter.id === 'returned') return !!order.return_status;
                                        if (filter.id === 'replaced') return !!order.replace_status;
                                        return false;
                                    }).length;

                                    const badgeColor = isActive
                                        ? 'bg-white/20 text-white border-transparent'
                                        : filter.id === 'processing' ? 'bg-amber-50 text-amber-700 border-amber-200'
                                            : filter.id === 'shipped' ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                : filter.id === 'delivered' ? 'bg-green-50 text-green-700 border-green-200'
                                                    : filter.id === 'returned' ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                        : filter.id === 'replaced' ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                            : 'bg-neutral-100 text-[#6B6B6B] border-[#E0E0D8]';

                                    return (
                                        <button
                                            key={filter.id}
                                            onClick={() => handleFilterChange(filter.id)}
                                            className={`px-5 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all flex items-center gap-2 ${isActive
                                                ? 'bg-[#C9A55C] text-white shadow-md border border-[#C9A55C]'
                                                : 'bg-[#F5F3EE] text-[#6B6B6B] hover:bg-[#EAE8E4] border border-transparent hover:border-[#E0E0D8]'
                                                }`}
                                        >
                                            {filter.label}
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Search */}
                            <div className="relative w-full xl:w-80 flex-shrink-0">
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
                                        className="bg-white rounded-xl shadow-sm border border-[#E0E0D8] overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => navigate(`/my-orders/${order.order_id}`)}
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

                                                    {/* Tracking Info (if available) */}
                                                    {(order.delivery_partner || order.tracking_number) && (
                                                        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                                            <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                                                            </svg>
                                                            <div className="text-xs">
                                                                {order.delivery_partner && (
                                                                    <span className="font-semibold text-amber-800">{order.delivery_partner}</span>
                                                                )}
                                                                {order.tracking_number && (
                                                                    <span className="text-amber-700 ml-1">· {order.tracking_number}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Return / Replace Status Badges */}
                                                    {(order.return_status || order.replace_status) && (
                                                        <div className="flex flex-col gap-2 mb-3">
                                                            <div className="flex flex-wrap gap-2">
                                                                {order.return_status && (
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 text-xs font-semibold shadow-sm">
                                                                        🔄 Return: {order.return_status.replace(/_/g, ' ')}
                                                                    </span>
                                                                )}
                                                                {order.replace_status && (
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-50 to-fuchsia-50 border border-purple-200 text-purple-700 text-xs font-semibold shadow-sm">
                                                                        🔁 Replace: {order.replace_status.replace(/_/g, ' ')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-[11px] sm:text-xs text-[#6B6B6B] font-medium flex items-center gap-1.5 mt-0.5">
                                                                <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                Estimated {order.return_status && order.replace_status ? 'Return & Replacement' : order.return_status ? 'Return' : 'Replacement'}: Within 7 days
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Action Buttons */}
                                                    <div className="flex flex-wrap gap-2 items-center">
                                                        {!['DELIVERED', 'CANCELLED'].includes(order.current_status) && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/track-order/${order.order_id}${fromCart ? '?from=cart' : ''}`);
                                                                }}
                                                                className="px-4 py-2 border border-[#C9A55C] text-[#C9A55C] text-xs font-medium rounded-lg hover:bg-[#C9A55C] hover:text-white transition-colors"
                                                            >
                                                                Track Order
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/my-orders/${order.order_id}`); }}
                                                            className="px-4 py-2 bg-[#C9A55C] text-white text-xs font-medium rounded-lg hover:bg-[#b08d4b] transition-colors"
                                                        >
                                                            View Details
                                                        </button>

                                                        {/* Three Dot Options Menu */}
                                                        <div className="relative">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenMenuId(openMenuId === order.order_id ? null : order.order_id);
                                                                }}
                                                                className="p-1.5 sm:p-2 border border-[#E0E0D8] text-[#6B6B6B] rounded-lg hover:bg-[#F5F3EE] transition-colors flex items-center justify-center focus:outline-none"
                                                                aria-label="More options"
                                                            >
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                                </svg>
                                                            </button>

                                                            {openMenuId === order.order_id && (
                                                                <>
                                                                    <div
                                                                        className="fixed inset-0 z-10"
                                                                        onClick={() => setOpenMenuId(null)}
                                                                    />
                                                                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[#E0E0D8] z-20 overflow-hidden py-1">
                                                                        {/* Cancel Order - only for PENDING/BOOKED */}
                                                                        {['PENDING', 'BOOKED'].includes(order.current_status) && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setOpenMenuId(null);
                                                                                    setCancelOrder(order);
                                                                                }}
                                                                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                                                            >
                                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                </svg>
                                                                                Cancel Order
                                                                            </button>
                                                                        )}

                                                                        {/* Return Order */}
                                                                        {order.current_status === 'DELIVERED' && !order.replace_status && (
                                                                            order.return_status ? (
                                                                                // Already requested — show as disabled info item
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setOpenMenuId(null);
                                                                                        setInfoPopup({
                                                                                            title: 'Return Already Requested',
                                                                                            message: `You have already submitted a return request for this order. Current status: ${order.return_status!.replace(/_/g, ' ')}. Please wait for our team to process it.`,
                                                                                        });
                                                                                    }}
                                                                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-400 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                                                >
                                                                                    <svg className="w-4 h-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                                                    </svg>
                                                                                    Return Requested
                                                                                    <span className="ml-auto text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">Active</span>
                                                                                </button>
                                                                            ) : (
                                                                                // Not yet requested — allow return
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setOpenMenuId(null);
                                                                                        navigate(`/my-orders/${order.order_id}/return`);
                                                                                    }}
                                                                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-[#2C2416] hover:bg-[#F5F3EE] transition-colors flex items-center gap-2"
                                                                                >
                                                                                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                                                    </svg>
                                                                                    Return Order
                                                                                </button>
                                                                            )
                                                                        )}

                                                                        {/* Replace Item */}
                                                                        {order.current_status === 'DELIVERED' && !order.return_status && (
                                                                            order.replace_status ? (
                                                                                // Already requested — show as disabled info item
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setOpenMenuId(null);
                                                                                        setInfoPopup({
                                                                                            title: 'Replacement Already Requested',
                                                                                            message: `You have already submitted a replacement request for this order. Current status: ${order.replace_status!.replace(/_/g, ' ')}. Please wait for our team to process it.`,
                                                                                        });
                                                                                    }}
                                                                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-400 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                                                >
                                                                                    <svg className="w-4 h-4 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                                    </svg>
                                                                                    Replace Requested
                                                                                    <span className="ml-auto text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-semibold">Active</span>
                                                                                </button>
                                                                            ) : (
                                                                                // Not yet requested — allow replace
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setOpenMenuId(null);
                                                                                        navigate(`/my-orders/${order.order_id}/replace`);
                                                                                    }}
                                                                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-[#2C2416] hover:bg-[#F5F3EE] transition-colors flex items-center gap-2"
                                                                                >
                                                                                    <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                                    </svg>
                                                                                    Replace Item
                                                                                </button>
                                                                            )
                                                                        )}

                                                                        {/* View Details — always available */}
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setOpenMenuId(null);
                                                                                navigate(`/my-orders/${order.order_id}`);
                                                                            }}
                                                                            className="w-full px-4 py-2.5 text-left text-sm font-medium text-[#2C2416] hover:bg-[#F5F3EE] transition-colors flex items-center gap-2 border-t border-[#F0F0F0] mt-1"
                                                                        >
                                                                            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                            </svg>
                                                                            View Details
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
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

            {/* Order Cancellation Modal */}
            <OrderCancellationModal
                isOpen={!!cancelOrder}
                onClose={() => setCancelOrder(null)}
                onConfirm={handleCancelOrder}
                orderNumber={cancelOrder?.order_number || ''}
                isLoading={isCancelling}
            />

            {/* Info Popup for already-requested actions */}
            {infoPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setInfoPopup(null)}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div
                        className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-[#2C2416] mb-1">{infoPopup.title}</h3>
                                <p className="text-sm text-[#6B6B6B] leading-relaxed">{infoPopup.message}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setInfoPopup(null)}
                            className="mt-5 w-full py-2.5 bg-[#C9A55C] text-white text-sm font-semibold rounded-xl hover:bg-[#b08d4b] transition-colors"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </UserDashboardLayout>
    );
};
