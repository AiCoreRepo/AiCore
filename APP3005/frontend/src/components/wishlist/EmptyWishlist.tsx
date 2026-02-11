import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WISHLIST_MESSAGES } from '@/constants/wishlist.constants';

interface EmptyWishlistProps {
    className?: string;
}

export const EmptyWishlist: React.FC<EmptyWishlistProps> = ({ className }) => {
    return (
        <div className={`flex flex-col items-center justify-center py-12 sm:py-16 px-4 ${className}`}>
            {/* Animated Heart Icon */}
            <div className="relative mb-4 sm:mb-6">
                <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-full blur-xl animate-pulse" />
                <div className="relative p-4 sm:p-6 bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5 rounded-full border border-[#D4AF37]/20">
                    <Heart className="w-8 h-8 sm:w-12 sm:h-12 text-[#D4AF37]" strokeWidth={1.5} />
                </div>
            </div>

            {/* Title */}
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 text-center">
                {WISHLIST_MESSAGES.EMPTY_WISHLIST}
            </h2>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-gray-500 text-center mb-6 sm:mb-8 max-w-md px-2">
                {WISHLIST_MESSAGES.EMPTY_WISHLIST_SUBTITLE}. Browse our collection and tap the heart
                icon to save items you love.
            </p>

            {/* CTA Button */}
            <Link
                to="/collection"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-white text-sm sm:text-base font-medium rounded-full shadow-lg shadow-[#D4AF37]/30 hover:shadow-xl hover:shadow-[#D4AF37]/40 transition-all duration-300 hover:scale-105"
            >
                Start Shopping
            </Link>
        </div>
    );
};

export default EmptyWishlist;
