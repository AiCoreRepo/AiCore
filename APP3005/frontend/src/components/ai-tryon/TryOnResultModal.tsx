import { X, Download, Share2, Sparkles, ShoppingBag, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
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
    generatedImages?: string[];
    onSelectImage?: (image: string) => void;
}

interface ProcessStep {
    id: number;
    label: string;
    icon: string;
    status: 'pending' | 'active' | 'complete';
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
    generatedImages = [],
    onSelectImage,
}: TryOnResultModalProps) {
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
    const [imageRevealed, setImageRevealed] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [showComplimentDialog, setShowComplimentDialog] = useState(false);
    const [currentCompliment, setCurrentCompliment] = useState<ComplimentMessage | null>(null);
    const [hasShownCompliment, setHasShownCompliment] = useState(false);

    // Progress State
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);

    // Refs for monotonic progress (prevents backward jumps)
    const progressRef = useRef(0);

    const navigate = useNavigate();

    const processSteps: ProcessStep[] = [
        { id: 1, label: 'Analyzing Image', icon: '🔍', status: 'pending' },
        { id: 2, label: 'AI Processing', icon: '🤖', status: 'pending' },
        { id: 3, label: 'Rendering Result', icon: '✨', status: 'pending' },
        { id: 4, label: 'Finalizing', icon: '🎨', status: 'pending' },
    ];

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setHasShownCompliment(false);
            setShowComplimentDialog(false);
            setImageRevealed(false);
            if (!loading && !generatingAngles) {
                setLoadingProgress(0);
                setCurrentStep(0);
                progressRef.current = 0;
            }
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

    // ROBUST PROGRESS SIMULATION
    // Strictly ties steps to progress thresholds to prevent desync
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (loading || generatingAngles) {
            // STRICT RESET: Always start from 0 when a new process begins
            // checking if we are already high (previous run) or just starting
            if (progressRef.current > 5) {
                progressRef.current = 0;
                setLoadingProgress(0);
                setCurrentStep(0);
            }

            interval = setInterval(() => {
                let current = progressRef.current;

                // Target: 95% (Stall point - deep in "Finalizing")
                const target = 95;

                // Speed Logic:
                // Fast until 30% (Analyzing)
                // Steady until 60% (Processing)
                // Steady until 80% (Rendering)
                // Crawl until 95% (Finalizing)
                let increment = 0;

                if (current < 30) increment = 0.4;
                else if (current < 60) increment = 0.3;
                else if (current < 80) increment = 0.2;
                else if (current < 95) increment = 0.05; // Crawl in final step

                if (current < target) {
                    current += increment;
                }

                // Update Ref & State
                progressRef.current = current;
                setLoadingProgress(Math.floor(current));

                // DIRECTLY DRIVE STEPS FROM PROGRESS
                // 0: Analyzing
                // 1: Processing (>25)
                // 2: Rendering (>55)
                // 3: Finalizing (>75) - Ensures we are here when stalling at 95
                let step = 0;
                if (current > 25) step = 1;
                if (current > 55) step = 2;
                if (current > 75) step = 3;

                setCurrentStep(step);

            }, 50); // Run every 50ms for smooth updates

        } else if (!loading && !generatingAngles && resultImage) {
            // SUCCESS: Instantly fill
            progressRef.current = 100;
            setLoadingProgress(100);
            setCurrentStep(4); // All Complete
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [loading, generatingAngles, resultImage]);

    // Reset state when loading starts or image changes
    useEffect(() => {
        if (loading || generatingAngles || !resultImage) {
            setShowComplimentDialog(false);
            setImageRevealed(false);
        }
    }, [loading, generatingAngles, resultImage]);

    // Trigger animations and popup when ready
    useEffect(() => {
        if (resultImage && !loading && !error && !generatingAngles) {
            const revealTimer = setTimeout(() => setImageRevealed(true), 100);

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

    const getStepStatus = (stepIndex: number): 'pending' | 'active' | 'complete' => {
        if (stepIndex < currentStep) return 'complete';
        if (stepIndex === currentStep) return 'active';
        return 'pending';
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4"
            style={{
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 100%)',
                backdropFilter: 'blur(16px)',
            }}
            onClick={onClose}
        >
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.96); }
                    to { opacity: 1; transform: scale(1); }
                }

                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes checkmark {
                    0% { transform: scale(0) rotate(0deg); }
                    50% { transform: scale(1.2) rotate(180deg); }
                    100% { transform: scale(1) rotate(360deg); }
                }

                @keyframes slideRight {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                .modal-appear { animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
                .slide-up { animation: slideUp 0.5s ease-out; }
                .slide-right { animation: slideRight 0.6s ease-out; }
                .shimmer-effect {
                    position: relative;
                    overflow: hidden;
                }
                .shimmer-effect::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 50%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                    animation: shimmer 2s infinite;
                }
                .checkmark-animate { animation: checkmark 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
            `}</style>

            <div
                className="relative w-full max-w-7xl h-[94vh] overflow-hidden flex flex-col modal-appear"
                style={{
                    background: 'linear-gradient(135deg, #fdfbf7 0%, #f7f4ef 100%)',
                    borderRadius: '28px',
                    boxShadow: '0 30px 90px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(201, 165, 92, 0.15)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Premium Header */}
                <div
                    className="relative flex items-center justify-between px-6 md:px-8 py-4 md:py-5 border-b"
                    style={{
                        background: 'linear-gradient(135deg, rgba(253, 251, 247, 0.98) 0%, rgba(247, 244, 239, 0.98) 100%)',
                        backdropFilter: 'blur(20px)',
                        borderColor: 'rgba(201, 165, 92, 0.12)',
                    }}
                >
                    <div className="flex items-center gap-4 md:gap-6">
                        <div>
                            <h1 className="text-xl md:text-2xl font-serif bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent font-bold">
                                AiVestire
                            </h1>
                            <p className="text-xs md:text-sm text-gray-500 mt-0.5">Virtual Fitting Room</p>
                        </div>

                        {/* Compact Process Pills */}
                        <div className="hidden md:flex items-center gap-2.5 px-5 py-2.5 rounded-full" style={{
                            background: 'linear-gradient(135deg, #d4b896 0%, #c9a55c 100%)',
                            boxShadow: '0 4px 12px rgba(201, 165, 92, 0.25)',
                        }}>
                            <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/60" style={{ background: '#ffffff' }}>
                                {userPhoto ? (
                                    <img src={userPhoto} alt="You" className="w-full h-full object-cover" />
                                ) : (
                                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces" alt="User" className="w-full h-full object-cover" />
                                )}
                            </div>

                            <X className="w-4 h-4 text-white/90" />

                            <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/60 flex items-center justify-center" style={{ background: '#ffffff' }}>
                                {garmentImage ? (
                                    <img src={garmentImage} alt="Item" className="w-full h-full object-contain p-0.5" />
                                ) : (
                                    <img src="https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=100&h=100&fit=crop" alt="Garment" className="w-full h-full object-contain p-0.5" />
                                )}
                            </div>

                            <Sparkles className="w-4 h-4 text-white ml-1" />
                            <span className="text-xs font-semibold text-white">READY</span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl transition-all duration-300 hover:bg-black/5 active:scale-95"
                        style={{
                            color: '#2c2c2c',
                            border: '1px solid rgba(0,0,0,0.08)',
                        }}
                    >
                        <span className="text-sm font-semibold">CLOSE</span>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-5 p-4 md:p-6 overflow-hidden relative">

                    {/* Left Sidebar - AI Insights (Desktop) */}
                    {resultImage && !loading && !error && (
                        <div className="hidden md:flex w-64 flex-col gap-4 slide-right">
                            {/* Style Analysis Card */}
                            <div className="rounded-2xl p-5" style={{
                                background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)',
                            }}>
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="w-4 h-4 text-[#c9a55c]" />
                                    <span className="text-sm font-bold font-serif text-gray-800">STYLE COMPATIBILITY</span>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-medium text-gray-500">Overall Match</span>
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <div key={star} className="w-3 h-3 rounded-full bg-[#c9a55c]" style={{ opacity: star <= 5 ? 1 : 0.3 }} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(201, 165, 92, 0.08)' }}>
                                            <CheckCircle2 className="w-4 h-4 text-[#c9a55c]" />
                                            <span className="text-sm font-bold text-[#9a7b4f]">Excellent Match</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {['✨', '💃', '🌟', '🔥'].map((emoji, i) => (
                                            <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{
                                                background: 'rgba(201, 165, 92, 0.1)',
                                                border: '1px solid rgba(201, 165, 92, 0.2)',
                                            }}>
                                                {emoji}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Smart Tips Card */}
                            <div className="rounded-2xl p-5 flex-1" style={{
                                background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)',
                            }}>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[#c9a55c]/10">
                                        <span className="text-[10px]">✨</span>
                                    </div>
                                    <span className="text-sm font-bold font-serif text-gray-800">STYLE APPRECIATION</span>
                                </div>

                                <ul className="space-y-3">
                                    {[
                                        'You are absolutely radiating confidence!',
                                        'This color palette highlights your best features.',
                                        'Honestly? The camera just loves you.'
                                    ].map((tip, i) => (
                                        <li key={i} className="flex gap-3 text-xs text-gray-600 leading-relaxed font-medium">
                                            <span className="block w-1 h-1 rounded-full bg-[#c9a55c] mt-1.5 flex-shrink-0" />
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Center - Result Image Area */}
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden relative">
                        {/* Image Display */}
                        <div className="flex-1 flex items-center justify-center rounded-3xl overflow-hidden relative" style={{
                            background: 'linear-gradient(135deg, #f0ebe4 0%, #e8e3dc 50%, #f0ebe4 100%)',
                            boxShadow: 'inset 0 2px 16px rgba(0, 0, 0, 0.06)'
                        }}>
                            {/* Loading State - Game-Like Queue Animation (Compact Version) */}
                            {(loading || generatingAngles) && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-20 slide-up" style={{
                                    background: 'linear-gradient(135deg, #fcfaf7 0%, #f7f5f2 100%)',
                                    backdropFilter: 'blur(24px)',
                                }}>
                                    {/* Animated Icon - Smaller */}
                                    <div className="relative mb-5">
                                        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{
                                            background: 'linear-gradient(135deg, #c9a55c 0%, #d4b896 100%)',
                                            boxShadow: '0 8px 24px rgba(201, 165, 92, 0.35)',
                                            animation: 'pulse 2s ease-in-out infinite',
                                        }}>
                                            <Sparkles className="w-8 h-8 text-white" />
                                        </div>
                                    </div>

                                    {/* Title - Smaller */}
                                    <h3 className="text-xl md:text-2xl font-serif font-bold mb-1 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                        {generatingAngles ? 'Generating New Angle' : 'Creating Your Look'}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
                                        {LOADING_QUOTES[currentQuoteIndex]}
                                    </p>

                                    {/* Process Steps - Compact Grid */}
                                    <div className="w-full max-w-xl mb-6">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                                            {processSteps.map((step, idx) => {
                                                const status = getStepStatus(idx);
                                                return (
                                                    <div
                                                        key={step.id}
                                                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-500"
                                                        style={{
                                                            background: status === 'complete' ? 'linear-gradient(135deg, #c9a55c 0%, #d4b896 100%)' :
                                                                status === 'active' ? 'linear-gradient(135deg, rgba(201, 165, 92, 0.15) 0%, rgba(212, 184, 150, 0.15) 100%)' :
                                                                    'rgba(0,0,0,0.03)',
                                                            border: status === 'active' ? '1.5px solid #c9a55c' : '1.5px solid transparent',
                                                            boxShadow: status === 'complete' ? '0 3px 12px rgba(201, 165, 92, 0.25)' :
                                                                status === 'active' ? '0 3px 12px rgba(201, 165, 92, 0.15)' : 'none',
                                                        }}
                                                    >
                                                        <div className="text-xl mb-0.5">
                                                            {status === 'complete' ? (
                                                                <CheckCircle2 className="w-5 h-5 text-white checkmark-animate" />
                                                            ) : status === 'active' ? (
                                                                <Loader2 className="w-5 h-5 text-[#c9a55c] animate-spin" />
                                                            ) : (
                                                                <span className="opacity-40 text-lg">{step.icon}</span>
                                                            )}
                                                        </div>
                                                        <span className={`text-[10px] md:text-xs font-semibold text-center ${status === 'complete' ? 'text-white' :
                                                            status === 'active' ? 'text-gray-900' :
                                                                'text-gray-400'
                                                            }`}>
                                                            {step.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Progress Bar - Compact */}
                                    <div className="w-full max-w-lg">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-semibold text-gray-600">Progress</span>
                                            <span className="text-xs font-bold text-[#c9a55c]">
                                                {/* Safety: If loading but progress high, show 0 to prevent flash */}
                                                {Math.round((loading || generatingAngles) && loadingProgress > 95 ? 0 : loadingProgress)}%
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full overflow-hidden" style={{
                                            background: 'rgba(0,0,0,0.06)',
                                        }}>
                                            <div
                                                className="h-full transition-all duration-500 ease-out shimmer-effect"
                                                style={{
                                                    // Safety override here too
                                                    width: `${(loading || generatingAngles) && loadingProgress > 95 ? 0 : loadingProgress}%`,
                                                    background: 'linear-gradient(90deg, #c9a55c 0%, #d4b896 50%, #c9a55c 100%)',
                                                    boxShadow: '0 0 8px rgba(201, 165, 92, 0.5)',
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Queue Info */}
                                    {generatingAngles && (
                                        <div className="mt-6 px-6 py-3 rounded-xl slide-up" style={{
                                            background: 'rgba(201, 165, 92, 0.08)',
                                            border: '1px solid rgba(201, 165, 92, 0.2)',
                                        }}>
                                            <p className="text-sm font-medium text-center" style={{ color: '#9a7b4f' }}>
                                                🎯 Processing your angle generation request
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Error State */}
                            {error && !loading && (
                                <div className="text-center p-6 slide-up">
                                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 mx-auto" style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                    }}>
                                        <X className="w-10 h-10 text-red-500" />
                                    </div>
                                    <p className="text-lg md:text-xl mb-4 font-semibold" style={{ color: '#d32f2f' }}>{error}</p>
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 active:scale-95"
                                        style={{
                                            background: '#2c2c2c',
                                            color: 'white',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                        }}
                                    >
                                        Close
                                    </button>
                                </div>
                            )}

                            {/* Result Image */}
                            {resultImage && !loading && !error && (
                                <div
                                    className="w-full h-full flex items-center justify-center p-4 md:p-6 cursor-pointer group"
                                    onClick={() => setIsLightboxOpen(true)}
                                    title="Click to view full size"
                                >
                                    <img
                                        src={resultImage}
                                        alt="Try-On Result"
                                        className={`w-full h-full object-contain rounded-2xl transition-all duration-500 group-hover:scale-[1.02] ${imageRevealed ? 'modal-appear' : ''}`}
                                        style={{
                                            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12)',
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                        }}
                                    />


                                </div>
                            )}

                            {/* Compliment Popup */}
                            {showComplimentDialog && currentCompliment && (
                                <div
                                    className="absolute bottom-6 left-6 z-50 slide-up"
                                    style={{ maxWidth: '600px', width: 'calc(100% - 3rem)' }}
                                >
                                    <div className="rounded-2xl overflow-hidden" style={{
                                        background: 'rgba(255, 255, 255, 0.98)',
                                        backdropFilter: 'blur(20px)',
                                        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(201, 165, 92, 0.2)',
                                    }}>
                                        <div style={{
                                            height: '4px',
                                            background: 'linear-gradient(90deg, #c9a55c 0%, #d4b896 50%, #c9a55c 100%)',
                                        }} />

                                        <div className="px-6 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center" style={{
                                                    background: 'linear-gradient(135deg, #c9a55c 0%, #d4b896 100%)',
                                                }}>
                                                    <Sparkles className="w-5 h-5 text-white" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-base leading-relaxed font-serif italic mb-2.5" style={{ color: '#1a1a1a', fontWeight: 500 }}>
                                                        "{currentCompliment.message}"
                                                    </p>

                                                    <div className="flex flex-wrap gap-2">
                                                        {currentCompliment.emotion.map((emotion, index) => (
                                                            <span
                                                                key={index}
                                                                className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                                                                style={{
                                                                    background: 'rgba(201, 165, 92, 0.12)',
                                                                    color: '#9a7b4f',
                                                                }}
                                                            >
                                                                {emotion}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setShowComplimentDialog(false)}
                                                    className="flex-shrink-0 p-1.5 rounded-full transition-all duration-200 hover:bg-black/5 active:scale-90"
                                                    style={{ color: '#aaa' }}
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar - Premium Action Buttons */}
                    <div className="flex md:flex-col gap-3 md:w-56 flex-shrink-0">
                        <button
                            onClick={handleDownload}
                            disabled={!resultImage || loading}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2.5 py-4 px-4 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                            style={{
                                background: 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)',
                                color: 'white',
                                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                            }}
                        >
                            <Download className="w-5 h-5" />
                            <span>DOWNLOAD</span>
                        </button>

                        <button
                            onClick={handleShare}
                            disabled={!resultImage || loading}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2.5 py-4 px-4 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                            style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                color: '#2c2c2c',
                                border: '1px solid rgba(0,0,0,0.08)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                            }}
                        >
                            <Share2 className="w-5 h-5" />
                            <span>SHARE</span>
                        </button>

                        {onGenerateMoreAngles && (
                            <button
                                onClick={onGenerateMoreAngles}
                                disabled={generatingAngles || !resultImage || loading}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2.5 py-4 px-4 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                                style={{
                                    background: generatingAngles ? 'rgba(201, 165, 92, 0.15)' : 'linear-gradient(135deg, #c9a55c 0%, #d4b896 100%)',
                                    color: generatingAngles ? '#9a7b4f' : 'white',
                                    boxShadow: '0 6px 16px rgba(201, 165, 92, 0.3)',
                                }}
                            >
                                {generatingAngles ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                <span>{generatingAngles ? 'GENERATING...' : 'NEW ANGLE'}</span>
                            </button>
                        )}

                        <button
                            onClick={handleShopOutfit}
                            disabled={loading}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2.5 py-4 px-4 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                            style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                color: '#2c2c2c',
                                border: '1px solid rgba(0,0,0,0.08)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                            }}
                        >
                            <ShoppingBag className="w-5 h-5" />
                            <span>SHOP</span>
                        </button>


                        {/* Gallery Grid - Right Sidebar */}
                        {!loading && !generatingAngles && generatedImages && generatedImages.length > 1 && (
                            <div className="mt-2 p-3 rounded-2xl bg-white/50 border border-white/60">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">Generated Angles</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {generatedImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => onSelectImage?.(img)}
                                            className={`relative aspect-[3/4] w-full rounded-lg overflow-hidden transition-all duration-300 ${img === resultImage
                                                ? 'ring-2 ring-[#c9a55c] ring-offset-1 shadow-md scale-105 z-10'
                                                : 'opacity-70 hover:opacity-100 hover:scale-105 border border-gray-200'
                                                }`}
                                        >
                                            <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Lightbox */}
                {isLightboxOpen && resultImage && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        style={{
                            background: 'rgba(0, 0, 0, 0.96)',
                            backdropFilter: 'blur(24px)',
                        }}
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <button
                            onClick={() => setIsLightboxOpen(false)}
                            className="absolute top-8 right-8 p-4 rounded-full transition-all duration-300 hover:scale-110 hover:rotate-90 z-10"
                            style={{
                                background: 'rgba(255, 255, 255, 0.15)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                            }}
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>

                        <div className="relative w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                            <img
                                src={resultImage}
                                alt="Try-On Result - Full Size"
                                className="max-w-[92vw] max-h-[92vh] w-auto h-auto object-contain rounded-3xl modal-appear"
                                style={{
                                    boxShadow: '0 40px 120px rgba(0, 0, 0, 0.7)',
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
