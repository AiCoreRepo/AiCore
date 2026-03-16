import { Zap } from 'lucide-react';
import { useState } from 'react';
import { ProductDetailsModal } from '@/components/collection/ProductDetailsModal';

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
    onTryOn: () => void;
    loading?: boolean;
}

export function ClothingItemCard({ product, onTryOn, loading = false }: ClothingItemCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    // Safely get the primary image - handle both array and undefined cases
    // Get image source - API returns 'thumbnail', but we support 'images' array for forward compatibility
    // Use 'any' type cast for images to handle potential API mismatch gracefully
    const imageUrl = product.thumbnail || (product.images && product.images.length > 0 ? (product.images.find((img: any) => img.is_primary)?.url || product.images[0].url) : null);

    const price = (product.price_cents / 100).toFixed(2);

    return (
        <>
            <div
                className="clothing-item-card group relative flex h-full cursor-pointer flex-col"
                onClick={() => setShowDetails(true)}
                style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(212, 175, 55, 0.1)',
                    borderRadius: '22px',
                    overflow: 'hidden',
                    transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                }}
            >
                {/* Product Image */}
                <div
                    className="relative overflow-hidden shrink-0"
                    style={{
                        aspectRatio: '4/5',
                        background: '#F8F4EC',
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
                        className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    />
                </div>

                {/* Product Info */}
                <div className="flex flex-grow flex-col p-3.5 sm:p-4">
                    <div className="mb-3.5 sm:mb-4">
                        <h3 className="mb-1 line-clamp-2 text-sm font-serif text-luxury-black transition-colors group-hover:text-luxury-gold sm:line-clamp-1">
                            {product.title || 'Exquisite Design'}
                        </h3>
                        <div className="flex items-center justify-between">
                            <p className="text-base font-bold text-luxury-gold">
                                {product.currency} {price}
                            </p>
                            <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-neutral-400 sm:text-[10px] sm:tracking-widest">
                                {product.creator?.store_name || 'Aivestire'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-auto">
                        {/* Vestire Try On Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onTryOn();
                            }}
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.16em] transition-all duration-300 hover:shadow-gold/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:py-3 sm:tracking-widest"
                            style={{
                                background: '#D4AF37',
                                color: '#FFFFFF',
                                boxShadow: '0 4px 15px rgba(212, 175, 55, 0.2)',
                            }}
                        >
                            <Zap className="w-3.5 h-3.5 fill-white" />
                            <span className="sm:hidden">{loading ? 'Working...' : 'Try On'}</span>
                            <span className="hidden sm:inline">{loading ? 'Processing...' : 'Vestire Try On'}</span>
                        </button>
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
                                className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-luxury-gold border-t-transparent mb-3"
                            />
                            <p className="text-sm font-medium text-charcoal">
                                Creating your try-on...
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <ProductDetailsModal
                isOpen={showDetails}
                onClose={() => setShowDetails(false)}
                product={product}
                onTryOn={onTryOn}
            />
        </>
    );
}
