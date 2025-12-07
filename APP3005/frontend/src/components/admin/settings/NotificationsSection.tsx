import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Package, Clock, User, ArrowRight } from 'lucide-react';
import { usePendingProducts } from '@/hooks/useApprovals';
import { useNavigate } from 'react-router-dom';

/**
 * NotificationsSection - Display pending approval notifications
 */
export const NotificationsSection: React.FC = () => {
    const { data: pendingProducts, isLoading } = usePendingProducts();
    const navigate = useNavigate();

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleViewApprovals = () => {
        navigate('/admin-approvals');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-neutral-100 mb-2">Notifications</h3>
                    <p className="text-sm text-neutral-400">
                        Stay updated on pending approvals and platform activity
                    </p>
                </div>
                {pendingProducts && pendingProducts.length > 0 && (
                    <button
                        onClick={handleViewApprovals}
                        className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-colors"
                    >
                        <span className="text-sm font-medium">View All</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D4AF37] border-t-transparent"></div>
                </div>
            ) : pendingProducts && pendingProducts.length > 0 ? (
                <div className="space-y-3">
                    {pendingProducts.map((product, index) => (
                        <motion.div
                            key={product.product_id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={handleViewApprovals}
                            className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#D4AF37]/30 rounded-xl p-4 transition-all cursor-pointer"
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                    <Package className="w-6 h-6 text-amber-500" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <p className="text-sm font-medium text-neutral-200 line-clamp-1">
                                            New Product Awaiting Approval
                                        </p>
                                        <span className="flex-shrink-0 text-xs text-neutral-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatTimeAgo(product.created_at)}
                                        </span>
                                    </div>

                                    <p className="text-sm text-neutral-400 mb-2">
                                        <span className="inline-flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5" />
                                            <span className="font-medium text-neutral-300">{product.creator.store_name}</span>
                                        </span>
                                        {' '}has uploaded{' '}
                                        <span className="font-medium text-neutral-300">"{product.title}"</span>
                                        {' '}and it is pending review
                                    </p>

                                    {/* Product Preview */}
                                    <div className="flex items-center gap-3 mt-3 p-2 bg-black/20 rounded-lg">
                                        {product.thumbnail ? (
                                            <img
                                                src={product.thumbnail}
                                                alt={product.title}
                                                className="w-12 h-12 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded bg-neutral-800 flex items-center justify-center">
                                                <Package className="w-6 h-6 text-neutral-600" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-neutral-300 truncate">
                                                {product.title}
                                            </p>
                                            <p className="text-xs text-[#D4AF37]">
                                                {new Intl.NumberFormat('en-US', {
                                                    style: 'currency',
                                                    currency: product.currency || 'USD',
                                                }).format(product.price_cents / 100)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Hover Arrow */}
                                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className="w-5 h-5 text-[#D4AF37]" />
                                </div>
                            </div>

                            {/* Unread Indicator */}
                            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-amber-500"></div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800/50 flex items-center justify-center">
                        <Bell className="w-8 h-8 text-neutral-600" />
                    </div>
                    <p className="text-neutral-400 mb-2">No new notifications</p>
                    <p className="text-sm text-neutral-500">
                        You're all caught up! New approval requests will appear here.
                    </p>
                </div>
            )}
        </div>
    );
};
