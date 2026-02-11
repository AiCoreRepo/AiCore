import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, ChevronLeft, ChevronRight, Star, Share2, Heart, ShoppingBag, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { getProductById, getProductLikes, getProductComments } from "@/lib/api";
import { CommentsModal } from "@/components/collection/CommentsModal";
import { SizeChartModal } from "@/components/SizeChartModal";
import { getSizeChart, getAvailableSizes } from "@/constants/sizeChart";

interface Comment {
    comment_id: string;
    comment_text: string;
    image_urls?: string[];
    created_at: string;
    user: {
        user_id: string;
        email: string;
    };
}

interface Product {
    product_id: string;
    title: string;
    description?: string;
    price_cents: number;
    currency: string;
    thumbnail: string | null;
    images?: Array<{
        url: string;
        is_primary: boolean;
        order_index: number;
    }>;
    category: string;
    is_featured: boolean;
    likes: number;
    reviews: number;
    views: number;
    creator: {
        creator_id: string;
        store_name: string;
        store_slug: string;
        verified: boolean;
    };
    metadata?: any;
}

const ProductDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showComments, setShowComments] = useState(false);
    const [showSizeChart, setShowSizeChart] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    const [commentsCount, setCommentsCount] = useState(0);
    const [comments, setComments] = useState<Comment[]>([]);
    const [likesCount, setLikesCount] = useState(0);
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [pincode, setPincode] = useState('');

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await getProductById(id);
                setProduct(data);

                try {
                    const commentsData = await getProductComments(id);
                    setComments(commentsData);
                    setCommentsCount(commentsData.length);
                } catch (e) {
                    console.error("Failed to fetch comments", e);
                }

                try {
                    const likesData = await getProductLikes(id);
                    setLikesCount(likesData.likesCount);
                } catch (e) {
                    setLikesCount(data.likes || 0);
                }
            } catch (err) {
                console.error("Failed to fetch product:", err);
                setError("Failed to load product details.");
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const { user } = useAuth();

    const handleWishlistToggle = async () => {
        if (!product) return;

        if (!user) {
            toast({
                title: "Login Required",
                description: "Please login to add items to your wishlist.",
                variant: "destructive",
            });
            // Optional: redirect to login
            navigate('/login', { state: { returnUrl: location.pathname } });
            return;
        }

        try {
            await toggleWishlist(product.product_id);
        } catch (err: any) {
            console.error('Wishlist toggle error:', err);
            // Error is already handled by WishlistContext
        }
    };

    const handleAddToCart = async () => {
        if (!product) return;
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
            toast({
                title: "Added to Cart",
                description: `${product.title} has been added to your cart.`,
            });
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to add product to cart.",
            });
        }
    };

    const formatPrice = (priceCents: number, currency: string) => {
        const price = priceCents / 100;
        if (currency === "INR") {
            return `₹${price.toLocaleString('en-IN')}`;
        }
        return `$${price.toFixed(2)}`;
    };

    const calculateAverageRating = () => {
        if (comments.length === 0) return 0;
        return 4.5;
    };

    const openImageModal = (index: number) => {
        setModalImageIndex(index);
        setShowImageModal(true);
    };

    const nextImage = () => {
        if (!product) return;
        const images = product.images || [];
        setModalImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        if (!product) return;
        const images = product.images || [];
        setModalImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#D4AF37] border-t-transparent"></div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
                <p className="text-xl text-red-500">{error || "Product not found"}</p>
                <button
                    onClick={() => navigate('/collection')}
                    className="px-6 py-3 bg-[#D4AF37] text-white rounded hover:bg-[#C9A55C] transition-colors"
                >
                    Back to Collection
                </button>
            </div>
        );
    }

    const productImages = product.images && product.images.length > 0
        ? product.images
        : (product.thumbnail ? [{ url: product.thumbnail, is_primary: true, order_index: 0 }] : []);

    const isInWishlistState = isInWishlist(product.product_id);
    const averageRating = calculateAverageRating();
    const sizeChart = getSizeChart(product.category);
    const availableSizes = product.metadata?.sizes ? product.metadata.sizes.split(',').map((s: string) => s.trim()) : getAvailableSizes(product.category);

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pt-20 pb-6">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <button onClick={() => navigate('/')} className="hover:text-gray-900">Home</button>
                    <span>/</span>
                    <button onClick={() => navigate('/collection')} className="hover:text-gray-900">Collection</button>
                    <span>/</span>
                    <span className="text-gray-900">{product.category || 'Product'}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {/* Left: Image Gallery */}
                    <div>
                        <div className="sticky top-20">
                            <div className="grid grid-cols-2 gap-1.5">
                                {productImages.slice(0, 4).map((img, index) => (
                                    <div key={index} className="aspect-[3/4] overflow-hidden rounded-sm cursor-pointer shadow-sm hover:shadow-md transition-shadow">
                                        <img
                                            src={img.url}
                                            alt={`${product.title} ${index + 1}`}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                            onClick={() => openImageModal(index)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Product Details */}
                    <div className="space-y-4">
                        {/* Creator Name */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-gray-900">{product.creator.store_name}</h2>
                                {product.creator.verified && (
                                    <span className="text-blue-500 text-sm">✓ Verified</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleWishlistToggle}
                                    className="p-2 border border-gray-300 rounded hover:border-gray-400 transition-colors"
                                    aria-label="Add to wishlist"
                                >
                                    <Heart className={`w-5 h-5 ${isInWishlistState ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-600'}`} />
                                </button>
                                <button className="p-2 border border-gray-300 rounded hover:border-gray-400 transition-colors">
                                    <Share2 className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        {/* Product Title */}
                        <h1 className="text-xl font-normal text-gray-900 leading-snug">
                            {product.title}
                        </h1>

                        {/* Rating */}
                        <div className="flex items-center gap-3 text-sm pb-3 border-b">
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded">
                                <span className="font-semibold">{averageRating.toFixed(1)}</span>
                                <Star className="w-3 h-3 fill-current" />
                            </div>
                            <span className="text-gray-600">
                                {commentsCount} Ratings
                            </span>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-3 pb-3 border-b">
                            <span className="text-2xl font-bold text-gray-900">
                                {formatPrice(product.price_cents, product.currency)}
                            </span>
                            <span className="text-sm text-green-600 font-medium">
                                inclusive of all taxes
                            </span>
                        </div>

                        {/* Size Selection */}
                        {availableSizes.length > 0 && (
                            <div className="pb-3 border-b">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase">
                                        Select Size
                                    </h3>
                                    <button
                                        onClick={() => setShowSizeChart(true)}
                                        className="text-sm text-[#D4AF37] font-semibold hover:text-[#C9A55C]"
                                    >
                                        SIZE CHART →
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {availableSizes.map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`w-12 h-12 rounded-full border-2 font-medium text-sm transition-all ${selectedSize === size
                                                ? 'border-[#D4AF37] bg-[#FEF9F0] text-[#D4AF37]'
                                                : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleAddToCart}
                                className="flex-1 bg-[#D4AF37] text-white py-3 px-6 rounded font-semibold hover:bg-[#C9A55C] transition-colors flex items-center justify-center gap-2"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                ADD TO BAG
                            </button>
                            <button
                                onClick={handleWishlistToggle}
                                className={`px-6 py-3 rounded font-semibold border-2 transition-colors ${isInWishlistState
                                    ? 'border-[#D4AF37] text-[#D4AF37] bg-[#FEF9F0]'
                                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                    }`}
                            >
                                WISHLIST
                            </button>
                        </div>

                        {/* Delivery Options */}
                        <div className="pt-3 border-t">
                            <div className="flex items-center gap-2 mb-2">
                                <Truck className="w-5 h-5 text-gray-600" />
                                <h3 className="text-sm font-semibold text-gray-900 uppercase">
                                    Delivery Options
                                </h3>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter PIN code"
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#D4AF37]"
                                    maxLength={6}
                                />
                                <button className="px-4 py-2 border border-[#D4AF37] text-[#D4AF37] rounded font-medium hover:bg-[#FEF9F0] transition-colors">
                                    Check
                                </button>
                            </div>
                        </div>

                        {/* Product Details */}
                        <div className="pt-3 border-t space-y-2">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase">
                                Product Details
                            </h3>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>{product.description || "Premium quality product with excellent craftsmanship."}</p>
                                {product.metadata?.material && (
                                    <p><span className="font-medium">Material:</span> {product.metadata.material}</p>
                                )}
                                {product.metadata?.color && (
                                    <p><span className="font-medium">Color:</span> {product.metadata.color}</p>
                                )}
                            </div>
                        </div>

                        {/* Features */}
                        <div className="pt-3 border-t space-y-3">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">100% Authentic</p>
                                    <p className="text-xs text-gray-600">Verified by Aivestire</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <RotateCcw className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Easy 7-day Return & Exchange</p>
                                    <p className="text-xs text-gray-600">Free & hassle-free returns</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="mt-10 border-t pt-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">
                            Ratings & Reviews
                        </h2>
                        <button
                            onClick={() => setShowComments(true)}
                            className="px-4 py-2 border border-[#D4AF37] text-[#D4AF37] rounded font-medium hover:bg-[#FEF9F0] transition-colors"
                        >
                            Write a Review
                        </button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Rating Summary */}
                        <div className="md:col-span-1">
                            <div className="flex items-end gap-3 mb-4">
                                <div className="text-4xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
                                <div className="pb-1">
                                    <Star className="w-5 h-5 fill-green-600 text-green-600 inline-block" />
                                    <p className="text-sm text-gray-600 mt-1">{commentsCount} Ratings</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {[5, 4, 3, 2, 1].map((stars) => (
                                    <div key={stars} className="flex items-center gap-2">
                                        <span className="text-sm w-2">{stars}</span>
                                        <Star className="w-3 h-3 fill-gray-300 text-gray-300" />
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-600"
                                                style={{ width: `${Math.random() * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Reviews List */}
                        <div className="md:col-span-2 space-y-4">
                            {comments.length > 0 ? (
                                comments.map((comment) => (
                                    <div key={comment.comment_id} className="border-b pb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                                                5 <Star className="w-3 h-3 fill-current" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">
                                                {comment.user.email.split('@')[0]}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 mb-2">{comment.comment_text}</p>
                                        {comment.image_urls && comment.image_urls.length > 0 && (
                                            <div className="flex gap-2">
                                                {comment.image_urls.map((url, i) => (
                                                    <img
                                                        key={i}
                                                        src={url}
                                                        alt="Review"
                                                        className="w-16 h-16 object-cover rounded"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-500 mt-2">
                                            {new Date(comment.created_at).toLocaleDateString('en-US', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 mb-3">No reviews yet</p>
                                    <button
                                        onClick={() => setShowComments(true)}
                                        className="text-[#D4AF37] font-semibold hover:text-[#C9A55C]"
                                    >
                                        Be the first to review
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Modal */}
            {showImageModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
                    <button
                        onClick={() => setShowImageModal(false)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="w-10 h-10" />
                    </button>

                    <div className="max-w-4xl max-h-[90vh] flex items-center justify-center">
                        <img
                            src={productImages[modalImageIndex]?.url}
                            alt={`${product.title} - Full view`}
                            className="max-w-full max-h-[90vh] object-contain"
                        />
                    </div>

                    <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
                        aria-label="Next image"
                    >
                        <ChevronRight className="w-10 h-10" />
                    </button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                        {modalImageIndex + 1} / {productImages.length}
                    </div>
                </div>
            )}

            <CommentsModal
                productId={product.product_id}
                productTitle={product.title}
                isOpen={showComments}
                onClose={() => setShowComments(false)}
                onCommentCountChange={setCommentsCount}
            />

            <SizeChartModal
                isOpen={showSizeChart}
                onClose={() => setShowSizeChart(false)}
                sizeChart={sizeChart}
            />
        </div>
    );
};

export default ProductDetailsPage;
