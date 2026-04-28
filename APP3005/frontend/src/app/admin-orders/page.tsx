import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
    ShoppingBag, Search, Calendar, CreditCard, Package,
    Truck, CheckCircle2, MapPin,
    ChevronRight, ChevronLeft, Edit3, Save, X as XIcon,
    Loader2, AlertCircle, RefreshCw, RotateCcw,
    ImageOff, ChevronDown, Menu
} from 'lucide-react';
import { Sidebar } from '@/components/admin/Sidebar';
import { formatRefundStatus } from '@/features/orders/utils/order.utils';
import { useRefundSSE } from '@/features/orders/hooks/useRefundSSE';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderItem {
    order_item_id: string;
    product_id: string;
    product_name: string;
    product_image?: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    size?: string | null;
    color?: string | null;
    product?: {
        images?: Array<{ url: string; is_primary: boolean }>;
    };
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
    return_status?: string | null;
    replace_status?: string | null;
    refund_status?: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

const STATUS_ORDER = ['PENDING', 'BOOKED', 'DISPATCHED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const getAdminAllowedNextStatuses = (currentStatus: string): string[] => {
    if (currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED') return [];
    const idx = STATUS_ORDER.indexOf(currentStatus);
    const forward = idx === -1 ? STATUS_ORDER : STATUS_ORDER.slice(idx + 1);
    return [...forward, 'CANCELLED'];
};

const STATUS_META: Record<string, { color: string; bg: string; border: string; label: string; dot: string }> = {
    PENDING: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.35)', label: 'Pending Approval', dot: '#F59E0B' },
    BOOKED: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.35)', label: 'Confirmed', dot: '#3B82F6' },
    DISPATCHED: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.35)', label: 'Dispatched', dot: '#8B5CF6' },
    SHIPPED: { color: '#6366F1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.35)', label: 'In Transit', dot: '#6366F1' },
    OUT_FOR_DELIVERY: { color: '#EC4899', bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.35)', label: 'Out for Delivery', dot: '#EC4899' },
    DELIVERED: { color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.35)', label: 'Delivered', dot: '#10B981' },
    CANCELLED: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.35)', label: 'Cancelled', dot: '#EF4444' },
};

const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Pending',
    BOOKED: 'Booked / Confirmed',
    DISPATCHED: 'Dispatched',
    SHIPPED: 'Shipped / In Transit',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
};

const PAYMENT_LABELS: Record<string, string> = {
    PENDING: 'Pending',
    COMPLETED: 'Completed / Paid',
    FAILED: 'Failed / Rejected',
};

const PAYMENT_META: Record<string, { color: string; dot: string }> = {
    PENDING: { color: '#ffffff', dot: '#F59E0B' },
    COMPLETED: { color: '#ffffff', dot: '#10B981' },
    FAILED: { color: '#ffffff', dot: '#EF4444' },
};

const ALL_FILTER_TABS = [
    { id: 'all', label: 'All Orders', },
    { id: 'PENDING', label: 'Pending', },
    { id: 'BOOKED', label: 'Booked', },
    { id: 'DISPATCHED', label: 'Dispatched', },
    { id: 'SHIPPED', label: 'Shipped', },
    { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { id: 'DELIVERED', label: 'Delivered', },
    { id: 'CANCELLED', label: 'Cancelled', },
    { id: 'RETURN_REQUESTED', label: 'Returns', },
    { id: 'REPLACE_REQUESTED', label: 'Replacements', },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getItemImage = (item: OrderItem): string | null => {
    if (item.product_image) return item.product_image;
    if (item.product?.images?.length) {
        const primary = item.product.images.find(img => img.is_primary);
        return primary?.url || item.product.images[0]?.url || null;
    }
    return null;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const m = STATUS_META[status] || STATUS_META.PENDING;
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
            style={{ color: m.color, background: m.bg, borderColor: m.border }}
        >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: m.dot }} />
            {m.label}
        </span>
    );
};

// Skeleton card for lazy loading
const SkeletonCard = () => (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 sm:p-6 animate-pulse">
        <div className="flex gap-4">
            <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl bg-neutral-800 flex-shrink-0" />
            <div className="flex-1 space-y-3">
                <div className="flex gap-3 flex-wrap">
                    <div className="h-5 w-36 bg-neutral-800 rounded" />
                    <div className="h-5 w-24 bg-neutral-800 rounded-full" />
                </div>
                <div className="h-4 w-56 bg-neutral-800 rounded" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-8 bg-neutral-800 rounded" />
                    ))}
                </div>
            </div>
        </div>
        <div className="mt-4 flex justify-end">
            <div className="h-9 w-32 bg-neutral-800 rounded-xl" />
        </div>
    </div>
);

// ─── Custom Status Dropdown — Portal-based so it's never clipped ──────────────


