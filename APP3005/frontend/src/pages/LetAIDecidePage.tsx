import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTryOnPurchaseRedirect } from '@/hooks/useTryOnPurchaseRedirect';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuraDisplayCard } from '@/components/ai-tryon/AuraDisplayCard';
import { AuthPopup } from '@/components/AuthPopup';
import { getAura, tryOnWithGemini, tryOnWithVertex, generateMoreAngles, getTryOnHistory } from '@/lib/api';
import { getAIRecommendations, type RecommendationRequest, type RecommendationsResponse, type RecommendationItem } from '@/lib/api-recommendations';
import { useRef } from 'react';
import { Sparkles, Heart, Star, AlertCircle, Loader2 } from 'lucide-react';
import { ProductCard } from '@/components/collection/ProductCard';
import { TryOnInterstitialModal } from "@/components/TryOnInterstitialModal";
import { TryOnResultModal } from '@/components/ai-tryon/TryOnResultModal';
import { TryOnUpgradePopup } from '@/components/ai-tryon/TryOnUpgradePopup';
import { FeedbackContextType } from '@/lib/api';
import {
    getTryOnLimitSnapshot,
    getTryOnUsageSnapshot,
    isTryOnLimitError,
    type TryOnUsageSnapshot,
} from '@/lib/try-on-limit';
import {
    TRYON_PROVIDER,
    getDefaultTryOnProvider,
    shouldShowMultipleTryOnProviders,
    type TryOnProvider,
} from '@/lib/try-on-environment';
import {
    getLatestBaseTryOnForCurrentAvatar,
    getLatestBaseTryOnForProduct,
    normalizeTryOnResultImage,
    type AuraAvatarRef,
    type TryOnHistoryItem,
    type TryOnHistoryResponse,
} from '@/lib/try-on-history';

interface AuraData {
    aura_id: string;
    user_id: string;
    image_url: string | null;
    model_url: string | null;
    tryon_model_url?: string | null;
    selected_avatar_id?: string | null;
    selected_avatar?: AuraAvatarRef | null;
    height_cm: number;
    weight_kg: number;
    skin_tone: string;
    gender: string;
    body_shape: string;
    body_size?: string;
    age_range: string;
    hair_style: string;
    beard: string | null;
    extra_attributes: any;
}

interface ProductImage {
    url: string;
    is_primary: boolean;
    order_index: number;
}

interface TryOnProduct {
    product_id: string;
    title: string;
    thumbnail: string | null;
    images?: ProductImage[];
    price_cents: number;
    currency: string;
    is_featured: boolean;
    likes: number;
    reviews: number;
    views: number;
    description?: string;
    creator: {
        store_name: string;
        verified: boolean;
    };
    metadata?: RecommendationItem['metadata'];
}

type TryOnResult = {
    success: boolean;
    resultImage?: string;
    message?: string;
    tryOnId?: string | number;
};

const inspirationalQuotes = [
    { quote: 'Style is a way to say who you are without having to speak.', author: 'Rachel Zoe' },
    { quote: 'Fashion is about dressing according to what is fashionable. Style is more about being yourself.', author: 'Oscar de la Renta' },
    { quote: 'Elegance is not standing out, but being remembered.', author: 'Giorgio Armani' },
    { quote: 'Fashion fades, only style remains the same.', author: 'Coco Chanel' },
    { quote: 'The joy of dressing is an art.', author: 'John Galliano' }
];

const occasions = [
    { value: 'Formal', label: 'Formal', icon: '👔', description: 'Professional & Elegant' },
    { value: 'Party', label: 'Party', icon: '🎉', description: 'Festive & Fun' },
    { value: 'Wedding', label: 'Wedding', icon: '💒', description: 'Traditional & Graceful' },
    { value: 'Casual luxury', label: 'Casual Luxury', icon: '✨', description: 'Relaxed & Refined' },
    { value: 'Resort', label: 'Resort', icon: '🏖️', description: 'Breezy & Comfortable' },
];

