import React from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { cn } from '@/utils/cn';

interface WishlistBadgeProps {
    onClick?: () => void;
    showLabel?: boolean;
    className?: string;
}

export const WishlistBadge: React.FC<WishlistBadgeProps> = ({
    onClick,
    showLabel = false,
    className,
}) => {
    const { itemCount } = useWishlist();

    return (
        <button
            onClick={onClick}
            className={cn(
                'flex flex-col items-center gap-0.5 transition-all duration-300 hover:scale-105 group relative',
                className
            )}
            aria-label={`Wishlist${itemCount > 0 ? ` (${itemCount} items)` : ''}`}
        >
            <div className="relative">
                <Heart className="w-5 h-5 text-[#6B5D4F] group-hover:text-[#D4AF37] transition-colors" />
                {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-[#D4AF37] rounded-full px-1 animate-pulse">
                        {itemCount > 99 ? '99+' : itemCount}
                    </span>
                )}
            </div>
            {showLabel && (
                <span className="text-[10px] font-medium text-[#6B5D4F] group-hover:text-[#D4AF37]">
                    Wishlist
                </span>
            )}
        </button>
    );
};

export default WishlistBadge;