interface StatusDropdownProps {
    value: string;
    options: string[];
    onChange: (v: string) => void;
    labels: Record<string, string>;
    colors: Record<string, { dot: string; color: string }>;
    disabled?: boolean;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({ value, options, onChange, labels, colors, disabled }) => {
    const [open, setOpen] = React.useState(false);
    const [rect, setRect] = React.useState<DOMRect | null>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const panelRef = React.useRef<HTMLDivElement>(null);

    // Calculate position when opening
    const handleOpen = () => {
        if (triggerRef.current) {
            setRect(triggerRef.current.getBoundingClientRect());
        }
        setOpen(o => !o);
    };

    // Close on outside click
    React.useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                triggerRef.current && !triggerRef.current.contains(target) &&
                panelRef.current && !panelRef.current.contains(target)
            ) {
                setOpen(false);
            }
        };
        // Update rect on scroll so panel follows the trigger
        const updateRect = () => {
            if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
        };
        document.addEventListener('mousedown', handler);
        window.addEventListener('scroll', updateRect, true);
        window.addEventListener('resize', updateRect);
        return () => {
            document.removeEventListener('mousedown', handler);
            window.removeEventListener('scroll', updateRect, true);
            window.removeEventListener('resize', updateRect);
        };
    }, [open]);

    const selected = labels[value] || value;
    const dotColor = colors[value]?.dot || '#888';

    if (options.length === 0) {
        return (
            <div className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-500 text-sm">
                No transitions available
            </div>
        );
    }

    // Dropdown panel — rendered via portal on body
    const panelStyle: React.CSSProperties = rect
        ? {
            position: 'fixed',
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
            zIndex: 99999,
            background: '#1c1c2e',
            borderRadius: '0.75rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)',
            border: '1px solid rgba(245,158,11,0.6)',
            overflowY: 'auto',
            maxHeight: '240px',
        }
        : { display: 'none' };

    return (
        <>
            {/* Trigger button */}
            <button
                ref={triggerRef}
                type="button"
                onClick={handleOpen}
                disabled={disabled}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-neutral-800 border rounded-xl text-sm font-medium transition-colors focus:outline-none ${
                    disabled 
                        ? 'cursor-not-allowed opacity-60 border-neutral-700 text-neutral-400' 
                        : 'border-amber-500/60 hover:border-amber-500'
                }`}
            >
                <span className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                    <span className="text-white truncate">{selected}</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-amber-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Portal panel — renders directly on body, above everything */}
            {open && ReactDOM.createPortal(
                <div ref={panelRef} style={panelStyle}>
                    {options.map(opt => {
                        const label = labels[opt] || opt;
                        const dot = colors[opt]?.dot || '#888';
                        const isSelected = opt === value;
                        return (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => { onChange(opt); setOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-semibold transition-colors"
                                style={{
                                    background: isSelected ? 'rgba(245,158,11,0.15)' : 'transparent',
                                    color: '#ffffff',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                }}
                                onMouseEnter={e => {
                                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.background = isSelected ? 'rgba(245,158,11,0.15)' : 'transparent';
                                }}
                            >
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dot }} />
                                <span className="flex-1 text-white">{label}</span>
                                {isSelected && (
                                    <span style={{ color: '#F59E0B', fontSize: '0.875rem', fontWeight: 700 }}>✓</span>
                                )}
                            </button>
                        );
                    })}
                </div>,
                document.body
            )}
        </>
    );
};



const AdminOrdersPage = () => {
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newStatus, setNewStatus] = useState('');
    const [trackingNum, setTrackingNum] = useState('');
    const [deliveryPartner, setDeliveryPartner] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [returnStatus, setReturnStatus] = useState('');
    const [replaceStatus, setReplaceStatus] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateMsg, setUpdateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Modal state for refund confirmation
    const [refundConfirmOrder, setRefundConfirmOrder] = useState<Order | null>(null);

    // Lazy-load: which order cards are visible
    const [visibleSet, setVisibleSet] = useState<Set<string>>(new Set());
    const observerRef = useRef<IntersectionObserver | null>(null);
    const observedNodes = useRef<Map<string, Element>>(new Map());

    // Create ONE persistent observer at mount
    useEffect(() => {
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = (entry.target as HTMLElement).dataset.orderid;
                        if (id) setVisibleSet(prev => new Set([...prev, id]));
                    }
                });
            },
            { threshold: 0.05, rootMargin: '100px' }
        );
        return () => observerRef.current?.disconnect();
    }, []);

    const registerCardRef = useCallback((node: HTMLDivElement | null, orderId: string) => {
        if (!node) return;
        observedNodes.current.set(orderId, node);
        observerRef.current?.observe(node);
    }, []);

    // Date filter state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // ── Fetch ─────────────────────────────────────────────────────────────────

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/orders/all`,
                { credentials: 'include' }
            );
            if (res.ok) {
                const data = await res.json();
                // Only show COD orders, or online orders that were successfully paid. Hide abandoned (PENDING/FAILED) online checkouts.
                const validOrders = data.filter((o: Order) => {
                    return o.payment_method === 'COD' || ['COMPLETED', 'REFUNDED'].includes(o.payment_status);
                });
                
                // Historical state correction
                const corrected = validOrders.map((o: Order) => {
                    if (o.refund_status === 'COMPLETED') {
                        if (o.return_status && o.return_status !== 'COMPLETED') o.return_status = 'COMPLETED';
                        if (o.replace_status && o.replace_status !== 'COMPLETED') o.replace_status = 'COMPLETED';
                    }
                    return o;
                });

                setAllOrders(corrected);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // ── SSE Real-time Refund Updates ──────────────────────────────────────────
    useRefundSSE({
        // Undefined watchOrderIds = listen to ALL refund updates
        onUpdate: (event) => {
            console.log('[AdminOrders] SSE Update received:', event);
            setAllOrders((prevOrders) =>
                prevOrders.map((order) => {
                    if (order.order_id !== event.orderId) return order;

                    const updatedFields: any = { refund_status: event.status };

                    // If refund becomes COMPLETED, update active return/replace UI automatically
                    if (event.status === 'COMPLETED') {
                        if (order.return_status && order.return_status !== 'COMPLETED') {
                            updatedFields.return_status = 'COMPLETED';
                        }
                        if (order.replace_status && order.replace_status !== 'COMPLETED') {
                            updatedFields.replace_status = 'COMPLETED';
                        }
                    }

                    return { ...order, ...updatedFields };
                })
            );
        },
    });

    // ── Filtering & Pagination ────────────────────────────────────────────────

    const filtered = allOrders.filter(order => {
        let matchFilter = activeFilter === 'all' || order.current_status === activeFilter;
        if (activeFilter === 'RETURN_REQUESTED') matchFilter = !!order.return_status;
        if (activeFilter === 'REPLACE_REQUESTED') matchFilter = !!order.replace_status;

        const q = search.toLowerCase();
        const matchSearch = !q ||
            order.order_number.toLowerCase().includes(q) ||
            order.items?.some(i => i.product_name?.toLowerCase().includes(q));

        let matchDate = true;
        if (startDate || endDate) {
            const orderDate = new Date(order.created_at);
            // Reset time part for accurate date comparison
            orderDate.setHours(0, 0, 0, 0);

            if (startDate) {
                const sDate = new Date(startDate);
                sDate.setHours(0, 0, 0, 0);
                if (orderDate < sDate) matchDate = false;
            }
            if (endDate) {
                const eDate = new Date(endDate);
                eDate.setHours(23, 59, 59, 999); // end of the day
                if (orderDate > eDate) matchDate = false;
            }
        }

        return matchFilter && matchSearch && matchDate;
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginatedOrders = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);


    // reset page on filter/search change
    useEffect(() => { setCurrentPage(1); }, [activeFilter, search, startDate, endDate]);

    // Re-observe cards whenever page changes
    useEffect(() => {
        const obs = observerRef.current;
        if (!obs) return;
        const timer = setTimeout(() => {
            observedNodes.current.forEach((node) => obs.observe(node));
        }, 50);
        return () => clearTimeout(timer);
    }, [paginatedOrders]);

    // ── Edit helpers ──────────────────────────────────────────────────────────

    const startEditing = (order: Order) => {
        setEditingId(order.order_id);
        const allowed = getAdminAllowedNextStatuses(order.current_status);
        setNewStatus(allowed.length > 0 ? allowed[0] : order.current_status);
        setTrackingNum(order.tracking_number || '');
        setDeliveryPartner(order.delivery_partner || '');
        setPaymentStatus(order.payment_status || '');
        setReturnStatus(order.return_status || '');
        setReplaceStatus(order.replace_status || '');
        setUpdateMsg(null);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setNewStatus('');
        setTrackingNum('');
        setDeliveryPartner('');
        setPaymentStatus('');
        setReturnStatus('');
        setReplaceStatus('');
        setUpdateMsg(null);
    };

    const submitUpdate = async (orderId: string) => {
        if (!newStatus) return;
        setIsUpdating(true);
        setUpdateMsg(null);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/orders/${orderId}/status`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        status: newStatus,
                        trackingNumber: trackingNum || undefined,
                        deliveryPartner: deliveryPartner || undefined,
                        paymentStatus: paymentStatus || undefined,
                        returnStatus: returnStatus || undefined,
                        replaceStatus: replaceStatus || undefined,
                        notes: `Admin updated to ${newStatus}`,
                    }),
                }
            );
            if (res.ok) {
                setUpdateMsg({ type: 'success', text: '✓ Order updated successfully!' });
                await fetchOrders();
                setTimeout(cancelEditing, 1500);
            } else {
                const err = await res.json();
                setUpdateMsg({ type: 'error', text: err.message || 'Update failed.' });
            }
        } catch {
            setUpdateMsg({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleProcessRefund = async (orderId: string) => {
        setIsUpdating(true);
        setUpdateMsg(null);
        try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';

            // Step 1: Admin-initiate refund (creates PENDING_REVIEW record, or returns existing one)
            const resInitiate = await fetch(`${apiBase}/refunds/admin/initiate/${orderId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ reason: 'Admin triggered PayU Refund' })
            });

            if (!resInitiate.ok) {
                const err = await resInitiate.json();
                setUpdateMsg({ type: 'error', text: err.message || 'Failed to initiate refund.' });
                return;
            }

            const refundData = await resInitiate.json();

            if (!refundData?.refund_id) {
                setUpdateMsg({ type: 'error', text: 'Refund initiation failed: No refund ID returned.' });
                return;
            }

            // Step 2: Trigger PayU refund processing
            const resProcess = await fetch(`${apiBase}/refunds/admin/${refundData.refund_id}/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (resProcess.ok) {
                setUpdateMsg({ type: 'success', text: '✓ PayU Refund Processed successfully!' });
                await fetchOrders();
            } else {
                const err = await resProcess.json();
                setUpdateMsg({ type: 'error', text: err.message || 'Failed to process PayU refund.' });
                // We could use a global toast here if available, but for now rely on the UI reload or state
                alert(err.message || 'Failed to process PayU refund.');
            }
        } catch (err) {
            setUpdateMsg({ type: 'error', text: 'Network error while making refund.' });
            alert('Network error while making refund.');
        } finally {
            setIsUpdating(false);
            setRefundConfirmOrder(null);
        }
    };

    // ── Pagination pages array ────────────────────────────────────────────────

    const getPageNumbers = () => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages: (number | '...')[] = [1];
        if (currentPage > 3) pages.push('...');
        for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) {
            pages.push(p);
        }
        if (currentPage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
        return pages;
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex min-h-screen bg-neutral-950 font-sans">

            {/* ── Sidebar: desktop always visible, mobile slide-in overlay ── */}
            {/* Dark dimmer behind mobile sidebar */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/70 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar wrapper — clips it out of flow on mobile */}
            <div
                className="flex-shrink-0 hidden lg:block"
                style={{ width: 280 }}
            >
                {/* Actual sidebar (it is position:fixed internally so this div is just a spacer) */}
                <Sidebar />
            </div>

            {/* Mobile sidebar: slide in as overlay */}
            <div
                className={`
                    fixed top-0 left-0 h-full z-50 lg:hidden w-[280px]
                    transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <Sidebar />
            </div>

            {/* Main content — always fills remaining space */}
            <div className="flex-1 min-w-0 flex flex-col min-h-screen overflow-x-hidden">

                {/* ── Top Bar ─────────────────────────────────────────────── */}
                <div className="bg-neutral-900/95 border-b border-neutral-800 sticky top-0 z-30 backdrop-blur-xl">
                    <div className="px-4 sm:px-6 lg:px-8 py-4">

                        {/* Title Row */}
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                                {/* Mobile hamburger */}
                                <button
                                    className="lg:hidden p-2 rounded-lg bg-neutral-800 text-neutral-300"
                                    onClick={() => setSidebarOpen(true)}
                                >
                                    <Menu className="w-5 h-5" />
                                </button>
                                <div>
                                    <h1 className="text-lg sm:text-2xl font-bold text-white leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
                                        Order Management
                                    </h1>
                                    <p className="text-neutral-500 text-xs hidden sm:block">
                                        {filtered.length} order{filtered.length !== 1 ? 's' : ''} found
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={fetchOrders}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-sm font-medium transition-all border border-neutral-700 whitespace-nowrap"
                            >
                                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Refresh</span>
                            </button>
                        </div>

                        {/* Filters Row: Search + Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                <input
                                    type="text"
                                    placeholder="Search orders, products..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-amber-500/60 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors text-sm font-medium"
                                />
                            </div>
                            <div className="flex items-center gap-2 md:col-span-2">
                                <label className="text-xs font-semibold text-neutral-400 uppercase">From</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="flex-1 px-3 py-2.5 bg-neutral-800 border border-amber-500/60 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                                    style={{ colorScheme: 'dark' }}
                                    title="Start Date"
                                />
                                <label className="text-xs font-semibold text-neutral-400 uppercase px-1">To</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    className="flex-1 px-3 py-2.5 bg-neutral-800 border border-amber-500/60 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                                    style={{ colorScheme: 'dark' }}
                                    title="End Date"
                                />
                                {(startDate || endDate) && (
                                    <button
                                        onClick={() => { setStartDate(''); setEndDate(''); }}
                                        className="p-2.5 text-neutral-400 hover:text-amber-500 bg-neutral-800 border border-amber-500/60 rounded-xl transition-colors shrink-0 flex items-center justify-center"
                                        title="Clear Dates"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter Tabs — scroll horizontal */}
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {ALL_FILTER_TABS.map(tab => {
                                // Important: We should show the count based on the DATE/SEARCH filter as well so it's accurate
                                // or show total in category. Let's show total in category respecting date bounds
                                const inTab = allOrders.filter(o => {
                                    let match = tab.id === 'all' || o.current_status === tab.id;
                                    if (tab.id === 'RETURN_REQUESTED') match = !!o.return_status;
                                    if (tab.id === 'REPLACE_REQUESTED') match = !!o.replace_status;

                                    if (!match) return false;
                                    if (startDate) {
                                        const s = new Date(startDate);
                                        s.setHours(0, 0, 0, 0);
                                        const d = new Date(o.created_at);
                                        d.setHours(0, 0, 0, 0);
                                        if (d < s) return false;
                                    }
                                    if (endDate) {
                                        const e = new Date(endDate);
                                        e.setHours(23, 59, 59, 999);
                                        if (new Date(o.created_at) > e) return false;
                                    }
                                    return true;
                                });
                                const count = inTab.length;
                                const isActive = activeFilter === tab.id;
                                const meta = STATUS_META[tab.id];
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveFilter(tab.id)}
                                        className={`
                                            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0
                                            ${isActive
                                                ? 'bg-amber-500 text-black shadow-md'
                                                : 'bg-neutral-800/60 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                                            }
                                        `}
                                    >
                                        {tab.id !== 'all' && meta && (
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: isActive ? '#000' : meta.dot }} />
                                        )}
                                        {tab.label}
                                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-black/20' : 'bg-neutral-700 text-neutral-400'}`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Orders List ─────────────────────────────────────────── */}
                <div className="flex-1 p-4 sm:p-6 lg:p-8">

                    {/* Loading skeletons */}
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                        </div>
                    ) : paginatedOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="w-20 h-20 rounded-full bg-neutral-800/50 flex items-center justify-center mb-4">
                                <ShoppingBag className="w-10 h-10 text-neutral-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-neutral-400 mb-1">No orders found</h3>
                            <p className="text-neutral-600 text-sm text-center max-w-xs">
                                {search ? 'Try a different search term' : 'Orders will appear here once customers place them'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {paginatedOrders.map((order, idx) => {
                                const isEditing = editingId === order.order_id;
                                const isTerminal = ['DELIVERED', 'CANCELLED'].includes(order.current_status);
                                const allowed = getAdminAllowedNextStatuses(order.current_status);
                                const meta = STATUS_META[order.current_status] || STATUS_META.PENDING;
                                const primaryItem = order.items?.[0];
                                const primaryImg = primaryItem ? getItemImage(primaryItem) : null;
                                const isVisible = visibleSet.has(order.order_id);

                                return (
                                    <div
                                        key={order.order_id}
                                        ref={node => registerCardRef(node, order.order_id)}
                                        data-orderid={order.order_id}
                                        className={`
                                            bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden
                                            hover:border-neutral-700 transition-all duration-500
                                            ${isVisible
                                                ? 'opacity-100 translate-y-0'
                                                : 'opacity-0 translate-y-2'
                                            }
                                        `}
                                        style={{ transitionDelay: `${Math.min(idx * 60, 300)}ms` }}
                                    >
                                        <div className="p-4 sm:p-5 lg:p-6">

                                            {/* ── Card Header ───────────────────────────── */}
                                            <div className="flex gap-3 sm:gap-4">

                                                {/* Image */}
                                                <div className="relative flex-shrink-0">
                                                    <div
                                                        className="rounded-xl overflow-hidden border border-neutral-700 bg-neutral-800"
                                                        style={{ width: '3.5rem', height: '4.5rem' }}
                                                    >
                                                        {primaryImg ? (
                                                            <img
                                                                src={primaryImg}
                                                                alt={primaryItem?.product_name || 'Product'}
                                                                className="w-full h-full object-cover"
                                                                loading="lazy"
                                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <ImageOff className="w-6 h-6 text-neutral-600" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    {(order.items?.length || 0) > 1 && (
                                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-bold flex items-center justify-center">
                                                            +{order.items.length - 1}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info block */}
                                                <div className="flex-1 min-w-0">

                                                    {/* Order number + status + UPDATE BUTTON */}
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <span className="text-sm font-bold text-white truncate max-w-[160px] sm:max-w-none">
                                                            {order.order_number}
                                                        </span>
                                                        <StatusBadge status={order.current_status} />

                                                        {order.return_status && (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/35 text-blue-400 whitespace-nowrap">
                                                                🔄 Return: {order.return_status.replace(/_/g, ' ')}
                                                            </span>
                                                        )}

                                                        {order.replace_status && (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 border border-purple-500/35 text-purple-400 whitespace-nowrap">
                                                                🔁 Replace: {order.replace_status.replace(/_/g, ' ')}
                                                            </span>
                                                        )}

                                                        {order.refund_status && (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 whitespace-nowrap">
                                                                💰 Refund: {formatRefundStatus(order.refund_status)}
                                                            </span>
                                                        )}

                                                        {/* UPDATE STATUS BUTTON */}
                                                        {!isEditing && (
                                                            <button
                                                                onClick={() => startEditing(order)}
                                                                className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-400 hover:bg-amber-500/20 transition-all text-xs font-semibold whitespace-nowrap"
                                                            >
                                                                <Edit3 className="w-3 h-3" />
                                                                <span className="hidden xs:inline">Update</span>
                                                                <span className="xs:hidden">✎</span>
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Product name */}
                                                    {primaryItem && (
                                                        <p className="text-xs sm:text-sm text-neutral-400 mb-2 line-clamp-1">
                                                            {primaryItem.product_name}
                                                            {(order.items?.length || 0) > 1 && (
                                                                <span className="text-neutral-600"> + {order.items.length - 1} more</span>
                                                            )}
                                                        </p>
                                                    )}

                                                    {/* Meta grid — 2 col mobile, 4 col desktop */}
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-2">
                                                        <MetaCell icon={<Calendar className="w-3 h-3" />} label="Date" value={
                                                            new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
                                                        } />
                                                        <MetaCell icon={<CreditCard className="w-3 h-3" />} label="Payment" value={order.payment_method} />
                                                        <MetaCell icon={<Package className="w-3 h-3" />} label="Items" value={`${order.items?.length || 0} item${(order.items?.length || 0) !== 1 ? 's' : ''}`} />
                                                        <MetaCell icon={<ShoppingBag className="w-3 h-3" />} label="Total" value={`₹${Number(order.total_amount).toLocaleString('en-IN')}`} gold />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Address */}
                                            {order.shipping_address && !isEditing && (
                                                <div className="flex items-start gap-2 mt-3 px-3 py-2 bg-neutral-800/30 rounded-xl border border-neutral-800">
                                                    <MapPin className="w-3.5 h-3.5 text-neutral-500 mt-0.5 flex-shrink-0" />
                                                    <p className="text-xs text-neutral-500 line-clamp-1">
                                                        {order.shipping_address.address_line1}
                                                        {order.shipping_address.city ? `, ${order.shipping_address.city}` : ''}
                                                        {order.shipping_address.state ? `, ${order.shipping_address.state}` : ''}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Tracking badge */}
                                            {!isEditing && (
                                                <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-neutral-800/30 rounded-xl border border-neutral-800">
                                                    <Truck className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                                    <div className="text-xs text-neutral-400 truncate">
                                                        {order.delivery_partner && <span className="font-semibold text-neutral-300">{order.delivery_partner}</span>}
                                                        {order.tracking_number && <span className="text-neutral-500 ml-1.5 font-mono">{order.tracking_number}</span>}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Process Refund Button — only for PREPAID orders with QC-passed returns */}
                                            {(!isEditing
                                                && order.payment_method !== 'COD'
                                                && (order.return_status === 'QC_PASSED' || order.return_status === 'COMPLETED')
                                                && !['COMPLETED'].includes(order.refund_status || '')
                                            ) && (
                                                <div className="mt-3 flex justify-start">
                                                    <button
                                                        onClick={() => setRefundConfirmOrder(order)}
                                                        disabled={isUpdating}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 rounded-lg text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                        {order.refund_status === 'FAILED' ? 'Retry Refund' : 'Process Refund'} (₹{Number(order.total_amount).toLocaleString('en-IN')})
                                                    </button>
                                                </div>
                                            )}

                                            {/* COD return info — no refund applicable */}
                                            {(!isEditing
                                                && order.payment_method === 'COD'
                                                && (order.return_status === 'QC_PASSED' || order.return_status === 'COMPLETED')
                                            ) && (
                                                <div className="mt-3 px-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-xl text-xs text-neutral-500 text-center">
                                                    💵 COD order — no online refund applicable
                                                </div>
                                            )}

                                            {/* ── Edit Panel ─────────────────────────────── */}
                                            {isEditing && (
                                                <div className="mt-4 pt-4 border-t border-neutral-800">
                                                    <div className="bg-neutral-800/40 rounded-xl p-4 border border-neutral-700">
                                                        <p className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                                                            <Edit3 className="w-4 h-4 text-amber-400" />
                                                            Update Status
                                                            <span className="text-xs text-neutral-500 font-normal">
                                                                (currently: <span className="text-amber-400">{order.current_status}</span>)
                                                            </span>
                                                        </p>

                                                        {/* Alert */}
                                                        {updateMsg && editingId === order.order_id && (
                                                            <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs mb-3 mt-2 border ${updateMsg.type === 'success'
                                                                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                                                                }`}>
                                                                {updateMsg.type === 'error'
                                                                    ? <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                                                    : <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                                                }
                                                                {updateMsg.text}
                                                            </div>
                                                        )}

                                                        {/* Fields — dynamic columns depending on payment status visibility */}
                                                        <div className={`grid grid-cols-1 gap-3 mt-3 \${order.payment_method === 'COD' && order.payment_status !== 'COMPLETED' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}>
                                                            {/* Status custom dropdown */}
                                                            <div>
                                                                <label className="block text-xs text-neutral-500 mb-1 font-medium uppercase tracking-wide">New Status *</label>
                                                                <StatusDropdown
                                                                    value={newStatus}
                                                                    options={allowed}
                                                                    onChange={setNewStatus}
                                                                    labels={STATUS_LABELS}
                                                                    colors={STATUS_META}
                                                                />
                                                            </div>

                                                            {/* Tracking */}
                                                            <div>
                                                                <label className="block text-xs text-neutral-500 mb-1 font-medium uppercase tracking-wide">Tracking ID</label>
                                                                <input
                                                                    type="text"
                                                                    value={trackingNum}
                                                                    onChange={e => setTrackingNum(e.target.value)}
                                                                    placeholder="e.g. TRK123456"
                                                                    className="w-full px-3 py-2.5 bg-neutral-800 border border-amber-500/60 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder-neutral-500"
                                                                />
                                                            </div>

                                                            {/* Delivery partner */}
                                                            <div>
                                                                <label className="block text-xs text-neutral-500 mb-1 font-medium uppercase tracking-wide">Delivery Partner</label>
                                                                <input
                                                                    type="text"
                                                                    value={deliveryPartner}
                                                                    onChange={e => setDeliveryPartner(e.target.value)}
                                                                    placeholder="e.g. Delhivery"
                                                                    className="w-full px-3 py-2.5 bg-neutral-800 border border-amber-500/60 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder-neutral-500"
                                                                />
                                                            </div>

                                                            {/* Payment Status Dropdown (Cash on delivery only when not completed) */}
                                                            {order.payment_method === 'COD' && order.payment_status !== 'COMPLETED' && (
                                                                <div>
                                                                    <label className="block text-xs text-neutral-500 mb-1 font-medium uppercase tracking-wide">Payment Status</label>
                                                                    <StatusDropdown
                                                                        value={paymentStatus}
                                                                        options={['PENDING', 'COMPLETED', 'FAILED']}
                                                                        onChange={val => {
                                                                            setPaymentStatus(val);
                                                                            if (val === 'COMPLETED' && allowed.includes('DELIVERED')) {
                                                                                setNewStatus('DELIVERED');
                                                                            } else if (val === 'FAILED' && allowed.includes('CANCELLED')) {
                                                                                setNewStatus('CANCELLED');
                                                                            }
                                                                        }}
                                                                        labels={PAYMENT_LABELS}
                                                                        colors={PAYMENT_META as any}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Return & Replace Statuses */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                                            {/* Return Status Dropdown */}
                                                            <div>
                                                                <label className="block text-xs text-neutral-500 mb-1 font-medium uppercase tracking-wide">Return Status</label>
                                                                <StatusDropdown
                                                                    value={returnStatus || ''}
                                                                    options={['', 'REQUESTED', 'APPROVED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'QC_IN_PROGRESS', 'QC_PASSED', 'QC_FAILED', 'COMPLETED', 'REJECTED']}
                                                                    onChange={setReturnStatus}
                                                                    labels={{'': 'None', REQUESTED: 'Requested', APPROVED: 'Approved', PICKUP_SCHEDULED: 'Pickup Scheduled', PICKED_UP: 'Picked Up', QC_IN_PROGRESS: 'QC In Progress', QC_PASSED: 'QC Passed', QC_FAILED: 'QC Failed', COMPLETED: 'Completed', REJECTED: 'Rejected'}}
                                                                    colors={{}}
                                                                    disabled={order.refund_status === 'COMPLETED'}
                                                                />
                                                            </div>

                                                            {/* Replace Status Dropdown */}
                                                            <div>
                                                                <label className="block text-xs text-neutral-500 mb-1 font-medium uppercase tracking-wide">Replace Status</label>
                                                                <StatusDropdown
                                                                    value={replaceStatus || ''}
                                                                    options={['', 'REQUESTED', 'APPROVED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'DISPATCHED', 'DELIVERED', 'COMPLETED', 'REJECTED']}
                                                                    onChange={setReplaceStatus}
                                                                    labels={{'': 'None', REQUESTED: 'Requested', APPROVED: 'Approved', PICKUP_SCHEDULED: 'Pickup Scheduled', PICKED_UP: 'Picked Up', DISPATCHED: 'Dispatched', DELIVERED: 'Delivered', COMPLETED: 'Completed', REJECTED: 'Rejected'}}
                                                                    colors={{}}
                                                                    disabled={order.refund_status === 'COMPLETED'}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Action buttons — full width on mobile */}
                                                        <div className="flex flex-col xs:flex-row gap-2 mt-4">
                                                            <button
                                                                onClick={() => submitUpdate(order.order_id)}
                                                                disabled={isUpdating || !newStatus}
                                                                className="flex-1 xs:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 text-black rounded-xl text-xs font-bold hover:bg-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
                                                            >
                                                                {isUpdating ? (
                                                                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating...</>
                                                                ) : (
                                                                    <><Save className="w-3.5 h-3.5" /> Save Changes</>
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={cancelEditing}
                                                                disabled={isUpdating}
                                                                className="flex-1 xs:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-800 text-neutral-300 rounded-xl text-xs font-semibold hover:bg-neutral-700 transition-all disabled:opacity-50"
                                                            >
                                                                <XIcon className="w-3.5 h-3.5" /> Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Multi-item thumbnails */}
                                            {!isEditing && order.items.length > 1 && (
                                                <div className="mt-4 pt-3 border-t border-neutral-800/60">
                                                    <p className="text-xs text-neutral-600 mb-2">All items:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {order.items.map((item, i) => {
                                                            const img = getItemImage(item);
                                                            return (
                                                                <div key={item.order_item_id || i} className="flex items-center gap-2 bg-neutral-800/40 rounded-lg px-2.5 py-1.5 border border-neutral-700/50 max-w-[10rem]">
                                                                    <div className="w-7 h-9 rounded overflow-hidden bg-neutral-800 flex-shrink-0">
                                                                        {img ? (
                                                                            <img src={img} alt={item.product_name} className="w-full h-full object-cover" loading="lazy" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center">
                                                                                <Package className="w-3 h-3 text-neutral-600" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs text-neutral-300 font-medium truncate">{item.product_name}</p>
                                                                        <p className="text-xs text-neutral-500">×{item.quantity} · ₹{Number(item.total_price).toLocaleString('en-IN')}</p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Pagination ───────────────────────────────────────── */}
                    {!isLoading && totalPages > 1 && (
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-xs text-neutral-500 order-2 sm:order-1">
                                Showing{' '}
                                <span className="text-neutral-300 font-semibold">
                                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
                                </span>
                                {' '}of{' '}
                                <span className="text-neutral-300 font-semibold">{filtered.length}</span> orders
                            </p>

                            <div className="flex items-center gap-1.5 order-1 sm:order-2">
                                {/* Prev */}
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-medium"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                                </button>

                                {/* Page numbers */}
                                <div className="flex items-center gap-1">
                                    {getPageNumbers().map((p, idx) =>
                                        p === '...' ? (
                                            <span key={`dots-${idx}`} className="px-2 text-neutral-600 text-sm">…</span>
                                        ) : (
                                            <button
                                                key={p}
                                                onClick={() => setCurrentPage(p as number)}
                                                className={`
                                                    w-8 h-8 rounded-lg text-xs font-semibold transition-all
                                                    ${currentPage === p
                                                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                                                        : 'bg-neutral-800 border border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                                                    }
                                                `}
                                            >
                                                {p}
                                            </button>
                                        )
                                    )}
                                </div>

                                {/* Next */}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-medium"
                                >
                                    Next <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Bottom spacer */}
                    <div className="h-8" />
                </div>
            </div>

            {/* Refund Confirmation Modal */}
            {refundConfirmOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isUpdating && setRefundConfirmOrder(null)} />
                    <div className="relative bg-[#1c1c2e] border border-emerald-500/30 rounded-2xl p-6 w-full max-w-sm m-4 shadow-2xl shadow-emerald-900/20">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 mb-4 mx-auto">
                            <RotateCcw className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white text-center mb-2">Process Refund</h3>
                        <p className="text-sm text-neutral-400 text-center mb-6">
                            Are you sure you want to process a PayU refund of <span className="font-bold text-emerald-400">₹{Number(refundConfirmOrder.total_amount).toLocaleString('en-IN')}</span> for order <span className="font-mono text-white">{refundConfirmOrder.order_number}</span>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setRefundConfirmOrder(null)}
                                disabled={isUpdating}
                                className="flex-1 py-2.5 bg-neutral-800 text-neutral-300 font-semibold text-sm rounded-xl hover:bg-neutral-700 transition border border-neutral-700 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleProcessRefund(refundConfirmOrder.order_id)}
                                disabled={isUpdating}
                                className="flex-1 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── MetaCell helper ───────────────────────────────────────────────────────────

const MetaCell: React.FC<{ icon: React.ReactNode; label: string; value: string; gold?: boolean }> = ({
    icon, label, value, gold
}) => (
    <div className="flex items-center gap-1.5">
        <span className="text-neutral-600 flex-shrink-0">{icon}</span>
        <div className="min-w-0">
            <p className="text-neutral-600 text-[10px] leading-none mb-0.5">{label}</p>
            <p className={`text-xs font-semibold truncate ${gold ? 'text-amber-400' : 'text-neutral-300'}`}>{value}</p>
        </div>
    </div>
);

export default AdminOrdersPage;
