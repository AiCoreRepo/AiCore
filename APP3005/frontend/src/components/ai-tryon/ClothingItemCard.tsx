import { Sparkles, Zap } from 'lucide-react';
import { useState } from 'react';

interface Product {
    product_id: string;
    title: string;
    description?: string;
    price_cents: number;
    currency: string;
    thumbnail: string | null;
    images?: Array<{ url: string; is_primary: boolean }>;
    creator: {
        store_name: string;
    };
}

interface ClothingItemCardProps {
    product: Product;
    onTryOnGemini: () => void;
    onTryOnVertex: () => void;
    loading?: boolean;
}

export function ClothingItemCard({ product, onTryOnGemini, onTryOnVertex, loading = false }: ClothingItemCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);

    // Safely get the primary image - handle both array and undefined cases
    // Get image source - API returns 'thumbnail', but we support 'images' array for forward compatibility
    // Use 'any' type cast for images to handle potential API mismatch gracefully
    const imageUrl = product.thumbnail || (product.images && product.images.length > 0 ? (product.images.find((img: any) => img.is_primary)?.url || product.images[0].url) : null);

    const price = (product.price_cents / 100).toFixed(2);

    return (
        <div
            className="clothing-item-card group"
            style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 247, 240, 0.95) 100%)',
                border: '1px solid rgba(201, 165, 92, 0.15)',
                borderRadius: '20px',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            }}
        >
            {/* Product Image */}
            <div
                className="relative overflow-hidden"
                style={{
                    aspectRatio: '3/4',
                    background: 'linear-gradient(135deg, #F5F0E6 0%, #F8F4EC 100%)',
                }}
            >
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt={product.title}
                        className={`w-full h-full object-cover transition-all duration-500 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                            }`}
                        onLoad={() => setImageLoaded(true)}
                        style={{
                            transition: 'transform 0.3s ease',
                        }}
                    />
                )}

                {/* Hover Overlay */}
                <div
                    className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
            </div>

            {/* Product Info */}
            <div className="p-4">
                {/* Title & Price */}
                <div className="mb-3">
                    <h3 className="text-sm font-semibold text-charcoal line-clamp-2 mb-1">
                        {product.title}
                    </h3>
                    <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-gold">
                            {product.currency} {price}
                        </p>
                        <p className="text-xs text-charcoal/60">
                            by {product.creator.store_name}
                        </p>
                    </div>
                </div>

                {/* Try-On Buttons */}
                <div className="space-y-2">
                    {/* Primary Button - Vertex AI (Default) */}
                    <button
                        onClick={onTryOnVertex}
                        disabled={loading}
                        className="w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(59, 130, 246, 1) 100%)',
                            color: '#FFFFFF',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                        }}
                    >
                        <Zap className="w-4 h-4" />
                        {loading ? 'Processing...' : 'AI Try-On'}
                    </button>

                    {/* Secondary Buttons Row */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={onTryOnGemini}
                            disabled={loading}
                            className="py-2 px-3 rounded-lg font-medium text-xs transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                            style={{
                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.15) 100%)',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                color: '#8B5CF6',
                            }}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Try Gemini
                        </button>

                        <button
                            onClick={onTryOnVertex}
                            disabled={loading}
                            className="py-2 px-3 rounded-lg font-medium text-xs transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                            style={{
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.15) 100%)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                color: '#3B82F6',
                            }}
                        >
                            <Zap className="w-3.5 h-3.5" />
                            Vertex
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading Overlay */}
            {loading && (
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    <div className="text-center">
                        <div
                            className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gold border-t-transparent mb-3"
                        />
                        <p className="text-sm font-medium text-charcoal">
                            Creating your try-on...
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
