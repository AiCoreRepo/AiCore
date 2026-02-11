import { X } from "lucide-react";
import { useState } from "react";

interface ImageGalleryProps {
    images: string[];
    className?: string;
}

export const ImageGallery = ({ images, className = "" }: ImageGalleryProps) => {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) return null;

    const openLightbox = (index: number) => {
        setCurrentIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
    };

    return (
        <>
            {/* Thumbnail Grid */}
            <div className={`grid grid-cols-4 gap-2 mt-3 ${className}`}>
                {images.map((url, index) => (
                    <div
                        key={index}
                        onClick={() => openLightbox(index)}
                        className="relative w-full aspect-square rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300 border-2 shadow-sm hover:shadow-md"
                        style={{
                            borderColor: index === 0 ? '#D4AF37' : 'rgba(212, 175, 55, 0.3)',
                        }}
                    >
                        <img
                            src={url}
                            alt={`Review image ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black opacity-0 hover:opacity-10 transition-opacity" />
                    </div>
                ))}
            </div>

            {/* Lightbox Modal */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
                    onClick={closeLightbox}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>

                    {/* Navigation Buttons */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    prevImage();
                                }}
                                className="absolute left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                            >
                                <span className="text-white text-2xl">‹</span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    nextImage();
                                }}
                                className="absolute right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                            >
                                <span className="text-white text-2xl">›</span>
                            </button>
                        </>
                    )}

                    {/* Main Image */}
                    <div
                        className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={images[currentIndex]}
                            alt={`Review image ${currentIndex + 1}`}
                            className="max-w-full max-h-full object-contain rounded-lg"
                        />
                    </div>

                    {/* Image Counter */}
                    {images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-sm">
                            {currentIndex + 1} / {images.length}
                        </div>
                    )}
                </div>
            )}
        </>
    );
};
