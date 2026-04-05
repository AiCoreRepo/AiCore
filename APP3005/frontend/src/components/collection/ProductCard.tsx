import { Heart, Star, Eye, MessageCircle, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { CommentsModal } from "./CommentsModal";
// import { ProductDetailsModal } from "./ProductDetailsModal";
import { likeProduct, getProductLikes } from "../../lib/api";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

interface ProductCardProps {
    product: {
        product_id: string;
        title: string;
        thumbnail: string | null;
        images?: Array<{
            url: string;
            is_primary: boolean;
            order_index: number;
        }>;
        price_cents: number;
        currency: string;
        is_featured: boolean;
        likes: number;
        reviews: number;
        views: number;
        description?: string;
        creator: {
            creator_id: string;
            store_name: string;
            store_slug: string;
            verified: boolean;
        };
    };
    onTryOn?: () => void;
    onTryOnGemini?: () => void;
    primaryTryOnLabel?: string;
    secondaryTryOnLabel?: string;
}

import { useNavigate } from "react-router-dom";

export const ProductCard = ({
    product,
    onTryOn,
    onTryOnGemini,
    primaryTryOnLabel,
    secondaryTryOnLabel,
}: ProductCardProps) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const [showComments, setShowComments] = useState(false);
    // const [showDetails, setShowDetails] = useState(false); // Removed modal state
    // const [isLiked, setIsLiked] = useState(false); // Replaced by wishlist
    const [likesCount, setLikesCount] = useState(product.likes);
    const [commentsCount, setCommentsCount] = useState(product.reviews);
    const [isWishlistToggling, setIsWishlistToggling] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    const isInWishlistState = isInWishlist(product.product_id);

    // Prepare images array (use images if available, fallback to thumbnail)
    const productImages = product.images && product.images.length > 0
        ? product.images
        : (product.thumbnail ? [{ url: product.thumbnail, is_primary: true, order_index: 0 }] : []);

    // Likes status fetching removed as we are using Wishlist now
    // If you still need to fetch public likes count, keep that part, but 'isLiked' logic is now 'isInWishlist'

    const handleWishlistToggle = async (e: React.MouseEvent) => {
        if (isWishlistToggling) return;

        setIsWishlistToggling(true);
        try {
            await toggleWishlist(product.product_id);
            // Optional: You could update likes count here if you want wishlist add to count as a like
        } catch (err) {
            console.error('Failed to toggle wishlist:', err);
        } finally {
            setIsWishlistToggling(false);
        }
    };

    const handleCommentClick = (e: React.MouseEvent) => {
        setShowComments(true);
    };

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isAddingToCart) return;

        setIsAddingToCart(true);
        try {
            await addToCart({
                product_id: product.product_id,
                title: product.title,
                thumbnail: product.thumbnail,
                price_cents: product.price_cents,
                currency: product.currency,
                quantity: 1,
                creator: product.creator,
            });
        } catch (error) {
            console.error('Error adding to cart:', error);
        } finally {
            setIsAddingToCart(false);
        }
    };

    const formatPrice = (priceCents: number, currency: string) => {
        const price = priceCents / 100;
        if (currency === "INR") {
            return `₹${price.toLocaleString('en-IN')}`;
        }
        return `$${price.toFixed(2)}`;
    };

    // Calculate average rating (mock - you can replace with real data)
    const averageRating = 4.5;
    const resolvedPrimaryTryOnLabel =
        primaryTryOnLabel ?? (onTryOnGemini ? 'Vertex Try On' : 'Try On');
    const resolvedSecondaryTryOnLabel = secondaryTryOnLabel ?? 'Gemini Try On';

    return (
        <>
            <div
                id={`product-card-${product.product_id}`}
                className="group min-w-0 cursor-pointer"
                onClick={() => navigate(`/product/${product.product_id}`)}
            >
                <div
                    className="relative mb-3 flex h-full flex-col overflow-hidden rounded-xl transition-all duration-500 md:hover:-translate-y-2"
                    style={{
                        background: '#FFFFFF',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)';
                    }}
                >
                    {/* Wishlist Heart Icon */}
                    <button
                        className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                        style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleWishlistToggle(e);
                        }}
                        disabled={isWishlistToggling}
                        aria-label={isInWishlistState ? "Remove from wishlist" : "Add to wishlist"}
                    >
                        <Heart
                            className={`w-4 h-4 transition-all duration-300 ${isInWishlistState ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-400'}`}
                            strokeWidth={2}
                        />
                    </button>

                    {/* Product Image Carousel */}
                    <div className="relative overflow-hidden group/images">
                        <img
                            src={productImages[currentImageIndex]?.url || 'https://via.placeholder.com/400x500/F5F0E6/D4AF37?text=No+Image'}
                            alt={product.title}
                            loading="lazy"
                            width={400}
                            height={500}
                            className="h-[240px] w-full object-cover transition-transform duration-700 min-[420px]:h-[270px] sm:h-[320px] md:group-hover:scale-110"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://via.placeholder.com/400x500/F5F0E6/D4AF37?text=Image+Not+Found';
                            }}
                        />

                        {/* Image Navigation Dots */}
                        {productImages.length > 1 && (
                            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                                {productImages.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentImageIndex(index);
                                        }}
                                        className={`transition-all duration-300 rounded-full ${index === currentImageIndex
                                            ? 'bg-white w-6 h-1.5'
                                            : 'bg-white/50 hover:bg-white/75 w-1.5 h-1.5'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Previous/Next Arrows - Always visible when multiple images */}
                        {productImages.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentImageIndex((prev) =>
                                            prev === 0 ? productImages.length - 1 : prev - 1
                                        );
                                    }}
                                    className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-md transition-all z-10 hover:bg-white md:h-6 md:w-6 md:opacity-60 md:group-hover/images:h-8 md:group-hover/images:w-8 md:group-hover/images:opacity-100"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5 text-gray-800 transition-all md:h-3 md:w-3 md:group-hover/images:h-4 md:group-hover/images:w-4" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentImageIndex((prev) =>
                                            prev === productImages.length - 1 ? 0 : prev + 1
                                        );
                                    }}
                                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-md transition-all z-10 hover:bg-white md:h-6 md:w-6 md:opacity-60 md:group-hover/images:h-8 md:group-hover/images:w-8 md:group-hover/images:opacity-100"
                                >
                                    <ChevronRight className="h-3.5 w-3.5 text-gray-800 transition-all md:h-3 md:w-3 md:group-hover/images:h-4 md:group-hover/images:w-4" />
                                </button>
                            </>
                        )}

                        {/* Hover Overlay with Action Buttons */}
                        <div className="absolute inset-0 hidden items-end justify-center bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 opacity-0 transition-all duration-300 md:flex md:group-hover:opacity-100">
                            <div className="w-full flex flex-col gap-2">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={isAddingToCart}
                                    className="w-full px-4 py-2.5 rounded-lg font-medium text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 transform translate-y-0 md:translate-y-4 md:group-hover:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    style={{
                                        background: '#FFFFFF',
                                        color: '#1a1a1a',
                                        boxShadow: '0 4px 16px rgba(255, 255, 255, 0.3)',
                                    }}
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                                </button>
                                <div
                                    className={`grid gap-2 ${onTryOnGemini ? 'grid-cols-2' : 'grid-cols-1'}`}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onTryOn) onTryOn();
                                        }}
                                        className="px-4 py-2.5 rounded-lg font-medium text-[10px] uppercase tracking-wider transition-all duration-300 hover:scale-105 transform translate-y-0 md:translate-y-4 md:group-hover:translate-y-0"
                                        style={{
                                            background: 'linear-gradient(135deg, #D4AF37 0%, #C9A55C 100%)',
                                            color: '#1a1a1a',
                                            boxShadow: '0 4px 16px rgba(212, 175, 55, 0.5)',
                                        }}
                                    >
                                        {resolvedPrimaryTryOnLabel}
                                    </button>
                                    {onTryOnGemini && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onTryOnGemini();
                                            }}
                                            className="px-4 py-2.5 rounded-lg font-medium text-[10px] uppercase tracking-wider transition-all duration-300 hover:scale-105 transform translate-y-0 md:translate-y-4 md:group-hover:translate-y-0"
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.9)',
                                                color: '#1a1a1a',
                                                boxShadow: '0 4px 16px rgba(255, 255, 255, 0.3)',
                                                border: '1px solid rgba(212, 175, 55, 0.6)',
                                            }}
                                        >
                                            {resolvedSecondaryTryOnLabel}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Featured Badge */}
                    {product.is_featured && (
                        <div className="absolute top-3 left-3">
                            <div
                                className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                                style={{
                                    background: 'linear-gradient(135deg, #D4AF37 0%, #C9A55C 100%)',
                                    color: '#1a1a1a',
                                }}
                            >
                                Featured
                            </div>
                        </div>
                    )}

                    {/* Product Info Section */}
                    <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                        {/* Title */}
                        <h3
                            className="font-medium text-sm mb-2 line-clamp-2"
                            style={{ color: '#2C2C2C' }}
                        >
                            {product.title}
                        </h3>

                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className="w-3.5 h-3.5"
                                    style={{
                                        color: i < Math.floor(averageRating) ? '#D4AF37' : '#E5E5E5',
                                        fill: i < Math.floor(averageRating) ? '#D4AF37' : '#E5E5E5'
                                    }}
                                />
                            ))}
                            <span className="text-xs text-gray-500 ml-1">
                                ({commentsCount})
                            </span>
                        </div>

                        {/* Price */}
                        <p
                            className="text-lg font-semibold mb-3"
                            style={{ color: '#D4AF37' }}
                        >
                            {formatPrice(product.price_cents, product.currency)}
                        </p>

                        <div className="mb-3 grid grid-cols-2 gap-2.5 md:hidden">
                            <button
                                onClick={handleAddToCart}
                                disabled={isAddingToCart}
                                className="flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                style={{
                                    background: '#1f1f1f',
                                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
                                }}
                            >
                                <ShoppingCart className="h-4 w-4" />
                                {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onTryOn) onTryOn();
                                }}
                                className="min-h-[2.75rem] rounded-xl px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition active:scale-[0.98]"
                                style={{
                                    background:
                                        'linear-gradient(135deg, #D4AF37 0%, #C9A55C 100%)',
                                    color: '#1a1a1a',
                                    boxShadow: '0 8px 20px rgba(212, 175, 55, 0.28)',
                                }}
                            >
                                {resolvedPrimaryTryOnLabel}
                            </button>
                            {onTryOnGemini && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onTryOnGemini();
                                    }}
                                    className="col-span-2 min-h-[2.75rem] rounded-xl border px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition active:scale-[0.98]"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        color: '#1a1a1a',
                                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.06)',
                                        borderColor: 'rgba(212, 175, 55, 0.45)',
                                    }}
                                >
                                    {resolvedSecondaryTryOnLabel}
                                </button>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                                <Heart className="w-3.5 h-3.5" />
                                <span>{likesCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                <span>{product.views}</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCommentClick(e);
                                }}
                                className="flex items-center gap-1 hover:text-gray-700 transition-colors px-2 py-1 -mx-2 -my-1"
                            >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>{commentsCount}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Creator Info */}
                <div className="text-center text-xs text-gray-600">
                    by <span className="font-medium">{product.creator.store_name}</span>
                    {product.creator.verified && (
                        <span className="ml-1" style={{ color: '#D4AF37' }}>✓</span>
                    )}
                </div>
            </div>

            {/* Product Details Modal Removed - Now navigating to new page */}
            {/* <ProductDetailsModal
                isOpen={showDetails}
                onClose={() => setShowDetails(false)}
                product={product}
                onTryOn={onTryOn}
            /> */}

            {/* Comments Modal */}
            <CommentsModal
                productId={product.product_id}
                productTitle={product.title}
                isOpen={showComments}
                onClose={() => setShowComments(false)}
                onCommentCountChange={setCommentsCount}
            />
        </>
    );
};
