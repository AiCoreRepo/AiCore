import { X, Download, Share2, Sparkles, ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOADING_QUOTES } from './loading-quotes';

interface TryOnResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    resultImage: string | null;
    loading: boolean;
    error: string | null;
    onGenerateMoreAngles?: () => void;
    generatingAngles?: boolean;
    userPhoto?: string | null;
    garmentImage?: string | null;
    garmentId?: string;
}

export function TryOnResultModal({
    isOpen,
    onClose,
    resultImage,
    loading,
    error,
    onGenerateMoreAngles,
    generatingAngles = false,
    userPhoto,
    garmentImage,
    garmentId,
}: TryOnResultModalProps) {
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
    const [imageRevealed, setImageRevealed] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const navigate = useNavigate();

    // Rotate quotes every 3 seconds during loading
    useEffect(() => {
        if (loading || generatingAngles) {
            const interval = setInterval(() => {
                setCurrentQuoteIndex((prev) => (prev + 1) % LOADING_QUOTES.length);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [loading, generatingAngles]);

    // Trigger image reveal animation when image loads
    useEffect(() => {
        if (resultImage && !loading) {
            setImageRevealed(false);
            setTimeout(() => setImageRevealed(true), 50);
        }
    }, [resultImage, loading]);

    // Prevent body scroll when modal or lightbox is open
    useEffect(() => {
        if (isOpen || isLightboxOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, isLightboxOpen]);

    if (!isOpen) return null;

    const handleDownload = () => {
        if (!resultImage) return;
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `ai-tryon-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = () => {
        if (navigator.share && resultImage) {
            navigator.share({
                title: 'My AI Try-On Result',
                text: 'Check out my virtual try-on!',
                url: window.location.href,
            }).catch(() => { });
        }
    };

    const handleShopOutfit = () => {
        onClose();
        if (garmentId) {
            navigate(`/collection?item=${garmentId}`);
        } else {
            navigate('/collection');
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(8px)',
            }}
            onClick={onClose}
        >
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }

                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                .modal-appear {
                    animation: fadeIn 0.3s ease-out;
                }

                .action-button {
                    transition: all 0.2s ease;
                }

                .action-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }

                .action-button:active {
                    transform: translateY(0);
                }
            `}</style>

            <div
                className="relative w-full max-w-[95vw] h-[90vh] overflow-hidden flex flex-col modal-appear"
                style={{
                    background: '#f5f5f0',
                    borderRadius: '20px',
                    border: '3px solid #c9a55c',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-8 py-4 border-b"
                    style={{
                        background: '#ffffff',
                        borderColor: '#e0e0d8',
                    }}
                >
                    <div>
                        <h1 className="text-2xl font-serif" style={{ color: '#2c2c2c' }}>
                            AiVestire - Virtual Fitting Room
                        </h1>
                        <div className="flex items-center gap-2 mt-1 text-sm" style={{ color: '#666' }}>
                            <span>STEP 1: Your Photo</span>
                            <span>›</span>
                            <span>STEP 2: Select Item</span>
                            <span>›</span>
                            <span className="font-semibold">STEP 3: Final Look</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-black/5"
                        style={{
                            color: '#2c2c2c',
                            border: '1px solid #e0e0d8',
                        }}
                    >
                        <span className="text-sm font-medium">CLOSE</span>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex gap-4 p-6 overflow-hidden">
                    {/* Left Sidebar - Process & Inputs */}
                    <div
                        className="w-64 flex-shrink-0 rounded-2xl p-6 flex flex-col items-center"
                        style={{
                            background: 'linear-gradient(135deg, #d4b896 0%, #c9a55c 100%)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        <h3 className="text-lg font-serif mb-6" style={{ color: '#2c2c2c', fontFamily: 'Georgia, serif' }}>
                            Process & Inputs
                        </h3>

                        <div className="flex items-center gap-3 mb-8">
                            {/* User Photo */}
                            <div className="flex flex-col items-center">
                                <div
                                    className="w-[100px] h-[100px] rounded-full overflow-hidden mb-2 transition-transform duration-300 hover:scale-105"
                                    style={{
                                        background: '#ffffff',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                                    }}
                                >
                                    {userPhoto ? (
                                        <img src={userPhoto} alt="Your Upload" className="w-full h-full object-cover" />
                                    ) : (
                                        <img
                                            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces"
                                            alt="Sample User"
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                                <span className="text-xs text-center font-semibold" style={{ color: '#2c2c2c', letterSpacing: '0.5px' }}>
                                    YOUR<br />UPLOAD
                                </span>
                            </div>

                            {/* X Icon */}
                            <div className="flex items-center justify-center" style={{ width: '28px' }}>
                                <X className="w-7 h-7" style={{ color: '#2c2c2c', strokeWidth: 2.5 }} />
                            </div>

                            {/* Garment */}
                            <div className="flex flex-col items-center">
                                <div
                                    className="w-[100px] h-[100px] rounded-full overflow-hidden mb-2 flex items-center justify-center transition-transform duration-300 hover:scale-105"
                                    style={{
                                        background: '#ffffff',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                                    }}
                                >
                                    {garmentImage ? (
                                        <img src={garmentImage} alt="Selected Garment" className="w-full h-full object-contain p-3" />
                                    ) : (
                                        <img
                                            src="https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200&h=200&fit=crop"
                                            alt="Sample Garment"
                                            className="w-full h-full object-contain p-2"
                                        />
                                    )}
                                </div>
                                <span className="text-xs text-center font-semibold" style={{ color: '#2c2c2c', letterSpacing: '0.5px' }}>
                                    SELECTED<br />GARMENT
                                </span>
                            </div>
                        </div>

                        {/* Status - Better positioned */}
                        <div className="mt-auto pt-4 border-t" style={{ borderColor: 'rgba(0, 0, 0, 0.1)', width: '100%' }}>
                            <div className="flex items-center justify-center gap-2">
                                <Sparkles className="w-5 h-5" style={{ color: '#2c2c2c' }} />
                                <div className="text-center">
                                    <span className="text-sm font-semibold block" style={{ color: '#2c2c2c', letterSpacing: '0.5px' }}>
                                        AI PROCESSING
                                    </span>
                                    <span className="text-sm font-semibold" style={{ color: '#2c2c2c', letterSpacing: '0.5px' }}>
                                        COMPLETED
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Center - Result Image */}
                    <div className="flex-1 flex items-center justify-center rounded-2xl overflow-hidden" style={{
                        background: 'linear-gradient(135deg, #c4b5a0 0%, #b8a890 50%, #c4b5a0 100%)',
                        boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}>
                        {loading && (
                            <div className="flex flex-col items-center justify-center">
                                <div
                                    className="rounded-full h-16 w-16 border-4 mb-4"
                                    style={{
                                        borderColor: 'rgba(201, 165, 92, 0.2)',
                                        borderTopColor: '#c9a55c',
                                        animation: 'spin 1s linear infinite',
                                    }}
                                />
                                <p className="text-lg font-medium" style={{ color: '#666' }}>
                                    {LOADING_QUOTES[currentQuoteIndex]}
                                </p>
                                <p className="text-sm mt-2" style={{ color: '#999' }}>
                                    Creating your perfect look...
                                </p>
                            </div>
                        )}

                        {error && !loading && (
                            <div className="text-center">
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto"
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                    }}
                                >
                                    <X className="w-8 h-8 text-red-500" />
                                </div>
                                <p className="text-lg mb-4 font-medium" style={{ color: '#d32f2f' }}>{error}</p>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 rounded-lg font-medium"
                                    style={{
                                        background: '#2c2c2c',
                                        color: 'white',
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        )}

                        {resultImage && !loading && !error && (
                            <div
                                className="w-full h-full flex items-center justify-center p-4 cursor-pointer group"
                                onClick={() => setIsLightboxOpen(true)}
                                title="Click to view full size"
                            >
                                <img
                                    src={resultImage}
                                    alt="Try-On Result"
                                    className={`max-w-full max-h-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-[1.02] ${imageRevealed ? 'modal-appear' : ''}`}
                                    style={{
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar - Actions */}
                    <div className="w-64 flex-shrink-0 flex flex-col gap-3">
                        {/* Download HD Result */}
                        <button
                            onClick={handleDownload}
                            disabled={!resultImage || loading}
                            className="action-button flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: '#2c2c2c',
                                color: 'white',
                                border: 'none',
                            }}
                        >
                            <Download className="w-4 h-4" />
                            DOWNLOAD HD RESULT
                        </button>

                        {/* Share Look */}
                        <button
                            onClick={handleShare}
                            disabled={!resultImage || loading}
                            className="action-button flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: 'white',
                                color: '#2c2c2c',
                                border: '1px solid #e0e0d8',
                            }}
                        >
                            <Share2 className="w-4 h-4" />
                            SHARE LOOK
                        </button>

                        {/* Try Another Angle */}
                        {onGenerateMoreAngles && (
                            <button
                                onClick={onGenerateMoreAngles}
                                disabled={generatingAngles || !resultImage || loading}
                                className="action-button flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: 'white',
                                    color: '#2c2c2c',
                                    border: '1px solid #e0e0d8',
                                }}
                            >
                                <Sparkles className="w-4 h-4" />
                                {generatingAngles ? 'GENERATING...' : 'TRY ANOTHER ANGLE'}
                            </button>
                        )}

                        {/* Shop This Outfit */}
                        <button
                            onClick={handleShopOutfit}
                            disabled={loading}
                            className="action-button flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: 'white',
                                color: '#2c2c2c',
                                border: '1px solid #e0e0d8',
                            }}
                        >
                            <ShoppingBag className="w-4 h-4" />
                            SHOP THIS OUTFIT
                        </button>
                    </div>
                </div>

                {/* Lightbox - Full Screen Image View */}
                {isLightboxOpen && resultImage && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        style={{
                            background: 'rgba(0, 0, 0, 0.95)',
                            backdropFilter: 'blur(20px)',
                        }}
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setIsLightboxOpen(false)}
                            className="absolute top-4 right-4 md:top-8 md:right-8 p-3 rounded-full transition-all duration-300 hover:scale-110 hover:rotate-90 z-10"
                            style={{
                                background: 'rgba(255, 255, 255, 0.15)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                            }}
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>

                        {/* Full-Screen Image */}
                        <div
                            className="relative w-full h-full flex items-center justify-center p-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={resultImage}
                                alt="Try-On Result - Full Size"
                                className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain rounded-2xl modal-appear"
                                style={{
                                    boxShadow: '0 30px 100px rgba(0, 0, 0, 0.6)',
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