const RECOMMENDATION_LOADING_DELAY_MS = 3000;

const waitForRecommendationDelay = () =>
    new Promise((resolve) => {
        setTimeout(resolve, RECOMMENDATION_LOADING_DELAY_MS);
    });

const getProductImageUrl = (product: TryOnProduct): string | null => {
    const primaryImage = product.images?.find((image) => image.is_primary);
    const fallbackImage = primaryImage ?? product.images?.[0];
    return fallbackImage?.url ?? product.thumbnail ?? null;
};

const getAvatarImageUrl = (aura: AuraData | null): string | null =>
    aura?.tryon_model_url || aura?.model_url || aura?.image_url || null;

const buildGeminiTryOnAdditionalParams = (aura: AuraData | null) => ({
    aura_attributes: aura
        ? {
            height_cm: aura.height_cm,
            weight_kg: aura.weight_kg,
            skin_tone: aura.skin_tone,
            gender: aura.gender,
            body_shape: aura.body_shape,
            body_size: aura.body_size,
            age_range: aura.age_range,
            hair_style: aura.hair_style,
            beard: aura.beard,
            ...(aura.extra_attributes && typeof aura.extra_attributes === 'object'
                ? aura.extra_attributes
                : {}),
        }
        : undefined,
    // Hide the catalog model's face so only the selected Aura supplies identity.
    maskClothingModel: true,
    forceRegenerate: true,
});

