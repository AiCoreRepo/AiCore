import { Heart, Star, Eye, MessageCircle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { CommentsModal } from "./CommentsModal";
import { likeProduct, getProductLikes } from "../../lib/api";

interface ProductCardProps {
    product: {
        product_id: string;
        title: string;
        thumbnail: string | null;
        price_cents: number;
        currency: string;
        is_featured: boolean;
        likes: number;
        reviews: number;
        views: number;
        description?: string;
        creator: {
            store_name: string;
            verified: boolean;
        };
    };
    onTryOn?: () => void;
}

export const ProductCard = ({ product, onTryOn }: ProductCardProps) => {
    const [showDetails, setShowDetails] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(product.likes);
    const [isLiking, setIsLiking] = useState(false);

    // Fetch like status on mount
    useEffect(() => {
        const fetchLikeStatus = async () => {
            try {
                const data = await getProductLikes(product.product_id);
                setIsLiked(data.isLikedByUser);
                setLikesCount(data.likesCount);
            } catch (err) {
                // User not logged in or error - use default values
                console.error('Error fetching like status:', err);
            }
        };
        fetchLikeStatus();
    }, [product.product_id]);

    const handleLike = async (e: React.MouseEvent) => {
        if (isLiking) return;

        setIsLiking(true);
        try {
            const result = await likeProduct(product.product_id);
            setIsLiked(result.liked);
            setLikesCount(prev => result.liked ? prev + 1 : prev - 1);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to like product');
        } finally {
            setIsLiking(false);
        }
    };

    const handleCommentClick = (e: React.MouseEvent) => {
        setShowComments(true);
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

    return (
        <>
            <div
                className="group cursor-pointer"
                onClick={() => setShowDetails(true)}
            >
                <div
                    className="relative overflow-hidden rounded-xl mb-3 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
                    style={{
                        background: '#FFFFFF',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
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
                            handleLike(e);
                        }}
                        disabled={isLiking}
                    >
                        <Heart
                            className={`w-4 h-4 transition-colors ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-400'}`}
                            strokeWidth={2}
                        />
                    </button>

                    {/* Product Image */}
                    <div className="relative overflow-hidden">
                        <img
                            src={product.thumbnail || 'https://via.placeholder.com/400x500?text=No+Image'}
                            alt={product.title}
                            className="w-full h-[320px] object-cover transition-transform duration-700 group-hover:scale-110"
                        />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onTryOn) onTryOn();
                                }}
                                className="px-6 py-2.5 rounded-lg font-medium text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105"
                                style={{
                                    background: 'linear-gradient(135deg, #D4AF37 0%, #C9A55C 100%)',
                                    color: '#1a1a1a',
                                    boxShadow: '0 4px 16px rgba(212, 175, 55, 0.4)',
                                }}
                            >
                                Try on with AI
                            </button>
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
                    <div className="p-4">
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
                                ({product.reviews})
                            </span>
                        </div>

                        {/* Price */}
                        <p
                            className="text-lg font-semibold mb-3"
                            style={{ color: '#D4AF37' }}
                        >
                            {formatPrice(product.price_cents, product.currency)}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
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
                                <span>{product.reviews}</span>
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

            {/* Product Details Modal */}
            {showDetails && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0, 0, 0, 0.8)' }}
                    onClick={() => setShowDetails(false)}
                >
                    <div
                        className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl"
                        style={{ background: '#FFFFFF' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setShowDetails(false)}
                            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                            style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.2)',
                            }}
                        >
                            <X className="w-5 h-5" style={{ color: '#2C2C2C' }} />
                        </button>

                        <div className="grid md:grid-cols-2 gap-8 p-8">
                            {/* Image Section */}
                            <div>
                                <img
                                    src={product.thumbnail || 'https://via.placeholder.com/600x800?text=No+Image'}
                                    alt={product.title}
                                    className="w-full rounded-xl object-cover"
                                    style={{ maxHeight: '600px' }}
                                />
                            </div>

                            {/* Details Section */}
                            <div>
                                {/* Featured Badge */}
                                {product.is_featured && (
                                    <div className="inline-block mb-4">
                                        <div
                                            className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider"
                                            style={{
                                                background: 'linear-gradient(135deg, #D4AF37 0%, #C9A55C 100%)',
                                                color: '#1a1a1a',
                                            }}
                                        >
                                            Featured
                                        </div>
                                    </div>
                                )}

                                {/* Title */}
                                <h2
                                    className="text-3xl font-serif mb-4"
                                    style={{ color: '#2C2C2C' }}
                                >
                                    {product.title}
                                </h2>

                                {/* Creator */}
                                <p className="text-sm text-gray-600 mb-4">
                                    by <span className="font-medium">{product.creator.store_name}</span>
                                    {product.creator.verified && (
                                        <span className="ml-1" style={{ color: '#D4AF37' }}>✓ Verified</span>
                                    )}
                                </p>

                                {/* Rating */}
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className="w-5 h-5"
                                                style={{
                                                    color: i < Math.floor(averageRating) ? '#D4AF37' : '#E5E5E5',
                                                    fill: i < Math.floor(averageRating) ? '#D4AF37' : '#E5E5E5'
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm text-gray-600">
                                        {averageRating} ({product.reviews} reviews)
                                    </span>
                                </div>

                                {/* Price */}
                                <p
                                    className="text-4xl font-bold mb-6"
                                    style={{ color: '#D4AF37' }}
                                >
                                    {formatPrice(product.price_cents, product.currency)}
                                </p>

                                {/* Description */}
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: '#2C2C2C' }}>
                                        Description
                                    </h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        {product.description || "Experience luxury and elegance with this premium piece from our curated collection. Crafted with attention to detail and designed for the confident individual."}
                                    </p>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 mb-6 p-4 rounded-xl" style={{ background: '#F8F4EC' }}>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center mb-1">
                                            <Heart className="w-5 h-5" style={{ color: '#D4AF37' }} />
                                        </div>
                                        <p className="text-lg font-semibold" style={{ color: '#2C2C2C' }}>{likesCount}</p>
                                        <p className="text-xs text-gray-600">Likes</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center mb-1">
                                            <Eye className="w-5 h-5" style={{ color: '#D4AF37' }} />
                                        </div>
                                        <p className="text-lg font-semibold" style={{ color: '#2C2C2C' }}>{product.views}</p>
                                        <p className="text-xs text-gray-600">Views</p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCommentClick(e);
                                        }}
                                        className="text-center hover:bg-white/50 rounded-lg transition-colors p-2 -m-2"
                                    >
                                        <div className="flex items-center justify-center mb-1">
                                            <MessageCircle className="w-5 h-5" style={{ color: '#D4AF37' }} />
                                        </div>
                                        <p className="text-lg font-semibold" style={{ color: '#2C2C2C' }}>{product.reviews}</p>
                                        <p className="text-xs text-gray-600">Reviews</p>
                                    </button>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            if (onTryOn) onTryOn();
                                            setShowDetails(false);
                                        }}
                                        className="flex-1 px-6 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105"
                                        style={{
                                            background: 'linear-gradient(135deg, #D4AF37 0%, #C9A55C 100%)',
                                            color: '#1a1a1a',
                                            boxShadow: '0 4px 16px rgba(212, 175, 55, 0.4)',
                                        }}
                                    >
                                        Try on with AI
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLike(e);
                                        }}
                                        disabled={isLiking}
                                        className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50"
                                        style={{
                                            background: isLiked ? 'linear-gradient(135deg, #D4AF37 0%, #C9A55C 100%)' : '#F8F4EC',
                                        }}
                                    >
                                        <Heart
                                            className={`w-6 h-6 ${isLiked ? 'text-white fill-white' : 'text-gray-600'}`}
                                            strokeWidth={2}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Comments Modal */}
            <CommentsModal
                productId={product.product_id}
                productTitle={product.title}
                isOpen={showComments}
                onClose={() => setShowComments(false)}
            />
        </>
    );
};
