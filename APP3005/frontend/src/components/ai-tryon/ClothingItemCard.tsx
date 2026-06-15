import { Sparkles, Zap } from 'lucide-react';
import { useState } from 'react';
import { ProductDetailsModal } from '@/components/collection/ProductDetailsModal';
import { getProductImageUrl } from '@/lib/product-image';

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
    onTryOnGemini?: () => void;
    loading?: boolean;
    primaryTryOnLabel?: string;
    secondaryTryOnLabel?: string;
}

export function ClothingItemCard({
    product,
    onTryOn,
    onTryOnGemini,
    loading = false,
    primaryTryOnLabel,
    secondaryTryOnLabel,
}: ClothingItemCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const imageUrl = getProductImageUrl(product);

    const price = (product.price_cents / 100).toFixed(2);
    const resolvedPrimaryTryOnLabel =
        primaryTryOnLabel ?? (onTryOnGemini ? 'Vertex Try On' : 'Try On');
    const resolvedSecondaryTryOnLabel = secondaryTryOnLabel ?? 'Gemini Try On';
    const processingButtonLabel = 'View Progress';

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
                        <div
                            className={`grid gap-2 ${onTryOnGemini ? 'grid-cols-2' : 'grid-cols-1'}`}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTryOn();
                                }}
                                disabled={loading}
                                className="py-2 px-3 rounded-lg font-semibold text-[9.5px] tracking-[0.2em] uppercase transition-all duration-300 hover:shadow-gold/30 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                                style={{
                                    background: 'linear-gradient(135deg, #C7A238 0%, #B38C2E 100%)',
                                    color: '#0f0f0f',
                                    boxShadow: '0 6px 14px rgba(179, 140, 46, 0.25)',
                                }}
                            >
                                <Zap className="w-3 h-3 fill-[#0f0f0f]" />
                                {loading ? processingButtonLabel : resolvedPrimaryTryOnLabel}
                            </button>
                            {onTryOnGemini && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onTryOnGemini();
                                    }}
                                    disabled={loading}
                                    className="py-2 px-3 rounded-lg font-semibold text-[9.5px] tracking-[0.2em] uppercase transition-all duration-300 hover:shadow-gold/20 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                                    style={{
                                        background: 'rgba(18, 18, 18, 0.92)',
                                        color: '#f5f5f5',
                                        boxShadow: '0 6px 14px rgba(0, 0, 0, 0.3)',
                                        border: '1px solid rgba(212, 175, 55, 0.45)',
                                    }}
                                >
                                    <Sparkles className="w-3 h-3 text-luxury-gold" />
                                    {loading ? processingButtonLabel : resolvedSecondaryTryOnLabel}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Loading Overlay */}
                {loading && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onTryOn();
                        }}
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
                            <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
                                Tap to reopen progress
                            </p>
                        </div>
                    </button>
                )}
            </div>

            <ProductDetailsModal
                isOpen={showDetails}
                onClose={() => setShowDetails(false)}
                product={product}
                onTryOn={onTryOn}
                onTryOnGemini={onTryOnGemini}
                loading={loading}
                primaryTryOnLabel={resolvedPrimaryTryOnLabel}
                secondaryTryOnLabel={resolvedSecondaryTryOnLabel}
            />
        </>
    );
}
