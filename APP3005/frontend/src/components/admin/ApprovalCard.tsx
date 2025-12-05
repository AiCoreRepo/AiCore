import React from 'react';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface Product {
    product_id: string;
    title: string;
    thumbnail: string | null;
    creator: {
        creator_id: string;
        store_name: string;
        verified: boolean;
    };
    created_at: string;
    price_cents: number;
    currency: string;
}

interface ApprovalCardProps {
    product: Product;
    onReview: (product: Product) => void;
}

/**
 * ApprovalCard - Redesigned product card for approval queue
 * Features: Always-visible review button, better image handling, luxury styling
 */
export const ApprovalCard: React.FC<ApprovalCardProps> = ({ product, onReview }) => {
    const formatPrice = (cents: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(cents / 100);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <motion.div
            className="relative group"
            initial="rest"
            whileHover="hover"
            animate="rest"
        >
            <motion.div
                className={cn(
                    'bg-black/40 backdrop-blur-md',
                    'border border-white/10',
                    'rounded-2xl overflow-hidden',
                    'shadow-xl shadow-black/20',
                    'transition-shadow duration-300',
                    'hover:shadow-2xl hover:shadow-[#D4AF37]/20'
                )}
                variants={{
                    rest: { y: 0 },
                    hover: { y: -5 },
                }}
                transition={{ duration: 0.2 }}
            >
                {/* Product Image - 3:4 ratio */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-800">
                    {product.thumbnail ? (
                        <img
                            src={product.thumbnail}
                            alt={product.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                    parent.innerHTML = `
                                        <div class="w-full h-full flex items-center justify-center">
                                            <div class="text-center">
                                                <div class="w-20 h-20 mx-auto mb-3 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                                                    <svg class="w-10 h-10 text-[#D4AF37]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <p class="text-neutral-500 text-sm">No Image</p>
                                            </div>
                                        </div>
                                    `;
                                }
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                                    <svg className="w-10 h-10 text-[#D4AF37]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <p className="text-neutral-500 text-sm font-medium">No Image Available</p>
                            </div>
                        </div>
                    )}

                    {/* Overlay gradient - always visible on bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

                    {/* Review Button - Always visible at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                        <motion.button
                            onClick={() => onReview(product)}
                            className="w-full px-6 py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:from-[#F4D03F] hover:to-[#D4AF37] text-neutral-950 font-bold rounded-xl shadow-lg shadow-[#D4AF37]/40 hover:shadow-[#D4AF37]/60 transition-all duration-300 flex items-center justify-center gap-2.5 group/btn"
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <Eye className="w-5 h-5 transition-transform group-hover/btn:scale-110 group-hover/btn:rotate-12" />
                            <span className="text-base">Review Product</span>
                        </motion.button>
                    </div>

                    {/* Price tag */}
                    <div className="absolute top-3 right-3 px-4 py-2 bg-black/90 backdrop-blur-md rounded-full border border-[#D4AF37]/50 shadow-lg z-10">
                        <span className="text-[#D4AF37] font-bold text-base tracking-wide">
                            {formatPrice(product.price_cents, product.currency)}
                        </span>
                    </div>
                </div>

                {/* Product Info */}
                <div className="p-5 space-y-3 bg-gradient-to-b from-black/20 to-black/40">
                    {/* Title */}
                    <h3 className="text-lg font-bold text-neutral-100 line-clamp-2 leading-tight">
                        {product.title}
                    </h3>

                    {/* Creator Info */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center text-neutral-950 font-bold text-base shadow-md">
                            {product.creator.store_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-neutral-200 truncate">
                                {product.creator.store_name}
                            </p>
                            <p className="text-xs text-neutral-500 font-medium">
                                {formatDate(product.created_at)}
                            </p>
                        </div>
                        {product.creator.verified && (
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-md">
                                <svg className="w-3.5 h-3.5 text-neutral-950" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};
