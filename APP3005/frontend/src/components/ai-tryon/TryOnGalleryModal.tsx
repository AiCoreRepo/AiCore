import { X, Download, ZoomIn } from 'lucide-react';
import { useState } from 'react';

interface TryOn {
    tryOnId: string;
    productId: string;
    productTitle: string;
    productImage: string | null;
    resultImage: string;
    createdAt: string;
}

interface TryOnGalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    tryOns: TryOn[];
}

export function TryOnGalleryModal({ isOpen, onClose, tryOns }: TryOnGalleryModalProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
                onClick={onClose}
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
                            <p className="text-sm text-charcoal/60 mt-1">{tryOns.length} try-ons</p>
                        </div>
                        <button
                            onClick={onClose}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {tryOns.map((tryOn, index) => (
                                    <div
                                        key={tryOn.tryOnId}
                                        className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02]"
                                        style={{
                                            background: 'white',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                        }}
                                    >
                                        {/* Image */}
                                        <div
                                            className="relative cursor-pointer"
                                            style={{ aspectRatio: '3/4' }}
                                            onClick={() => setSelectedImage(tryOn.resultImage)}
                                        >
                                            <img
                                                src={tryOn.resultImage}
                                                alt={`Try-On ${tryOns.length - index}`}
                                                className="w-full h-full object-cover"
                                            />
                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
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
                                            <p className="text-xs text-charcoal/40 mb-3">
                                                {new Date(tryOn.createdAt).toLocaleDateString()}
                                            </p>

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