const LetAIDecidePage = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading, fetchUser } = useAuth();
    const showMultipleTryOnProviders = shouldShowMultipleTryOnProviders();
    const defaultTryOnProvider = getDefaultTryOnProvider();
    const [aura, setAura] = useState<AuraData | null>(null);
    const [tryOnHistory, setTryOnHistory] = useState<TryOnHistoryItem[]>([]);
    const [loadingAura, setLoadingAura] = useState(true);
    const [showLoginPopup, setShowLoginPopup] = useState(false);
    const [showAuraPopup, setShowAuraPopup] = useState(false);
    const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentQuote] = useState(() => inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)]);
    const [selectedTryOnProduct, setSelectedTryOnProduct] = useState<TryOnProduct | null>(null);
    const [selectedTryOnProvider, setSelectedTryOnProvider] = useState<TryOnProvider>(defaultTryOnProvider);
    const [isTryOnModalOpen, setIsTryOnModalOpen] = useState(false);

    // AI Try-On State
    const [showResultModal, setShowResultModal] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [tryOnLoading, setTryOnLoading] = useState(false);
    const [tryOnError, setTryOnError] = useState<string | null>(null);
    const [generatingAngles, setGeneratingAngles] = useState(false);
    const [originalTryOnImage, setOriginalTryOnImage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [showFeedbackSheet, setShowFeedbackSheet] = useState(false);
    const [showUpgradePopup, setShowUpgradePopup] = useState(false);
    const [tryOnUsageSnapshot, setTryOnUsageSnapshot] = useState<TryOnUsageSnapshot>(
        getTryOnUsageSnapshot(user)
    );
    const [feedbackContext, setFeedbackContext] = useState<{
        type: FeedbackContextType;
        referenceId?: string;
        label?: string;
    } | null>(null);
    const feedbackCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [selectedTryOnLabel, setSelectedTryOnLabel] = useState<string>('');
    const currentUserName = user?.store_name || user?.email?.split('@')[0] || 'You';
    const currentTryOnUsage = getTryOnUsageSnapshot(user);
    const hasFreeTryOnsRemaining =
        user?.role === 'ADMIN' || currentTryOnUsage.remainingTryOns > 0;

    const closeFeedbackSheet = () => {
        if (feedbackCloseTimerRef.current) {
            clearTimeout(feedbackCloseTimerRef.current);
            feedbackCloseTimerRef.current = null;
        }
        setShowFeedbackSheet(false);
        setFeedbackContext(null);
    };

    const openUpgradePopup = (error?: { tryOnsUsed?: number; maxTryOns?: number }) => {
        setTryOnUsageSnapshot(getTryOnLimitSnapshot(error, user));
        setShowUpgradePopup(true);
    };

    const loadTryOnHistory = async (): Promise<TryOnHistoryItem[]> => {
        try {
            const history = await getTryOnHistory() as TryOnHistoryResponse;
            const nextTryOns = history.tryOns || [];
            setTryOnHistory(nextTryOns);
            return nextTryOns;
        } catch (error) {
            console.error('Failed to load try-on history:', error);
            return [];
        }
    };

    const openSavedTryOn = (
        savedTryOn: TryOnHistoryItem,
        product: TryOnProduct,
    ) => {
        const savedImage =
            normalizeTryOnResultImage(
                savedTryOn.resultImageUrl || savedTryOn.resultImage,
            ) ||
            normalizeTryOnResultImage(savedTryOn.compressedUrl) ||
            savedTryOn.resultImageUrl;

        setSelectedTryOnProduct(product);
        setSelectedTryOnLabel(savedTryOn.productTitle || product.title);
        setTryOnLoading(false);
        setGeneratingAngles(false);
        setTryOnError(null);
        setShowFeedbackSheet(false);
        setFeedbackContext(null);
        setResultImage(savedImage);
        setOriginalTryOnImage(savedImage);
        setGeneratedImages(savedImage ? [savedImage] : []);
        setShowResultModal(true);
    };

    useTryOnPurchaseRedirect(fetchUser);

    useEffect(() => {
        // Wait for auth to load
        if (authLoading) return;

        // Check if user is logged in
        if (!user) {
            console.log(' User not logged in, showing popup');
            setShowLoginPopup(true);
            setLoadingAura(false);
            return;
        }

        // User is logged in, check aura
        checkAuraStatus();
    }, [authLoading, user]);

    useEffect(() => {
        setTryOnUsageSnapshot(getTryOnUsageSnapshot(user));
    }, [user]);

    useEffect(() => {
        return () => {
            if (feedbackCloseTimerRef.current) {
                clearTimeout(feedbackCloseTimerRef.current);
            }
        };
    }, []);

    const checkAuraStatus = async () => {
        try {
            setLoadingAura(true);
            const auraData = await getAura();
            setAura(auraData);
            await loadTryOnHistory();
        } catch (error: any) {
            console.error('Error fetching Aura:', error);
            setShowAuraPopup(true);
        } finally {
            setLoadingAura(false);
        }
    };



    const handleGetRecommendations = async (occasion: string) => {
        if (!aura) {
            setShowAuraPopup(true);
            return;
        }

        try {
            setSelectedOccasion(occasion);
            setLoadingRecommendations(true);
            setError(null);

            const request: RecommendationRequest = {
                occasion: occasion as any,
                top_k: 12,
            };

            const delayPromise = waitForRecommendationDelay();
            const result = await getAIRecommendations(request);
            await delayPromise;

            // Sort helper: prioritize younger models (age <= 40), push older (> 40) to bottom
            const ageSorter = (a: RecommendationItem, b: RecommendationItem) => {
                const ageA = a.metadata?.model_age || 0;
                const ageB = b.metadata?.model_age || 0;
                const isOldA = ageA > 40;
                const isOldB = ageB > 40;
                if (isOldA && !isOldB) return 1;
                if (!isOldA && isOldB) return -1;
                return 0;
            };

            if (result) {
                result.perfect_for_you.sort(ageSorter);
                result.good_for_you.sort(ageSorter);
                result.you_can_also_try.sort(ageSorter);
            }

            setRecommendations(result);
        } catch (error: any) {
            await waitForRecommendationDelay();
            console.error('Recommendation error:', error);
            setError(error.message || 'Failed to get recommendations. Please try again.');
        } finally {
            setLoadingRecommendations(false);
        }
    };

    const handleTryOn = async (
        product: TryOnProduct,
        provider: TryOnProvider = defaultTryOnProvider,
    ) => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/user-login');
            return;
        }

        if (!hasFreeTryOnsRemaining) {
            openUpgradePopup();
            return;
        }

        // Check permissions - BYPASSED: Allow all users
        if (false && user?.role !== 'ADMIN' && user?.try_on_permission !== 'APPROVED') {
            navigate('/ai-try-on');
            return;
        }

        // Use local aura state for instant check
        if (aura) {
            setSelectedTryOnProduct(product);
            setSelectedTryOnProvider(provider);
            setIsTryOnModalOpen(true);
        } else {
            // If local aura isn't loaded but might exist, we could fall back to auraGate,
            // but here we know we tried loading it on mount.
            setShowAuraPopup(true);
        }
    };

    const handleTryOnWithLabel = (
        product: TryOnProduct,
        label: string,
        provider: TryOnProvider = defaultTryOnProvider,
    ) => {
        setSelectedTryOnLabel(label);
        handleTryOn(product, provider);
    };

    const handleConfirmTryOn = () => {
        if (selectedTryOnProduct) {
            setIsTryOnModalOpen(false);
            executeTryOn(selectedTryOnProduct, selectedTryOnProvider);
        }
    };

    const executeTryOn = async (
        product: TryOnProduct,
        provider: TryOnProvider,
    ) => {
        if (!aura) return;

        try {
            if (feedbackCloseTimerRef.current) {
                clearTimeout(feedbackCloseTimerRef.current);
                feedbackCloseTimerRef.current = null;
            }

            setTryOnLoading(true);
            setTryOnError(null);
            setShowResultModal(true);

            let result: TryOnResult;

            if (provider === TRYON_PROVIDER.GEMINI) {
                const avatarImage = getAvatarImageUrl(aura);
                const clothingImage = getProductImageUrl(product);

                if (!avatarImage || !clothingImage) {
                    throw new Error('Try-on requires both avatar and clothing images');
                }

                result = await tryOnWithGemini({
                    avatarImage,
                    clothingImage,
                    additionalParams: buildGeminiTryOnAdditionalParams(aura),
                    productId: product.product_id,
                    auraId: aura?.aura_id,
                });
            } else {
                const avatarImage = getAvatarImageUrl(aura);
                const clothingImage = getProductImageUrl(product);

                if (!avatarImage || !clothingImage) {
                    throw new Error('Try-on requires both avatar and clothing images');
                }

                result = await tryOnWithVertex({
                    avatarImage,
                    clothingImage,
                    productId: product.product_id,
                    auraId: aura?.aura_id,
                });
            }

            if (result.success && result.resultImage) {
                const imageData = normalizeTryOnResultImage(result.resultImage);
                setResultImage(imageData);
                setOriginalTryOnImage(imageData);
                setGeneratedImages(imageData ? [imageData] : []);
                fetchUser();
                if (feedbackCloseTimerRef.current) {
                    clearTimeout(feedbackCloseTimerRef.current);
                    feedbackCloseTimerRef.current = null;
                }
                setFeedbackContext({
                    type: "VIRTUAL_TRYON",
                    referenceId: result.tryOnId ? String(result.tryOnId) : undefined,
                    label: selectedTryOnLabel,
                });
                await loadTryOnHistory();
            } else {
                throw new Error(result.message || 'Try-on failed');
            }
        } catch (error: any) {
            console.error('Try-on error:', error);
            if (isTryOnLimitError(error)) {
                setShowResultModal(false);
                setTryOnError(null);
                openUpgradePopup(error);
                return;
            }
            setTryOnError(error.message || 'Failed to process try-on. Please try again.');
        } finally {
            setTryOnLoading(false);
        }
    };

    const closeResultModal = () => {
        setShowResultModal(false);

        if (!showFeedbackSheet && !feedbackContext) {
            return;
        }

        if (feedbackCloseTimerRef.current) {
            clearTimeout(feedbackCloseTimerRef.current);
        }

        feedbackCloseTimerRef.current = setTimeout(() => {
            setShowFeedbackSheet(false);
            setFeedbackContext(null);
            feedbackCloseTimerRef.current = null;
        }, 1000);
    };

    const handleGenerateMoreAngles = async () => {
        if (!aura || !resultImage || !selectedTryOnProduct) return;
        if (!hasFreeTryOnsRemaining) {
            openUpgradePopup();
            return;
        }

        try {
            setGeneratingAngles(true);
            const result = await generateMoreAngles({
                userId: aura.user_id,
                productId: selectedTryOnProduct.product_id,
                previousImageUrl: originalTryOnImage || resultImage,
            });

            if (result.success && result.resultImage) {
                const imageData = normalizeTryOnResultImage(result.resultImage);
                setResultImage(imageData);
                setGeneratedImages(prev => imageData ? [...prev, imageData] : prev);
                fetchUser();
                await loadTryOnHistory();
            }
        } catch (error: any) {
            if (isTryOnLimitError(error)) {
                openUpgradePopup(error);
                return;
            }
            setTryOnError(error.message || 'Failed to generate angles');
        } finally {
            setGeneratingAngles(false);
        }
    };

    const mapToProduct = (item: RecommendationItem): TryOnProduct => {
        // Prepare images array from the item.images string array if available
        let productImages: Array<{ url: string; is_primary: boolean; order_index: number }> = [];

        if (item.images && item.images.length > 0) {
            productImages = item.images.map((url, index) => ({
                url: url,
                is_primary: index === 0,
                order_index: index
            }));
        } else if (item.image) {
            productImages = [{ url: item.image, is_primary: true, order_index: 0 }];
        }

        return {
            product_id: item.product_id || item.id, // Fallback to id if product_id is missing
            title: item.title || 'Recommended Item',
            thumbnail: item.image || (item.images && item.images[0]) || null,
            images: productImages,
            price_cents: item.price_cents || 0,
            currency: 'INR', // Defaulting to INR as per app context
            is_featured: false, // Default
            likes: 0, // Default, as we don't have this in recommendation data yet
            reviews: 0, // Default
            views: 0, // Default
            description: item.description,
            creator: {
                store_name: item.creator_name || 'Aivestire',
                verified: true
            },
            metadata: item.metadata
        };
    };

    const renderRecommendationProductCard = (product: TryOnProduct) => {
        const sameAvatarTryOn = getLatestBaseTryOnForCurrentAvatar(
            tryOnHistory,
            product.product_id,
            aura,
        );
        const anyAvatarTryOn = getLatestBaseTryOnForProduct(
            tryOnHistory,
            product.product_id,
        );
        const primaryTryOnLabel = sameAvatarTryOn
            ? 'View Try On'
            : showMultipleTryOnProviders
                ? defaultTryOnProvider === TRYON_PROVIDER.GEMINI
                    ? 'Gemini Try On'
                    : 'Vertex Try On'
                : 'Try On';
        const secondaryTryOnLabel =
            !sameAvatarTryOn && anyAvatarTryOn
                ? 'View Try On'
                : showMultipleTryOnProviders
                    ? 'Gemini Try On'
                    : undefined;

        return (
            <ProductCard
                key={product.product_id}
                product={product}
                loading={
                    selectedTryOnProduct?.product_id === product.product_id &&
                    (tryOnLoading || generatingAngles)
                }
                onTryOn={() =>
                    sameAvatarTryOn
                        ? openSavedTryOn(sameAvatarTryOn, product)
                        : handleTryOnWithLabel(
                            product,
                            product.title,
                            defaultTryOnProvider,
                        )
                }
                onTryOnGemini={
                    !sameAvatarTryOn && anyAvatarTryOn
                        ? () => openSavedTryOn(anyAvatarTryOn, product)
                        : showMultipleTryOnProviders && !sameAvatarTryOn
                            ? () =>
                                handleTryOnWithLabel(
                                    product,
                                    product.title,
                                    TRYON_PROVIDER.GEMINI,
                                )
                            : undefined
                }
                primaryTryOnLabel={primaryTryOnLabel}
                secondaryTryOnLabel={secondaryTryOnLabel}
            />
        );
    };

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F5F0E6 0%, #FFF8E7 50%, #F5F0E6 100%)' }}>
            <Navbar />

            <main className="pt-20 pb-12">
                <section className="pt-24 pb-12 bg-[#F8F4EC]">
                    <div className="container mx-auto px-4 text-center">
                        <div className="max-w-4xl mx-auto">
                            <h1 className="text-5xl md:text-6xl font-serif text-[#2C2C2C] mb-8 tracking-tight">
                                Let AI <span className="italic text-[#D4AF37]">Decide</span>
                            </h1>

                            <div className="relative py-8 px-12 inline-block">
                                <span className="absolute top-0 left-0 text-3xl text-[#D4AF37]/20 font-serif">"</span>
                                <p className="text-xl font-serif italic text-[#2C2C2C]/80 font-light max-w-2xl mx-auto leading-relaxed">
                                    {currentQuote.quote}
                                </p>
                                <span className="absolute bottom-4 right-0 text-3xl text-[#D4AF37]/20 font-serif rotate-180">"</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-8">
                    <div className="container mx-auto px-4">
                        {loadingAura && (
                            <div className="text-center py-20">
                                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gold border-t-transparent mb-4" />
                                <p className="text-charcoal/70 text-lg">Loading your Aura...</p>
                            </div>
                        )}

                        {!loadingAura && aura && (
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                <div className="lg:col-span-1">
                                    <AuraDisplayCard
                                        aura={aura}
                                        tryOnCount={user?.try_ons_used || 0}
                                        maxTryOns={user?.max_try_ons}
                                        onBuyTryOns={user?.role === 'ADMIN' ? undefined : () => openUpgradePopup()}
                                    />
                                </div>

                                <div className="lg:col-span-3 space-y-8">
                                    {!recommendations && (
                                        <>
                                            <div className="glass-panel rounded-3xl p-8">
                                                <h2 className="text-3xl font-serif font-bold text-charcoal mb-6 text-center">
                                                    Choose Your Occasion
                                                </h2>
                                                <p className="text-center text-charcoal/70 mb-8">
                                                    Select the occasion and let our AI find the perfect outfits for you
                                                </p>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {occasions.map((occasion) => (
                                                        <button
                                                            key={occasion.value}
                                                            onClick={() => handleGetRecommendations(occasion.value)}
                                                            disabled={loadingRecommendations}
                                                            className="glass-panel rounded-2xl p-6 border-2 border-gold/20 hover:border-gold hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <div className="text-5xl mb-3">{occasion.icon}</div>
                                                            <h3 className="text-xl font-serif font-bold text-charcoal mb-2">
                                                                {occasion.label}
                                                            </h3>
                                                            <p className="text-sm text-charcoal/60">
                                                                {occasion.description}
                                                            </p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {loadingRecommendations && (
                                                <div className="glass-panel rounded-3xl p-12 text-center">
                                                    <Loader2 className="w-16 h-16 text-gold animate-spin mx-auto mb-4" />
                                                    <h3 className="text-2xl font-serif font-bold text-charcoal mb-2">
                                                        AI is Curating Your Perfect Outfits...
                                                    </h3>
                                                    <p className="text-charcoal/70">
                                                        Analyzing your style preferences and body shape
                                                    </p>
                                                </div>
                                            )}

                                            {error && (
                                                <div className="glass-panel rounded-3xl p-8 border-2 border-red-500/30 bg-red-500/5">
                                                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                                    <p className="text-center text-charcoal font-medium">{error}</p>
                                                    <button
                                                        onClick={() => selectedOccasion && handleGetRecommendations(selectedOccasion)}
                                                        className="btn-gold-glow mt-4 mx-auto block"
                                                    >
                                                        Try Again
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {recommendations && !loadingRecommendations && (
                                        <div className="space-y-8">
                                            <div className="flex items-center justify-between mb-6">
                                                <h2 className="text-3xl font-serif font-bold text-charcoal">
                                                    Your Personalized Recommendations
                                                </h2>
                                                <button
                                                    onClick={() => {
                                                        setRecommendations(null);
                                                        setSelectedOccasion(null);
                                                    }}
                                                    className="btn-gold-glow"
                                                >
                                                    Choose Another Occasion
                                                </button>
                                            </div>

                                            {recommendations.perfect_for_you.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <Star className="w-6 h-6 text-gold fill-gold" />
                                                        <h3 className="text-2xl font-serif font-bold text-charcoal">
                                                            Perfect for You
                                                        </h3>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                        {recommendations.perfect_for_you.map((item) => {
                                                            const product = mapToProduct(item);
                                                            return renderRecommendationProductCard(product);
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {recommendations.good_for_you.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <Heart className="w-6 h-6 text-blue-500 fill-blue-500" />
                                                        <h3 className="text-2xl font-serif font-bold text-charcoal">
                                                            Good for You
                                                        </h3>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                        {recommendations.good_for_you.map((item) => {
                                                            const product = mapToProduct(item);
                                                            return renderRecommendationProductCard(product);
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                                        {recommendations.you_can_also_try.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <Sparkles className="w-6 h-6 text-purple-500" />
                                                        <h3 className="text-2xl font-serif font-bold text-charcoal">
                                                            You Can Also Try
                                                        </h3>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                        {recommendations.you_can_also_try.map((item) => {
                                                            const product = mapToProduct(item);
                                                            return renderRecommendationProductCard(product);
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <Footer />

            {/* Login Popup */}
            <AuthPopup
                isOpen={showLoginPopup}
                onClose={() => {
                    setShowLoginPopup(false);
                    navigate('/');
                }}
                type="login"
                onAction={() => navigate('/user-login')}
            />

            {/* Aura Popup */}
            <AuthPopup
                isOpen={showAuraPopup}
                onClose={() => navigate('/collection')}
                type="aura"
                onAction={() => navigate('/aura-dashboard')}
            />

            <TryOnInterstitialModal
                isOpen={isTryOnModalOpen}
                onClose={() => setIsTryOnModalOpen(false)}
                onConfirm={handleConfirmTryOn}
            />

            <TryOnUpgradePopup
                isOpen={showUpgradePopup}
                onClose={() => setShowUpgradePopup(false)}
                onPurchaseComplete={fetchUser}
                tryOnsUsed={tryOnUsageSnapshot.tryOnsUsed}
                maxTryOns={tryOnUsageSnapshot.maxTryOns}
            />

            <TryOnResultModal
                isOpen={showResultModal}
                onClose={closeResultModal}
                resultImage={resultImage}
                loading={tryOnLoading}
                error={tryOnError}
                onGenerateMoreAngles={handleGenerateMoreAngles}
                generatingAngles={generatingAngles}
                userPhoto={getAvatarImageUrl(aura)}
                garmentId={selectedTryOnProduct?.product_id}
                garmentTitle={selectedTryOnLabel || undefined}
                generatedImages={generatedImages}
                onSelectImage={(img) => setResultImage(img)}
                feedbackContext={
                    feedbackContext?.type === 'VIRTUAL_TRYON'
                        ? {
                            referenceId: feedbackContext.referenceId,
                            label: feedbackContext.label,
                        }
                        : null
                }
                userName={currentUserName}
            />
        </div>
    );
};

export default LetAIDecidePage;
