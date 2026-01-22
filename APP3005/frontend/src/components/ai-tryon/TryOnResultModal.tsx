import { X, Download, Share2, Sparkles, ShoppingBag, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOADING_QUOTES } from './loading-quotes';
import { getRandomCompliment, ComplimentMessage } from './compliment-messages';

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
    const [showComplimentDialog, setShowComplimentDialog] = useState(false);
    const [currentCompliment, setCurrentCompliment] = useState<ComplimentMessage | null>(null);
    const [hasShownCompliment, setHasShownCompliment] = useState(false);
    const navigate = useNavigate();

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setHasShownCompliment(false);
            setShowComplimentDialog(false);
            setImageRevealed(false);
        }
    }, [isOpen]);

    // Rotate quotes every 3 seconds during loading
    useEffect(() => {
        if (loading || generatingAngles) {
            const interval = setInterval(() => {
                setCurrentQuoteIndex((prev) => (prev + 1) % LOADING_QUOTES.length);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [loading, generatingAngles]);

    // 1. Reset state when loading starts or image changes
    // Only hide if we are loading initial result, NOT for angles if we want to keep previous context
    // But actually we usually want to hide current result while loading new one
    useEffect(() => {
        if (loading || generatingAngles || !resultImage) {
            setShowComplimentDialog(false);
            setImageRevealed(false);
        }
    }, [loading, generatingAngles, resultImage]);

    // 2. Trigger animations and popup when ready
    useEffect(() => {
        if (resultImage && !loading && !error && !generatingAngles) {
            // Small delay to ensure the 'false' state rendered and opacity transition works
            const revealTimer = setTimeout(() => setImageRevealed(true), 100);

            // Show compliment popup after a short delay for elegance - ONLY ONCE
            if (!hasShownCompliment) {
                const showTimer = setTimeout(() => {
                    setCurrentCompliment(getRandomCompliment());
                    setShowComplimentDialog(true);
                    setHasShownCompliment(true);
                }, 800);
                return () => {
                    clearTimeout(revealTimer);
                    clearTimeout(showTimer);
                };
            }

            return () => clearTimeout(revealTimer);
        }
    }, [resultImage, loading, error, generatingAngles, hasShownCompliment]);

    // Auto-dismiss compliment popup after 6 seconds
    useEffect(() => {
        if (showComplimentDialog) {
            const dismissTimer = setTimeout(() => {
                setShowComplimentDialog(false);
            }, 6000);
            return () => clearTimeout(dismissTimer);
        }
    }, [showComplimentDialog]);

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

                @keyframes slideUpFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slideDownFadeOut {
                    from {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                }

                .compliment-popup {
                    animation: slideUpFadeIn 0.5s ease-out forwards;
                }

                .compliment-popup.hiding {
                    animation: slideDownFadeOut 0.4s ease-in forwards;
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
                    className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b"
                    style={{
                        background: '#ffffff',
                        borderColor: '#e0e0d8',
                    }}
                >
                    <div>
                        <h1 className="text-lg md:text-2xl font-serif" style={{ color: '#2c2c2c' }}>
                            AiVestire - Virtual Fitting Room
                        </h1>
                        <div className="hidden md:flex items-center gap-2 mt-1 text-sm" style={{ color: '#666' }}>
                            <span>STEP 1: Your Photo</span>
                            <span>›</span>
                            <span>STEP 2: Select Item</span>
                            <span>›</span>
                            <span className="font-semibold">STEP 3: Final Look</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-lg transition-all duration-200 hover:bg-black/5"
                        style={{
                            color: '#2c2c2c',
                            border: '1px solid #e0e0d8',
                        }}
                    >
                        <span className="text-xs md:text-sm font-medium">CLOSE</span>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Main Content - Responsive Layout */}
                <div className="flex-1 flex flex-col md:flex-row gap-3 md:gap-4 p-3 md:p-6 overflow-auto md:overflow-hidden">
                    {/* Left Sidebar - Hidden on Mobile, show small input preview instead */}
                    <div className="md:hidden flex items-center justify-center gap-4 p-3 rounded-xl" style={{
                        background: 'linear-gradient(135deg, #d4b896 0%, #c9a55c 100%)',
                    }}>
                        {/* User Photo - Small */}
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full overflow-hidden" style={{
                                background: '#ffffff',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            }}>
                                {userPhoto ? (
                                    <img src={userPhoto} alt="Your Upload" className="w-full h-full object-cover" />
                                ) : (
                                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces" alt="Sample User" className="w-full h-full object-cover" />
                                )}
                            </div>
                            <span className="text-[10px] mt-1 font-semibold" style={{ color: '#2c2c2c' }}>YOU</span>
                        </div>

                        <X className="w-5 h-5" style={{ color: '#2c2c2c' }} />

                        {/* Garment - Small */}
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center" style={{
                                background: '#ffffff',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            }}>
                                {garmentImage ? (
                                    <img src={garmentImage} alt="Selected Garment" className="w-full h-full object-contain p-1" />
                                ) : (
                                    <img src="https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200&h=200&fit=crop" alt="Sample Garment" className="w-full h-full object-contain p-1" />
                                )}
                            </div>
                            <span className="text-[10px] mt-1 font-semibold" style={{ color: '#2c2c2c' }}>ITEM</span>
                        </div>

                        <div className="flex items-center gap-1 ml-2">
                            <Sparkles className="w-4 h-4" style={{ color: '#2c2c2c' }} />
                            <span className="text-xs font-semibold" style={{ color: '#2c2c2c' }}>DONE</span>
                        </div>
                    </div>

                    {/* Left Sidebar - Desktop Only */}
                    <div
                        className="hidden md:flex w-64 flex-shrink-0 rounded-2xl p-6 flex-col items-center"
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
                    <div className="flex-1 flex items-center justify-center rounded-2xl overflow-hidden min-h-[300px] md:min-h-0 relative" style={{
                        background: 'linear-gradient(135deg, #c4b5a0 0%, #b8a890 50%, #c4b5a0 100%)',
                        boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}>
                        {loading && (
                            <div className="flex flex-col items-center justify-center p-4">
                                <div
                                    className="rounded-full h-12 w-12 md:h-16 md:w-16 border-4 mb-4"
                                    style={{
                                        borderColor: 'rgba(201, 165, 92, 0.2)',
                                        borderTopColor: '#c9a55c',
                                        animation: 'spin 1s linear infinite',
                                    }}
                                />
                                <p className="text-sm md:text-lg font-medium text-center" style={{ color: '#666' }}>
                                    {LOADING_QUOTES[currentQuoteIndex]}
                                </p>
                                <p className="text-xs md:text-sm mt-2" style={{ color: '#999' }}>
                                    Creating your perfect look...
                                </p>
                            </div>
                        )}

                        {error && !loading && (
                            <div className="text-center p-4">
                                <div
                                    className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-4 mx-auto"
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                    }}
                                >
                                    <X className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
                                </div>
                                <p className="text-sm md:text-lg mb-4 font-medium" style={{ color: '#d32f2f' }}>{error}</p>
                                <button
                                    onClick={onClose}
                                    className="px-4 md:px-6 py-2 rounded-lg font-medium text-sm"
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
                                className="w-full h-full flex items-center justify-center p-2 md:p-4 cursor-pointer group"
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
                        {/* Elegant Compliment Popup - Floating over image bottom */}
                        {showComplimentDialog && currentCompliment && (
                            <div
                                className="absolute bottom-6 left-6 z-50 compliment-popup"
                                style={{ maxWidth: '360px', width: '90%' }}
                            >
                                <div
                                    className="relative rounded-2xl overflow-hidden"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.98)',
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(201, 165, 92, 0.25)',
                                        backdropFilter: 'blur(16px)',
                                    }}
                                >
                                    {/* Gold accent bar */}
                                    <div
                                        style={{
                                            height: '3px',
                                            background: 'linear-gradient(90deg, #c9a55c 0%, #d4b896 50%, #c9a55c 100%)',
                                        }}
                                    />

                                    {/* Content */}
                                    <div className="px-4 py-4">
                                        <div className="flex items-start gap-3">
                                            {/* Sparkle Icon */}
                                            <div
                                                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                                                style={{
                                                    background: 'linear-gradient(135deg, #c9a55c 0%, #d4b896 100%)',
                                                }}
                                            >
                                                <Sparkles className="w-4 h-4 text-white" />
                                            </div>

                                            {/* Message */}
                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className="text-sm leading-relaxed font-serif italic"
                                                    style={{ color: '#1a1a1a', fontWeight: 500 }}
                                                >
                                                    "{currentCompliment.message}"
                                                </p>

                                                {/* Emotion Tags */}
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {currentCompliment.emotion.map((emotion, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wide"
                                                            style={{
                                                                background: 'rgba(201, 165, 92, 0.15)',
                                                                color: '#9a7b4f',
                                                            }}
                                                        >
                                                            {emotion}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Close Button */}
                                            <button
                                                onClick={() => setShowComplimentDialog(false)}
                                                className="flex-shrink-0 p-1 rounded-full transition-all duration-200 hover:bg-black/5"
                                                style={{ color: '#aaa' }}
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar - Action Buttons */}
                    <div className="flex md:flex-col gap-2 md:gap-3 md:w-64 flex-shrink-0">
                        {/* Download HD Result */}
                        <button
                            onClick={handleDownload}
                            disabled={!resultImage || loading}
                            className="action-button flex-1 md:flex-none flex items-center justify-center gap-1 md:gap-2 py-2 md:py-3 px-2 md:px-4 rounded-xl font-medium text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: '#2c2c2c',
                                color: 'white',
                                border: 'none',
                            }}
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">DOWNLOAD HD</span>
                            <span className="sm:hidden">SAVE</span>
                        </button>

                        {/* Share Look */}
                        <button
                            onClick={handleShare}
                            disabled={!resultImage || loading}
                            className="action-button flex-1 md:flex-none flex items-center justify-center gap-1 md:gap-2 py-2 md:py-3 px-2 md:px-4 rounded-xl font-medium text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: 'white',
                                color: '#2c2c2c',
                                border: '1px solid #e0e0d8',
                            }}
                        >
                            <Share2 className="w-4 h-4" />
                            <span>SHARE</span>
                        </button>

                        {/* Try Another Angle */}
                        {onGenerateMoreAngles && (
                            <button
                                onClick={onGenerateMoreAngles}
                                disabled={generatingAngles || !resultImage || loading}
                                className="action-button flex-1 md:flex-none flex items-center justify-center gap-1 md:gap-2 py-2 md:py-3 px-2 md:px-4 rounded-xl font-medium text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: 'white',
                                    color: '#2c2c2c',
                                    border: '1px solid #e0e0d8',
                                }}
                            >
                                <Sparkles className="w-4 h-4" />
                                <span className="hidden sm:inline">{generatingAngles ? 'GENERATING...' : 'NEW ANGLE'}</span>
                                <span className="sm:hidden">{generatingAngles ? '...' : 'ANGLE'}</span>
                            </button>
                        )}

                        {/* Shop This Outfit */}
                        <button
                            onClick={handleShopOutfit}
                            disabled={loading}
                            className="action-button flex-1 md:flex-none flex items-center justify-center gap-1 md:gap-2 py-2 md:py-3 px-2 md:px-4 rounded-xl font-medium text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: 'white',
                                color: '#2c2c2c',
                                border: '1px solid #e0e0d8',
                            }}
                        >
                            <ShoppingBag className="w-4 h-4" />
                            <span>SHOP</span>
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
