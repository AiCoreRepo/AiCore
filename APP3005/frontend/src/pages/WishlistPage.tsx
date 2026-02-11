import React from 'react';
import { useWishlist } from '@/context/WishlistContext';
import { WishlistItem } from '@/components/wishlist/WishlistItem';
import { EmptyWishlist } from '@/components/wishlist/EmptyWishlist';
import { formatPrice } from '@/utils/wishlistUtils';
import { Loader2, Trash2, ShoppingBag } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const WishlistPage: React.FC = () => {
    const {
        wishlist,
        removeFromWishlist,
        moveToCart,
        clearWishlist,
        isEmpty,
        itemCount,
    } = useWishlist();

    const handleRemove = async (wishlistItemId: string) => {
        await removeFromWishlist(wishlistItemId);
    };

    const handleMoveToCart = async (wishlistItemId: string) => {
        await moveToCart(wishlistItemId);
    };

    const handleClearAll = async () => {
        if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
            await clearWishlist();
        }
    };

    const handleMoveAllToCart = async () => {
        // Move all items to cart
        for (const item of wishlist.items) {
            await moveToCart(item.wishlist_item_id);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#FDFBF7] to-[#F5F0E8]">
            <Navbar />

            <main className="flex-1 pt-20 sm:pt-24 pb-24 sm:pb-16">
                <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    {/* Header - Mobile Responsive */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
                        <div>
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                                My Wishlist
                                {itemCount > 0 && (
                                    <span className="ml-2 sm:ml-3 text-base sm:text-lg font-normal text-gray-500">
                                        ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                                    </span>
                                )}
                            </h1>
                            {!isEmpty && (
                                <p className="text-sm text-gray-500 mt-1">
                                    Total value: {formatPrice(wishlist.summary.total_value_cents, wishlist.summary.currency)}
                                </p>
                            )}
                        </div>

                        {/* Desktop Action Buttons */}
                        {!isEmpty && (
                            <div className="hidden sm:flex items-center gap-3">
                                <button
                                    onClick={handleMoveAllToCart}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#D4AF37] bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 transition-colors"
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    Move All to Cart
                                </button>
                                <button
                                    onClick={handleClearAll}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear All
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Loading State */}
                    {wishlist.isLoading && isEmpty && (
                        <div className="flex items-center justify-center py-16 sm:py-24">
                            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                        </div>
                    )}

                    {/* Empty State */}
                    {!wishlist.isLoading && isEmpty && <EmptyWishlist />}

                    {/* Wishlist Grid - Responsive */}
                    {!isEmpty && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                            {wishlist.items.map((item) => (
                                <WishlistItem
                                    key={item.wishlist_item_id}
                                    item={item}
                                    onRemove={handleRemove}
                                    onMoveToCart={handleMoveToCart}
                                    isLoading={wishlist.isLoading}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Mobile Sticky Action Bar */}
            {!isEmpty && (
                <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-40 shadow-lg">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleClearAll}
                            className="flex items-center justify-center p-3 text-red-600 bg-red-50 rounded-lg border border-red-200"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleMoveAllToCart}
                            className="flex-1 flex items-center justify-center gap-2 py-3 text-white font-semibold uppercase tracking-wide text-sm rounded-lg bg-[#D4AF37] hover:bg-[#C5A028] transition-colors"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            Move All to Cart
                        </button>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default WishlistPage;
