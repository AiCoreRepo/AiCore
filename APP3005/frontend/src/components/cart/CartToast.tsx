import React from 'react';
import { CheckCircle2, ShoppingBag, ArrowUpCircle } from 'lucide-react';

interface CartToastProps {
    /** Product title */
    title: string;
    /** Product thumbnail URL */
    thumbnail?: string | null;
    /** Whether this was a quantity increase (duplicate add) */
    isQuantityUpdate?: boolean;
    /** New quantity after the update */
    newQuantity?: number;
    /** Price in paise */
    priceCents?: number;
    /** Dismiss the toast */
    onDismiss?: () => void;
}

export const CartToast: React.FC<CartToastProps> = ({
    title,
    thumbnail,
    isQuantityUpdate = false,
    newQuantity,
    priceCents,
    onDismiss,
}) => {
    const handleViewBag = () => {
        onDismiss?.();
        // Use window.location because toast renders in a Radix portal outside Router context
        window.location.href = '/cart';
    };

    return (
        <div className="flex items-start gap-3 w-full">
            {/* Product Thumbnail */}
            <div className="relative flex-shrink-0">
                <div className="w-12 h-14 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    {thumbnail ? (
                        <img
                            src={thumbnail}
                            alt={title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-gray-400" />
                        </div>
                    )}
                </div>
                {/* Animated checkmark badge */}
                <div
                    className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-md ${isQuantityUpdate
                        ? 'bg-blue-500'
                        : 'bg-green-500'
                        }`}
                    style={{
                        animation: 'cartToastBadgePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                    }}
                >
                    {isQuantityUpdate ? (
                        <ArrowUpCircle className="w-3.5 h-3.5 text-white" />
                    ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 leading-tight">
                    {isQuantityUpdate
                        ? 'Already in your bag!'
                        : 'Added to bag ✓'}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                    {isQuantityUpdate
                        ? `Qty updated to ${newQuantity} · ${title}`
                        : title}
                </p>
                {priceCents && (
                    <p className="text-xs font-semibold text-gray-800 mt-0.5">
                        ₹{((priceCents * (newQuantity || 1)) / 100).toLocaleString('en-IN')}
                    </p>
                )}

                {/* VIEW BAG Button */}
                <button
                    onClick={handleViewBag}
                    className="mt-2 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                        background: 'linear-gradient(135deg, #D4AF37 0%, #C9A55C 100%)',
                        color: '#1a1a1a',
                        boxShadow: '0 2px 8px rgba(212, 175, 55, 0.35)',
                    }}
                >
                    View Bag
                </button>
            </div>

            {/* CSS Keyframes injected inline */}
            <style>{`
                @keyframes cartToastBadgePop {
                    0% { transform: scale(0) rotate(-45deg); opacity: 0; }
                    60% { transform: scale(1.2) rotate(0deg); opacity: 1; }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
            `}</style>
        </div>
    );
};
