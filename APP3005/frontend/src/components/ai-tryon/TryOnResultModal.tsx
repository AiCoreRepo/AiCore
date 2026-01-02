import { X, Download, Sparkles, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LOADING_QUOTES } from './loading-quotes';

interface TryOnResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    resultImage: string | null;
    loading: boolean;
    error: string | null;
    onGenerateMoreAngles?: () => void;
    generatingAngles?: boolean;
}

export function TryOnResultModal({
    isOpen,
    onClose,
    resultImage,
    loading,
    error,
    onGenerateMoreAngles,
    generatingAngles = false,
}: TryOnResultModalProps) {
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
    const [imageRevealed, setImageRevealed] = useState(false);

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
            // Small delay to ensure smooth animation
            setTimeout(() => setImageRevealed(true), 50);
        }
    }, [resultImage, loading]);

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

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
            }}
            onClick={onClose}
        >
            <style>{`
                @keyframes slideFromSky {
                    0% {
                        transform: translateY(-100vh) scale(0.8);
                        opacity: 0;
                    }
                    100% {
                        transform: translateY(0) scale(1);
                        opacity: 1;
                    }
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
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

                @keyframes glow {
                    0%, 100% {
                        box-shadow: 0 0 20px rgba(201, 165, 92, 0.5);
                    }
                    50% {
                        box-shadow: 0 0 40px rgba(201, 165, 92, 0.8);
                    }
                }

                .image-reveal {
                    animation: slideFromSky 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .quote-fade {
                    animation: fadeIn 0.5s ease-out;
                }

                .spinner-glow {
                    animation: spin 1s linear infinite, glow 2s ease-in-out infinite;
                }
            `}</style>

            <div
                className="relative w-full max-w-6xl max-h-[95vh] overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 247, 240, 0.95) 100%)',
                    borderRadius: '24px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between p-6 border-b"
                    style={{ borderColor: 'rgba(201, 165, 92, 0.2)' }}
                >
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-gold" />
                        <h2 className="text-2xl font-bold text-charcoal">
                            AI Try-On Result
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full transition-all duration-300 hover:bg-charcoal/5"
                    >
                        <X className="w-6 h-6 text-charcoal/60" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 140px)' }}>
                    {/* Loading State with Dynamic Quotes */}
                    {loading && (
                        <div
                            className="flex flex-col items-center justify-center py-20"
                            style={{
                                background: 'linear-gradient(135deg, rgba(201, 165, 92, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                                borderRadius: '16px',
                                minHeight: '400px',
                            }}
                        >
                            {/* Elegant Spinner with Glow */}
                            <div className="relative mb-8">
                                <div
                                    className="spinner-glow rounded-full h-20 w-20 border-4"
                                    style={{
                                        borderColor: 'rgba(201, 165, 92, 0.3)',
                                        borderTopColor: '#C9A55C',
                                    }}
                                />
                                <Sparkles
                                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-gold"
                                    style={{ animation: 'pulse 2s ease-in-out infinite' }}
                                />
                            </div>

                            {/* Dynamic Quote */}
                            <div className="quote-fade mb-4" key={currentQuoteIndex}>
                                <h3 className="text-2xl font-bold text-charcoal text-center">
                                    {LOADING_QUOTES[currentQuoteIndex]}
                                </h3>
                            </div>

                            <p className="text-charcoal/60 text-center max-w-md">
                                Hang tight! Our AI is working its magic ✨
                            </p>

                            {/* Progress Dots */}
                            <div className="flex gap-2 mt-6">
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="w-2 h-2 rounded-full bg-gold"
                                        style={{
                                            animation: `pulse 1.5s ease-in-out infinite`,
                                            animationDelay: `${i * 0.2}s`,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.15) 100%)',
                                }}
                            >
                                <X className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-charcoal mb-2">
                                Oops! Something went wrong
                            </h3>
                            <p className="text-charcoal/60 text-center max-w-md mb-6">
                                {error}
                            </p>
                            <button
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(201, 165, 92, 0.1) 0%, rgba(201, 165, 92, 0.15) 100%)',
                                    border: '2px solid rgba(201, 165, 92, 0.3)',
                                    color: '#C9A55C',
                                }}
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Success State with Image Reveal Animation */}
                    {resultImage && !loading && !error && (
                        <div className="space-y-6">
                            {/* Image with Reveal Animation */}
                            <div
                                className={`relative rounded-2xl overflow-hidden ${imageRevealed ? 'image-reveal' : ''}`}
                                style={{
                                    background: 'linear-gradient(135deg, rgba(201, 165, 92, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                                }}
                            >
                                <img
                                    src={resultImage}
                                    alt="Try-On Result"
                                    className="w-full h-auto"
                                    style={{
                                        maxHeight: '600px',
                                        objectFit: 'contain',
                                    }}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-4 justify-center">
                                {/* Download Button */}
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(201, 165, 92, 0.1) 0%, rgba(201, 165, 92, 0.15) 100%)',
                                        border: '2px solid rgba(201, 165, 92, 0.3)',
                                        color: '#C9A55C',
                                    }}
                                >
                                    <Download className="w-5 h-5" />
                                    Download Image
                                </button>

                                {/* Spin It Button */}
                                {onGenerateMoreAngles && (
                                    <button
                                        onClick={onGenerateMoreAngles}
                                        disabled={generatingAngles}
                                        className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.15) 100%)',
                                            border: '2px solid rgba(139, 92, 246, 0.3)',
                                            color: '#8B5CF6',
                                        }}
                                    >
                                        <RefreshCw className={`w-5 h-5 ${generatingAngles ? 'animate-spin' : ''}`} />
                                        {generatingAngles ? 'Spinning...' : '🔥 Spin It!'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
