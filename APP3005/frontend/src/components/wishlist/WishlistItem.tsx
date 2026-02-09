import React, { useState } from 'react';
import { X, ShoppingBag, Trash2 } from 'lucide-react';
import { WishlistItem as WishlistItemType } from '@/types/wishlist.types';
import { formatPrice, getPrimaryImageUrl } from '@/utils/wishlistUtils';
import { cn } from '@/utils/cn';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';

interface WishlistItemProps {
    item: WishlistItemType;
    onRemove: (wishlistItemId: string) => void;
    // onMoveToCart prop is no longer the primary action for the main button, 
    // but we might keep it if parent passes it, though we'll use local addToCart
    onMoveToCart?: (wishlistItemId: string) => void;
    isLoading?: boolean;
}

export const WishlistItem: React.FC<WishlistItemProps> = ({
    item,
    onRemove,
    isLoading = false,
}) => {
    const { product } = item;
    const { addToCart, cart } = useCart();
    const { toast } = useToast();
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    const imageUrl = getPrimaryImageUrl(product.images);
    const isOutOfStock = product.inventory_count <= 0;

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isAddingToCart || isOutOfStock) return;

        // Check if item is already in cart
        const isInCart = cart.items.some(cartItem => cartItem.product_id === product.product_id);
        if (isInCart) {
            toast({
                title: "Product is already in your cart",
                description: "You can update the quantity in your cart",
                className: "bg-yellow-50 border-yellow-200 text-yellow-800",
                duration: 2000,
            });
            return;
        }

        setIsAddingToCart(true);
        try {
            await addToCart({
                product_id: product.product_id,
                title: product.title,
                thumbnail: product.thumbnail || imageUrl || '', // Use imageUrl if thumbnail is missing
                price_cents: product.price_cents,
                currency: product.currency,
                quantity: 1,
                creator: product.creator,
            });

            // Show success toast
            toast({
                title: "Product added to cart successfully",
                className: "bg-green-50 border-green-200 text-green-800",
                duration: 2000,
            });
        } catch (error) {
            console.error('Error adding to cart:', error);
        } finally {
            setIsAddingToCart(false);
        }
    };

    return (
        <div
            className={cn(
                'relative group bg-white rounded-lg sm:rounded-2xl overflow-hidden border border-[#D4AF37]/20 transition-all duration-300 hover:shadow-lg hover:shadow-[#D4AF37]/10 flex flex-col',
                isLoading && 'opacity-50 pointer-events-none'
            )}
        >
            {/* Product Image - Responsive aspect ratio */}
            <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <span className="text-gray-400 text-xs sm:text-sm">No image</span>
                    </div>
                )}

                {/* Out of stock overlay */}
                {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="px-2 sm:px-4 py-1 sm:py-2 bg-white/90 text-gray-800 text-xs sm:text-sm font-medium rounded-full">
                            Out of Stock
                        </span>
                    </div>
                )}
            </div>

            {/* Product Details */}
            <div className="p-2 sm:p-4 flex flex-col flex-1">
                <div className="flex-1">
                    {/* Brand/Creator */}
                    <p className="text-[10px] sm:text-xs text-[#D4AF37] font-medium uppercase tracking-wide mb-0.5 sm:mb-1 truncate">
                        {product.creator.store_name}
                        {product.creator.verified && (
                            <span className="ml-1 text-[#D4AF37]">✓</span>
                        )}
                    </p>

                    {/* Title */}
                    <h3 className="text-xs sm:text-sm font-medium text-gray-800 mb-1 sm:mb-2 line-clamp-2 min-h-[32px] sm:min-h-[40px]">
                        {product.title}
                    </h3>

                    {/* Price */}
                    <p className="text-sm sm:text-base font-bold text-gray-900 mb-2 sm:mb-3">
                        {formatPrice(product.price_cents, product.currency)}
                    </p>
                </div>

                {/* Actions */}
                <div className="mt-2 space-y-2">
                    {/* Add to Cart Button (Keeps item in wishlist) */}
                    <button
                        onClick={handleAddToCart}
                        disabled={isOutOfStock || isAddingToCart}
                        className={cn(
                            'w-full flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-4 rounded-lg font-medium text-xs sm:text-sm transition-all duration-300',
                            isOutOfStock
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-[#D4AF37] text-white hover:bg-[#C5A028] shadow-md shadow-[#D4AF37]/20'
                        )}
                    >
                        <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">
                            {isOutOfStock ? 'Out of Stock' : (isAddingToCart ? 'Adding...' : 'Add to Cart')}
                        </span>
                        <span className="xs:hidden">
                            {isOutOfStock ? 'Unavailable' : (isAddingToCart ? '...' : 'Add to Cart')}
                        </span>
                    </button>

                    {/* Remove Button (Below the card/add button) */}
                    <button
                        onClick={() => onRemove(item.wishlist_item_id)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-400 hover:text-red-500 transition-colors border border-transparent hover:border-red-100 rounded-lg hover:bg-red-50"
                    >
                        <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        Remove
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WishlistItem;
