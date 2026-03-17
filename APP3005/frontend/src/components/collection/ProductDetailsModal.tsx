import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Heart, Eye, MessageCircle, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { likeProduct, getProductLikes } from "@/lib/api";
import { CommentsModal } from "./CommentsModal";

interface ProductDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: {
        product_id: string;
        title: string;
        description?: string;
        price_cents: number;
        currency: string;
        thumbnail: string | null;
        images?: Array<{
            url: string;
            is_primary: boolean;
            order_index?: number;
        }>;
        is_featured?: boolean;
        likes?: number; // Optional as AiTryOn might not have it
        reviews?: number; // Optional
        views?: number; // Optional
        creator?: {
            store_name: string;
            verified?: boolean;
        };
    };
    onTryOn?: () => void;
    onTryOnGemini?: () => void;
}

export const ProductDetailsModal = ({
    isOpen,
    onClose,
    product,
    onTryOn,
    onTryOnGemini,
}: ProductDetailsModalProps) => {
    const { toast } = useToast();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(product.likes || 0);
    const [isLiking, setIsLiking] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [commentsCount, setCommentsCount] = useState(product.reviews || 0);

    // Prepare images array
    const productImages = product.images && product.images.length > 0
        ? product.images
        : (product.thumbnail ? [{ url: product.thumbnail, is_primary: true }] : []);

    // Fetch like status when modal opens
    useEffect(() => {
        if (isOpen) {
            const fetchLikeStatus = async () => {
                try {
                    const data = await getProductLikes(product.product_id);
                    setIsLiked(data.isLikedByUser);
                    setLikesCount(data.likesCount);
                } catch (err) {
                    console.error('Error fetching like status:', err);
                }
            };
            fetchLikeStatus();
        }
    }, [isOpen, product.product_id]);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isLiking) return;

        setIsLiking(true);
        try {
            const result = await likeProduct(product.product_id);
            setIsLiked(result.liked);
            setLikesCount(prev => result.liked ? prev + 1 : prev - 1);

            toast({
                title: result.liked ? "Added to favorites!" : "Removed from favorites",
                description: result.liked ? "Product added to your liked items" : "Product removed from liked items",
                duration: 2000,
            });
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Action failed",
                description: err instanceof Error ? err.message : 'Failed to like product',
                duration: 3000,
            });
        } finally {
            setIsLiking(false);
        }
    };

    const formatPrice = (priceCents: number, currency: string) => {
        const price = priceCents / 100;
        if (currency === "INR") {
            return `₹${price.toLocaleString('en-IN')}`;
        }
        return `$${price.toFixed(2)}`;
    };

    // Calculate average rating (mock)
    const averageRating = 4.5;

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
                onClick={onClose}
            >
                <div
                    className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-white"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 bg-white/95 shadow-md"
                    >
                        <X className="w-5 h-5 text-[#2C2C2C]" />
                    </button>

                    <div className="grid md:grid-cols-2 gap-8 p-8">
                        {/* Image Gallery Section */}
                        <div className="space-y-3">
                            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl">
                                <img
                                    src={productImages[currentImageIndex]?.url || 'https://via.placeholder.com/600x800/F5F0E6/D4AF37?text=No+Image'}
                                    alt={product.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'https://via.placeholder.com/600x800/F5F0E6/D4AF37?text=Image+Not+Found';
                                    }}
                                />
                                {/* Navigation Arrows for Main Image */}
                                {productImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCurrentImageIndex((prev) =>
                                                    prev === 0 ? productImages.length - 1 : prev - 1
                                                );
                                            }}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center hover:bg-white shadow-md transition-all"
                                        >
                                            <ChevronLeft className="w-4 h-4 text-gray-800" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCurrentImageIndex((prev) =>
                                                    prev === productImages.length - 1 ? 0 : prev + 1
                                                );
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center hover:bg-white shadow-md transition-all"
                                        >
                                            <ChevronRight className="w-4 h-4 text-gray-800" />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Thumbnail Strip */}
                            {productImages.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {productImages.map((img, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex
                                                ? 'border-[#D4AF37] scale-105'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <img
                                                src={img.url || 'https://via.placeholder.com/150/F5F0E6/D4AF37?text=No+Image'}
                                                alt={`${product.title} - ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = 'https://via.placeholder.com/150/F5F0E6/D4AF37?text=No+Image';
                                                }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
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
                            <h2 className="text-3xl font-serif mb-4 text-[#2C2C2C]">
                                {product.title}
                            </h2>

                            {/* Creator */}
                            <p className="text-sm text-gray-600 mb-4">
                                by <span className="font-medium">{product.creator?.store_name}</span>
                                {product.creator?.verified && (
                                    <span className="ml-1 text-[#D4AF37]">✓ Verified</span>
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
                                    {averageRating} ({commentsCount} reviews)
                                </span>
                            </div>

                            {/* Price */}
                            <p className="text-4xl font-bold mb-6 text-[#D4AF37]">
                                {formatPrice(product.price_cents, product.currency)}
                            </p>

                            {/* Description (if available) */}
                            {product.description && (
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    {product.description}
                                </p>
                            )}


                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 mb-6 p-4 rounded-xl bg-[#F8F4EC]">
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                        <Heart className="w-5 h-5 text-[#D4AF37]" />
                                    </div>
                                    <p className="text-lg font-semibold text-[#2C2C2C]">{likesCount}</p>
                                    <p className="text-xs text-gray-600">Likes</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                        <Eye className="w-5 h-5 text-[#D4AF37]" />
                                    </div>
                                    <p className="text-lg font-semibold text-[#2C2C2C]">{product.views || 0}</p>
                                    <p className="text-xs text-gray-600">Views</p>
                                </div>
                                <button
                                    onClick={() => setShowComments(true)}
                                    className="text-center hover:bg-white/50 rounded-lg transition-colors p-2 -m-2"
                                >
                                    <div className="flex items-center justify-center mb-1">
                                        <MessageCircle className="w-5 h-5 text-[#D4AF37]" />
                                    </div>
                                    <p className="text-lg font-semibold text-[#2C2C2C]">{commentsCount}</p>
                                    <p className="text-xs text-gray-600">Reviews</p>
                                </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <div
                                    className={`flex-1 grid gap-3 ${onTryOnGemini ? 'grid-cols-2' : 'grid-cols-1'}`}
                                >
                                    <button
                                        onClick={() => {
                                            if (onTryOn) onTryOn();
                                            onClose();
                                        }}
                                        className="px-6 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-[0_4px_16px_rgba(212,175,55,0.4)]"
                                        style={{
                                            background: 'linear-gradient(135deg, #D4AF37 0%, #C9A55C 100%)',
                                            color: '#1a1a1a',
                                        }}
                                    >
                                        Vestire Try On
                                    </button>
                                    {onTryOnGemini && (
                                        <button
                                            onClick={() => {
                                                onTryOnGemini();
                                                onClose();
                                            }}
                                            className="px-6 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 border border-[#D4AF37]/60"
                                            style={{
                                                background: '#FFFFFF',
                                                color: '#1a1a1a',
                                            }}
                                        >
                                            Gemini Try On
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={handleLike}
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

            {/* Comments Modal - Reused from Collection */}
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
