import { X, Download, ZoomIn, Loader2 } from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';

interface TryOn {
    tryOnId: string;
    productId: string;
    productTitle: string;
    productImage: string | null;
    resultImage: string;
    provider: string;
    createdAt: string;
}

interface TryOnGalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    tryOns: TryOn[];
}

// Number of images to show per page
const IMAGES_PER_PAGE = 9;

/**
 * Optimize Cloudinary image URL for better performance
 * - Converts to WebP format
 * - Auto quality optimization
 * - Resizes to appropriate width for gallery
 */
function optimizeCloudinaryUrl(url: string, width: number = 400): string {
    if (!url) return url;

    // If it's a Cloudinary URL, add transformations
    if (url.includes('cloudinary.com')) {
        // Insert transformations before /upload/ or after version
        return url.replace(
            /\/upload\/(?:v\d+\/)?/,
            `/upload/f_webp,q_auto,w_${width},c_limit/`
        );
    }

    // Return original for base64 or non-Cloudinary URLs
    return url;
}

/**
 * Lazy loading image component with placeholder
 */
function LazyImage({
    src,
    alt,
    className,
    onClick,
}: {
    src: string;
    alt: string;
    className?: string;
    onClick?: () => void;
}) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Optimize URL for thumbnail
    const optimizedSrc = useMemo(() => optimizeCloudinaryUrl(src, 400), [src]);

    return (
        <div className="relative w-full h-full bg-gray-100" onClick={onClick}>
            {/* Skeleton placeholder */}
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
            )}

            {/* Error state */}
            {hasError && (
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Failed to load</span>
                </div>
            )}

            {/* Actual image with lazy loading */}
            <img
                src={optimizedSrc}
                alt={alt}
                loading="lazy"
                decoding="async"
                className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsLoaded(true)}
                onError={() => setHasError(true)}
            />
        </div>
    );
}

export function TryOnGalleryModal({ isOpen, onClose, tryOns }: TryOnGalleryModalProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(IMAGES_PER_PAGE);

    // Memoize visible try-ons to prevent unnecessary re-renders
    const visibleTryOns = useMemo(() => tryOns.slice(0, visibleCount), [tryOns, visibleCount]);
    const hasMore = visibleCount < tryOns.length;
    const remainingCount = tryOns.length - visibleCount;

    // Reset visible count when modal opens
    const handleClose = useCallback(() => {
        setVisibleCount(IMAGES_PER_PAGE);
        setSelectedImage(null);
        onClose();
    }, [onClose]);

    const handleLoadMore = useCallback(() => {
        setVisibleCount(prev => Math.min(prev + IMAGES_PER_PAGE, tryOns.length));
    }, [tryOns.length]);

    if (!isOpen) return null;

    const handleDownload = (imageData: string, filename: string) => {
        const link = document.createElement('a');
        link.href = imageData;
        link.download = `${filename.replace(/\s+/g, '-')}-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            {/* Main Gallery Modal */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                }}
                onClick={handleClose}
            >
                <div
                    className="relative w-full max-w-6xl max-h-[90vh] overflow-auto"
                    style={{
                        background: 'linear-gradient(135deg, #F5F0E6 0%, #F8F4EC 100%)',
                        borderRadius: '24px',
                        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div
                        className="sticky top-0 z-10 flex items-center justify-between p-6 border-b"
                        style={{
                            background: 'linear-gradient(135deg, rgba(245, 240, 230, 0.98) 0%, rgba(248, 244, 236, 0.95) 100%)',
                            backdropFilter: 'blur(10px)',
                            borderColor: 'rgba(201, 165, 92, 0.2)',
                        }}
                    >
                        <div>
                            <h2 className="text-2xl font-bold text-charcoal">My Try-On Gallery</h2>
                            <p className="text-sm text-charcoal/60 mt-1">
                                {tryOns.length} try-ons • Showing {Math.min(visibleCount, tryOns.length)}
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-full transition-all duration-200 hover:scale-110"
                            style={{
                                background: 'rgba(201, 165, 92, 0.1)',
                                color: '#C9A55C',
                            }}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Gallery Grid */}
                    <div className="p-6">
                        {tryOns.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-charcoal/60 text-lg">No try-ons yet. Start trying on outfits!</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {visibleTryOns.map((tryOn, index) => (
                                        <div
                                            key={tryOn.tryOnId}
                                            className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02]"
                                            style={{
                                                background: 'white',
                                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                            }}
                                        >
                                            {/* Image with lazy loading */}
                                            <div
                                                className="relative cursor-pointer"
                                                style={{ aspectRatio: '3/4' }}
                                            >
                                                <LazyImage
                                                    src={tryOn.resultImage}
                                                    alt={`Try-On ${tryOns.length - index}`}
                                                    className="w-full h-full object-cover"
                                                    onClick={() => setSelectedImage(tryOn.resultImage)}
                                                />
                                                {/* Hover Overlay */}
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                                                    <ZoomIn className="w-12 h-12 text-white" />
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="p-4">
                                                <h3 className="font-semibold text-charcoal line-clamp-1 mb-1">
                                                    Try-On #{tryOns.length - index}
                                                </h3>
                                                <p className="text-xs text-charcoal/60 mb-1">
                                                    {tryOn.productTitle}
                                                </p>
                                                <div className="flex items-center justify-between mt-1 mb-3">
                                                    <p className="text-[10px] text-charcoal/40 uppercase font-medium">
                                                        {new Date(tryOn.createdAt).toLocaleDateString()}
                                                    </p>
                                                    <span
                                                        className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                                                        style={{
                                                            background: 'rgba(201, 165, 92, 0.1)',
                                                            color: tryOn.provider === 'gemini'
                                                                ? '#10B981'
                                                                : tryOn.provider === 'vertex'
                                                                    ? '#3B82F6'
                                                                    : '#C9A55C',
                                                        }}
                                                    >
                                                        {tryOn.provider === 'unknown' ? 'AI GENERATED' : tryOn.provider}
                                                    </span>
                                                </div>

                                                {/* Download Button */}
                                                <button
                                                    onClick={() => handleDownload(tryOn.resultImage, `Try-On-${tryOns.length - index}`)}
                                                    className="w-full py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
                                                    style={{
                                                        background: 'linear-gradient(135deg, rgba(201, 165, 92, 0.95) 0%, rgba(201, 165, 92, 1) 100%)',
                                                        color: '#FFFFFF',
                                                        boxShadow: '0 2px 8px rgba(201, 165, 92, 0.3)',
                                                    }}
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Load More Button */}
                                {hasMore && (
                                    <div className="mt-8 text-center">
                                        <button
                                            onClick={handleLoadMore}
                                            className="px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02]"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(201, 165, 92, 0.15) 0%, rgba(201, 165, 92, 0.25) 100%)',
                                                color: '#C9A55C',
                                                border: '2px solid rgba(201, 165, 92, 0.3)',
                                            }}
                                        >
                                            Load More ({remainingCount} remaining)
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Full-Size Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                    style={{
                        background: 'rgba(0, 0, 0, 0.9)',
                    }}
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <img
                            src={selectedImage}
                            alt="Full size"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
