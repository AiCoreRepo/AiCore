import React from 'react';
import { motion } from 'framer-motion';
import { PendingProduct } from '@/hooks/useApprovals';
import { BadgeCheck } from 'lucide-react';

interface ApprovalCardProps {
    product: PendingProduct;
    onClick: () => void;
}

/**
 * ApprovalCard - Luxury product card for approval queue
 * 3:4 aspect ratio with gradient overlay and hover animations
 */
export const ApprovalCard: React.FC<ApprovalCardProps> = ({ product, onClick }) => {
    const formatPrice = (cents: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(cents / 100);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.2 }}
            onClick={onClick}
            className="cursor-pointer group relative"
        >
            <div className="bg-neutral-800/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-[#D4AF37]/20 transition-shadow duration-300">
                {/* Image Container - 3:4 Aspect Ratio */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-700">
                    {product.thumbnail ? (
                        <img
                            src={product.thumbnail}
                            alt={product.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-[#D4AF37]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <p className="text-neutral-500 text-xs">No Image</p>
                            </div>
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />

                    {/* Pending Badge - Top Right */}
                    <div className="absolute top-3 right-3 px-3 py-1.5 bg-amber-500/90 backdrop-blur-sm rounded-full">
                        <span className="text-neutral-950 font-bold text-xs uppercase tracking-wide">
                            Pending
                        </span>
                    </div>

                    {/* Creator Info - Bottom Left */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center text-neutral-950 font-bold text-sm shadow-lg">
                            {product.creator.store_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <p className="text-white text-sm font-semibold drop-shadow-lg flex items-center gap-1">
                                {product.creator.store_name}
                                {product.creator.verified && (
                                    <BadgeCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                                )}
                            </p>
                            <p className="text-neutral-300 text-xs drop-shadow-lg">
                                {formatDate(product.created_at)}
                            </p>
                        </div>
                    </div>

                    {/* Price - Bottom Right */}
                    <div className="absolute bottom-3 right-3 px-4 py-2 bg-black/90 backdrop-blur-md rounded-full border border-[#D4AF37]/50 shadow-lg">
                        <span className="text-[#D4AF37] font-bold text-base">
                            {formatPrice(product.price_cents, product.currency)}
                        </span>
                    </div>
                </div>

                {/* Product Title */}
                <div className="p-4 bg-gradient-to-b from-black/20 to-black/40">
                    <h3 className="text-base font-bold text-neutral-100 line-clamp-2 leading-tight">
                        {product.title}
                    </h3>
                </div>
            </div>
        </motion.div>
    );
};
