import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/collection/ProductCard";
import { usePublicProducts } from "@/hooks/useInfinitePublicProducts";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useTryOnPurchaseRedirect } from '@/hooks/useTryOnPurchaseRedirect';
import { auraGate } from "@/utils/auraGate";
import { ChevronDown, Heart, Search, X, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { TryOnResultModal } from '@/components/ai-tryon/TryOnResultModal';
import { TryOnUpgradePopup } from '@/components/ai-tryon/TryOnUpgradePopup';
import { GuestTryOnModal } from '@/components/collection/GuestTryOnModal';
import { AuraPromptDialog } from '@/components/aura/AuraPromptDialog';
import {
    tryOnWithGemini,
    tryOnWithVertex,
    generateMoreAngles,
    getAura,
    getTryOnHistory,
    getProductById,
    FeedbackContextType,
} from '@/lib/api';
import { cloudinaryImages } from "@/constants/cloudinaryImages";
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
    type TryOnHistoryItem,
    type TryOnHistoryResponse,
} from '@/lib/try-on-history';
import { getProductImageUrl } from '@/lib/product-image';
import _ from 'lodash';
import type { PublicProduct } from '@/hooks/useInfinitePublicProducts';

import { SORT_OPTIONS, STATIC_SIZES, STATIC_RATINGS, STATIC_DISCOUNTS } from '@/constants/filters';
import { FilterMultiSelect } from '@/components/collection/FilterMultiSelect';
import { CLOTHING_COLORS, BODY_SHAPES, SKIN_TONES } from '@/constants/product-hierarchy.enums';
import { Pagination } from "@/components/common/Pagination";
import { useCategories } from '@/hooks/useCategories';
import { useToast } from "@/hooks/use-toast";
import { WorkflowDiscoveryModal } from '@/components/WorkflowDiscoveryModal';
import {
    clearWorkflowDiscoveryPending,
    hasPendingWorkflowDiscovery,
    loginOnboardingSlides,
    workflowDiscoveryGalleryImages,
} from '@/constants/featureDiscovery';
import {
    getPulkitDemoProductPriority,
    getPulkitDemoTryOnUrl,
    isPulkitDemoUser,
    PULKIT_DEMO_TRYON_URLS,
} from '@/constants/pulkitDemo';

const getAvatarImageUrl = (aura: any): string | null =>
    aura?.tryon_model_url || aura?.model_url || aura?.image_url || null;

const buildGeminiTryOnAdditionalParams = (aura: any) => ({
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
    maskClothingModel: true,
    forceRegenerate: true,
});

type CollectionSection = "womens" | "mens";

const COMING_SOON_INTEREST_KEYS: Record<CollectionSection, string> = {
    womens: "aivestire:collection-interest:womens",
    mens: "aivestire:collection-interest:mens",
};

const getStoredCollectionInterest = (section: CollectionSection): boolean => {
    try {
        return localStorage.getItem(COMING_SOON_INTEREST_KEYS[section]) === "true";
    } catch {
        return false;
    }
};

type TryOnResult = {
    success: boolean;
    resultImage?: string;
    message?: string;
    tryOnId?: string | number;
};

const CollectionPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, fetchUser } = useAuth();
    const showMultipleTryOnProviders = shouldShowMultipleTryOnProviders();
    const defaultTryOnProvider = getDefaultTryOnProvider();
    const { lastAddedProductId, clearLastAddedProductId } = useCart();
    const { toast } = useToast();
    const sectionParam = new URLSearchParams(location.search).get("section");
    const activeCollectionSection: CollectionSection =
        location.pathname === "/mens" || sectionParam === "mens" ? "mens" : "womens";
    const isMensSection =
        activeCollectionSection === "mens";
    const collectionAudience = isMensSection ? "mens" : "womens";
    const [collectionInterest, setCollectionInterest] = useState<Record<CollectionSection, boolean>>(
        () => ({
            womens: getStoredCollectionInterest("womens"),
            mens: getStoredCollectionInterest("mens"),
        }),
    );

    const toggleCollectionInterest = () => {
        const nextInterested = !collectionInterest[activeCollectionSection];
        setCollectionInterest((current) => ({
            ...current,
            [activeCollectionSection]: nextInterested,
        }));
        try {
            localStorage.setItem(
                COMING_SOON_INTEREST_KEYS[activeCollectionSection],
                String(nextInterested),
            );
        } catch {
            // The current-page selection still works if storage is unavailable.
        }
    };

    // Aura Welcome Modal State
    const [showAuraWelcomeModal, setShowAuraWelcomeModal] = useState(false);
    const [showWorkflowDiscovery, setShowWorkflowDiscovery] = useState(false);
    const [isAuraResolved, setIsAuraResolved] = useState(false);

    // Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(30);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [selectedBodyShapes, setSelectedBodyShapes] = useState<string[]>([]);
    const [selectedSkinTones, setSelectedSkinTones] = useState<string[]>([]);
    const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
    const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
    const [sortBy, setSortBy] = useState("Price: Low to High");
    const [showFilters, setShowFilters] = useState(false);

    const [selectedTryOnProduct, setSelectedTryOnProduct] = useState<PublicProduct | null>(null);
    const [isGuestTryOnModalOpen, setIsGuestTryOnModalOpen] = useState(false);

    // AI Try-On State
    const [aura, setAura] = useState<any>(null);
    const [tryOnHistory, setTryOnHistory] = useState<TryOnHistoryItem[]>([]);
    const [showResultModal, setShowResultModal] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [tryOnLoading, setTryOnLoading] = useState(false);
    const [tryOnError, setTryOnError] = useState<string | null>(null);
    const [generatingAngles, setGeneratingAngles] = useState(false);
    const [originalTryOnImage, setOriginalTryOnImage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [currentGarmentImage, setCurrentGarmentImage] = useState<string | null>(null);
    const [currentUserPhoto, setCurrentUserPhoto] = useState<string | null>(null);
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

    useTryOnPurchaseRedirect(fetchUser);

    useEffect(() => {
        if (location.pathname === "/mens") {
            navigate("/collection?section=mens", { replace: true });
        }
    }, [location.pathname, navigate]);

    useEffect(() => {
        const shouldScroll =
            Boolean((location.state as { scrollToProducts?: boolean } | null)?.scrollToProducts) &&
            isMensSection &&
            !isLoading;
        if (!shouldScroll) return;

        const timeout = window.setTimeout(() => {
            document
                .getElementById("collection-products")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            navigate(`${location.pathname}${location.search}`, {
                replace: true,
                state: null,
            });
        }, 150);

        return () => window.clearTimeout(timeout);
    }, [
        isLoading,
        isMensSection,
        location.pathname,
        location.search,
        location.state,
        navigate,
    ]);

    const resolveProductLabel = (productId: string) => {
        const product = _.find(filteredProducts, (item) => item.product_id === productId);
        return product?.title || product?.name || productId;
    };
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
        product: PublicProduct,
    ) => {
        const savedImage =
            normalizeTryOnResultImage(
                savedTryOn.resultImageUrl || savedTryOn.resultImage,
            ) ||
            normalizeTryOnResultImage(savedTryOn.compressedUrl) ||
            savedTryOn.resultImageUrl;

        setSelectedTryOnProduct(product);
        setCurrentGarmentImage(getProductImageUrl(product) || savedTryOn.productImage);
        setCurrentUserPhoto(getAvatarImageUrl(aura));
        setTryOnLoading(false);
        setGeneratingAngles(false);
        setTryOnError(null);
        setShowFeedbackSheet(false);
        setFeedbackContext(null);
        setResultImage(savedImage);
        setOriginalTryOnImage(savedImage);
        setGeneratedImages(savedImage ? [savedImage] : []);
        setSelectedTryOnLabel(savedTryOn.productTitle || product.title);
        setShowResultModal(true);
    };

    const closeWorkflowDiscovery = () => {
        clearWorkflowDiscoveryPending();
        setShowWorkflowDiscovery(false);
    };

    // Fetch Aura for try-on and for gating the post-login onboarding popup
    useEffect(() => {
        if (user) {
            setIsAuraResolved(false);
            getAura()
                .then(async (nextAura) => {
                    setAura(nextAura);
                    await loadTryOnHistory();
                })
                .catch(() => {
                    setAura(null);
                })
                .finally(() => {
                    setIsAuraResolved(true);
                });
        } else {
            setAura(null);
            setIsAuraResolved(true);
        }
    }, [user]);

    useEffect(() => {
        setTryOnUsageSnapshot(getTryOnUsageSnapshot(user));
    }, [user]);

    useEffect(() => {
        if (!user || !isAuraResolved || !hasPendingWorkflowDiscovery()) {
            return;
        }

        setShowWorkflowDiscovery(true);
    }, [isAuraResolved, user]);

    useEffect(() => {
        return () => {
            if (feedbackCloseTimerRef.current) {
                clearTimeout(feedbackCloseTimerRef.current);
            }
        };
    }, []);

    // Show Aura Welcome Modal if coming from signup
    useEffect(() => {
        const state = location.state as { fromSignup?: boolean; showAuraModal?: boolean };
        if (state?.fromSignup && state?.showAuraModal) {
            setShowAuraWelcomeModal(true);
            // Clear the state so modal doesn't show again on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    // Debounce search
    const debouncedSearch = useDebounce(searchQuery, 500);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, selectedCategories, priceRange, sortBy, selectedSizes, selectedColors, selectedBodyShapes, selectedSkinTones, itemsPerPage]);

    // Fetch products with pagination
    const {
        data,
        isLoading,
        error,
    } = usePublicProducts(
        currentPage,
        itemsPerPage,
        debouncedSearch,
        selectedCategories.length > 0 ? selectedCategories : undefined,
        priceRange[0] === 0 ? undefined : priceRange[0],
        priceRange[1] === 5000 ? undefined : priceRange[1],
        sortBy,
        selectedSizes,
        selectedColors,
        selectedBodyShapes,
        selectedSkinTones,
        undefined,
        collectionAudience
    );

    const availableFilters = data?.availableFilters;

    // Fetch real admin-created categories from the backend
    const { data: categoriesData } = useCategories();
    const backendCategories = useMemo(
        () =>
            categoriesData && categoriesData.length > 0
                ? categoriesData.map((c) => c.name)
                : (availableFilters?.categories ?? []),
        [availableFilters?.categories, categoriesData]
    );
    useEffect(() => {
        setSelectedCategories([]);
        setCurrentPage(1);
    }, [activeCollectionSection]);

    // Scroll-to-last-added-item on back navigation
    useEffect(() => {
        if (!lastAddedProductId || isLoading) return;

        // Small delay to ensure DOM is rendered
        const timeout = setTimeout(() => {
            const el = document.getElementById(`product-card-${lastAddedProductId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Apply gold pulse highlight
                el.style.transition = 'box-shadow 0.3s ease, transform 0.3s ease';
                el.style.boxShadow = '0 0 0 3px rgba(212, 175, 55, 0.6), 0 8px 24px rgba(212, 175, 55, 0.25)';
                el.style.transform = 'scale(1.02)';
                el.style.borderRadius = '12px';

                // Remove highlight after 2s
                setTimeout(() => {
                    el.style.boxShadow = '';
                    el.style.transform = '';
                }, 2000);
            }
            clearLastAddedProductId();
        }, 500);

        return () => clearTimeout(timeout);
    }, [lastAddedProductId, isLoading, clearLastAddedProductId]);

    // Helper functions
    // ... kept for potential usage or removed if unused. 
    // Since local filtering is removed, we just use the data directly.

    // Sort products: prioritize younger models (age <= 40) at the top, older (> 40) at bottom
    // This runs client-side on the fetched pages
    const rawProducts = data?.products ?? [];
    const filteredProducts = [...rawProducts].sort((a, b) => {
        if (isMensSection && isPulkitDemoUser(user?.email)) {
            const priorityA =
                getPulkitDemoProductPriority(a.title) ||
                Number(a.metadata?.pulkit_demo_priority || 0);
            const priorityB =
                getPulkitDemoProductPriority(b.title) ||
                Number(b.metadata?.pulkit_demo_priority || 0);
            if (priorityA && priorityB) return priorityA - priorityB;
            if (priorityA) return -1;
            if (priorityB) return 1;
        }

        const ageA = a.metadata?.model_age ? parseInt(a.metadata.model_age) : 0;
        const ageB = b.metadata?.model_age ? parseInt(b.metadata.model_age) : 0;

        // Check if models are "older" (> 40)
        const isOldA = ageA > 40;
        const isOldB = ageB > 40;

        if (isOldA && !isOldB) return 1; // A is old, put it after B
        if (!isOldA && isOldB) return -1; // B is old, put it after A
        return 0; // Both same category, keep original sort order (from backend)
    });

    useEffect(() => {
        if (!isPulkitDemoUser(user?.email) || !isMensSection) return;

        const urls = [
            getAvatarImageUrl(aura),
            ...PULKIT_DEMO_TRYON_URLS,
            ...rawProducts.map((product) => product.metadata?.pulkit_demo_tryon_url),
        ].filter((url): url is string => typeof url === 'string' && Boolean(url));

        urls.forEach((url) => {
            const image = new Image();
            image.decoding = 'async';
            image.fetchPriority = 'high';
            image.src = url;
        });
    }, [aura, data?.products, isMensSection, user?.email]);

    // Count active filters for badge
    const activeFilterCount =
        selectedCategories.length +
        selectedSizes.length +
        selectedColors.length +
        selectedBodyShapes.length +
        selectedSkinTones.length +
        selectedRatings.length +
        selectedDiscounts.length +
        (priceRange[0] !== 0 || priceRange[1] !== 5000 ? 1 : 0);
    const handleTryOn = async (
        product: PublicProduct,
        provider: TryOnProvider = defaultTryOnProvider,
    ) => {
        if (tryOnLoading || generatingAngles) {
            setShowResultModal(true);
            return;
        }

        const token = localStorage.getItem('access_token');
        if (!token) {
            setSelectedTryOnProduct(product);
            setSelectedTryOnLabel(resolveProductLabel(product.product_id));
            setIsGuestTryOnModalOpen(true);
            return;
        }

        const isPulkitStaticDemo =
            isPulkitDemoUser(user?.email) &&
            Boolean(getPulkitDemoTryOnUrl(product.title));

        if (!isPulkitStaticDemo && !hasFreeTryOnsRemaining) {
            openUpgradePopup();
            return;
        }

        const clothingImage = getProductImageUrl(product, {
            requireRemote: true,
        });

        if (!clothingImage) {
            toast({
                title: "Try-on image is not ready",
                description: "This item needs a public product image before AI try-on. Please try another item.",
                variant: "destructive",
            });
            return;
        }

        // Check permissions - BYPASSED: Allow all users
        if (false && user?.role !== 'ADMIN' && user?.try_on_permission !== 'APPROVED') {
            navigate('/ai-try-on');
            return;
        }

        // OPTIMIZATION: Check local aura state first for instant response
        if (aura) {
            const avatarImage = getAvatarImageUrl(aura);

            if (!avatarImage) {
                setShowAuraWelcomeModal(true);
                return;
            }

            setSelectedTryOnProduct(product);
            setSelectedTryOnLabel(resolveProductLabel(product.product_id));
            void executeTryOn(product, provider);
            return;
        }

        // Fallback to network check if local state isn't ready
        const hasValidAura = await auraGate(navigate, '/aura-dashboard');
        if (hasValidAura) {
            try {
                const nextAura = await getAura();
                const avatarImage = getAvatarImageUrl(nextAura);

                if (!avatarImage) {
                    setShowAuraWelcomeModal(true);
                    return;
                }

                setAura(nextAura);
            } catch (error) {
                console.error('Failed to refresh Aura before try-on:', error);
                setShowAuraWelcomeModal(true);
                return;
            }

            setSelectedTryOnProduct(product);
            setSelectedTryOnLabel(resolveProductLabel(product.product_id));
            void executeTryOn(product, provider);
        }
    };

    const executeTryOn = async (
        product: PublicProduct,
        provider: TryOnProvider,
    ) => {
        if (!user) return; // Aura check handled by gate, but need user context

        try {
            if (feedbackCloseTimerRef.current) {
                clearTimeout(feedbackCloseTimerRef.current);
                feedbackCloseTimerRef.current = null;
            }

            setTryOnLoading(true);
            setTryOnError(null);
            setShowFeedbackSheet(false);
            setShowResultModal(true);
            setCurrentUserPhoto(getAvatarImageUrl(aura));

            let result: TryOnResult;
            let resolvedProductLabel =
                selectedTryOnLabel || resolveProductLabel(product.product_id);
            const pulkitStaticResult =
                isPulkitDemoUser(user.email)
                    ? getPulkitDemoTryOnUrl(product.title)
                    : null;

            if (pulkitStaticResult) {
                const clothingImage = getProductImageUrl(product, {
                    requireRemote: true,
                });
                setCurrentGarmentImage(clothingImage);
                // Replay the demo generation experience without calling an AI
                // provider. The fixed result is revealed after a short loader.
                await new Promise((resolve) => setTimeout(resolve, 2000));
                result = {
                    success: true,
                    resultImage: pulkitStaticResult,
                };
            } else if (provider === TRYON_PROVIDER.GEMINI) {
                let refreshedProduct = product;

                try {
                    refreshedProduct =
                        ((await getProductById(product.product_id)) as PublicProduct) ??
                        product;
                } catch (refreshError) {
                    console.warn(
                        'Failed to refresh product before Gemini try-on, using existing product data.',
                        refreshError,
                    );
                }

                const avatarImage = getAvatarImageUrl(aura);
                const clothingImage = getProductImageUrl(refreshedProduct, {
                    requireRemote: true,
                });
                resolvedProductLabel =
                    refreshedProduct.title || resolvedProductLabel;

                if (!avatarImage || !clothingImage) {
                    throw new Error(
                        !avatarImage
                            ? 'Please create or select your Aura avatar before using full virtual try-on.'
                            : 'This item image is still syncing. Please try another item for AI try-on.'
                    );
                }

                setCurrentGarmentImage(clothingImage);
                result = await tryOnWithGemini({
                    avatarImage,
                    clothingImage,
                    additionalParams: buildGeminiTryOnAdditionalParams(aura),
                    productId: product.product_id,
                    auraId: aura?.aura_id,
                });
            } else {
                const avatarImage = getAvatarImageUrl(aura);
                const clothingImage = getProductImageUrl(product, {
                    requireRemote: true,
                });

                if (!avatarImage || !clothingImage) {
                    throw new Error(
                        !avatarImage
                            ? 'Please create or select your Aura avatar before using full virtual try-on.'
                            : 'This item image is still syncing. Please try another item for AI try-on.'
                    );
                }

                setCurrentGarmentImage(clothingImage);
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
                setSelectedTryOnLabel(resolvedProductLabel);
                setFeedbackContext({
                    type: "VIRTUAL_TRYON",
                    referenceId: result.tryOnId ? String(result.tryOnId) : undefined,
                    label: resolvedProductLabel,
                });
                if (!pulkitStaticResult) {
                    await loadTryOnHistory();
                }
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
        if (!user || !resultImage || !selectedTryOnProduct) return;
        if (!hasFreeTryOnsRemaining) {
            openUpgradePopup();
            return;
        }

        try {
            setGeneratingAngles(true);
            const result = await generateMoreAngles({
                userId: aura?.user_id || user.user_id,
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

    return (
        <div className="min-h-screen bg-[#F5F0E6]">
            <Navbar />

            {/* Hero Header Image - Includes both hero and quote */}
            <section className="relative w-full bg-white pt-16 md:pt-20">
                <img
                    src={cloudinaryImages.collectionHeader}
                    alt="Crafted for the Confident"
                    className={
                        isMensSection
                            ? "w-full h-40 md:h-56 object-cover object-center"
                            : "w-full h-auto object-contain"
                    }
                />
            </section>

            {/* Elegant Search Bar Section */}
            <section className="bg-[#F8F4EC] border-b border-[#E8DCC4]">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-5 flex justify-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedCategories([]);
                                    navigate("/collection?section=womens");
                                }}
                                className="rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] transition-all"
                                style={{
                                    borderColor: !isMensSection ? "#D4AF37" : "#D4C5A9",
                                    background: !isMensSection ? "#2C2416" : "#FFFFFF",
                                    color: !isMensSection ? "#F8F4EC" : "#6B5D4F",
                                }}
                            >
                                Women
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedCategories([]);
                                    navigate("/collection?section=mens");
                                }}
                                className="rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] transition-all"
                                style={{
                                    borderColor: isMensSection ? "#D4AF37" : "#D4C5A9",
                                    background: isMensSection ? "#2C2416" : "#FFFFFF",
                                    color: isMensSection ? "#F8F4EC" : "#6B5D4F",
                                }}
                            >
                                Men
                            </button>
                        </div>

                        {/* Compact Search Title */}
                        <h2 className="text-center text-xs uppercase tracking-[0.25em] text-[#6B5D4F] mb-4 font-light">
                            {isMensSection ? "Discover Men's Style" : "Discover Women's Style"}
                        </h2>


                        {/* Compact Search Input */}
                        <div className="relative group">
                            <div className="relative">
                                {/* Search Icon - Compact */}
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-[#9B8B7E] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                                </div>

                                {/* Input - Smaller, Elegant */}
                                <input
                                    type="text"
                                    placeholder={
                                        isMensSection
                                            ? "Search men's designers, styles, or occasions..."
                                            : "Search by designer, style, or occasion..."
                                    }
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3 bg-white border border-[#D4C5A9] rounded-full text-[#2C2416] placeholder-[#9B8B7E]/60 focus:outline-none focus:border-[#D4AF37] focus:shadow-[0_4px_12px_rgba(212,175,55,0.15)] transition-all duration-300 text-sm font-light"
                                />

                                {/* Clear Button - Compact */}
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#9B8B7E] hover:text-[#D4AF37] transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Active Search Indicator - Compact */}
                        {searchQuery && (
                            <div className="mt-3 text-center animate-fadeIn">
                                <p className="text-xs text-[#6B5D4F] font-light">
                                    <span className="opacity-60">Searching for</span>
                                    <span className="mx-2 text-[#D4AF37] font-normal">"{searchQuery}"</span>
                                    <span className="opacity-60">• {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Premium Filter Bar */}
            {/* Premium Filter Bar */}
            <section className="bg-[#F8F4EC] border-b border-[#E8DCC4] shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        {/* Filter Toggle Button - Left */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-[#D4C5A9] hover:border-[#D4AF37] hover:bg-[#FDFBF7] transition-all group shadow-sm"
                        >
                            <SlidersHorizontal className="w-4 h-4 text-[#6B5D4F] group-hover:text-[#D4AF37] transition-colors" />
                            <span className="text-sm font-medium text-[#2C2416]">Filters</span>
                            {activeFilterCount > 0 && (
                                <span className="ml-1 px-2 py-0.5 bg-[#D4AF37] text-white text-xs rounded-full font-medium">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {/* Active Filters Pills - Center */}
                        <div className="flex-1 flex items-center gap-2 overflow-x-auto hide-scrollbar">
                            {selectedCategories.map(cat => (
                                <div key={cat} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D4C5A9] rounded-full text-sm whitespace-nowrap shadow-sm">
                                    <span className="text-[#2C2416]">{cat}</span>
                                    <button
                                        onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== cat))}
                                        className="text-[#9B8B7E] hover:text-[#D4AF37] transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                            {selectedSizes.map(size => (
                                <div key={size} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D4C5A9] rounded-full text-sm whitespace-nowrap shadow-sm">
                                    <span className="text-[#2C2416]">Size: {size}</span>
                                    <button
                                        onClick={() => setSelectedSizes(selectedSizes.filter(s => s !== size))}
                                        className="text-[#9B8B7E] hover:text-[#D4AF37] transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                            {selectedColors.map(color => (
                                <div key={color} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D4C5A9] rounded-full text-sm whitespace-nowrap shadow-sm">
                                    <span className="text-[#2C2416]">{color}</span>
                                    <button
                                        onClick={() => setSelectedColors(selectedColors.filter(c => c !== color))}
                                        className="text-[#9B8B7E] hover:text-[#D4AF37] transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                            {selectedRatings.map(rating => (
                                <div key={rating} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D4C5A9] rounded-full text-sm whitespace-nowrap shadow-sm">
                                    <span className="text-[#2C2416]">Rating: {rating}</span>
                                    <button
                                        onClick={() => setSelectedRatings(selectedRatings.filter(r => r !== rating))}
                                        className="text-[#9B8B7E] hover:text-[#D4AF37] transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                            {selectedDiscounts.map(discount => (
                                <div key={discount} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D4C5A9] rounded-full text-sm whitespace-nowrap shadow-sm">
                                    <span className="text-[#2C2416]">Discount: {discount}</span>
                                    <button
                                        onClick={() => setSelectedDiscounts(selectedDiscounts.filter(d => d !== discount))}
                                        className="text-[#9B8B7E] hover:text-[#D4AF37] transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                            {(priceRange[0] !== 0 || priceRange[1] !== 5000) && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D4C5A9] rounded-full text-sm whitespace-nowrap shadow-sm">
                                    <span className="text-[#2C2416]">₹{priceRange[0]} - ₹{priceRange[1]}</span>
                                    <button
                                        onClick={() => setPriceRange([0, 5000])}
                                        className="text-[#9B8B7E] hover:text-[#D4AF37] transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Sort Dropdown - Right */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="flex items-center gap-2 px-4 py-2 pr-10 rounded-full border border-[#D4C5A9] hover:border-[#D4AF37] transition-all text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:border-[#D4AF37] shadow-sm text-[#2C2416]"
                            >
                                {SORT_OPTIONS.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B8B7E] pointer-events-none" />
                        </div>
                    </div>

                    {/* Expandable Filter Panel */}
                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-[#E8DCC4] animate-slideDown">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Category - populated from admin-created backend categories */}
                                <FilterMultiSelect
                                    label="Category"
                                    options={backendCategories}
                                    selectedValues={selectedCategories}
                                    onChange={setSelectedCategories}
                                />

                                {/* Size */}
                                <FilterMultiSelect
                                    label="Size"
                                    options={STATIC_SIZES}
                                    selectedValues={selectedSizes}
                                    onChange={setSelectedSizes}
                                />

                                {/* Color */}
                                <FilterMultiSelect
                                    label="Color"
                                    options={CLOTHING_COLORS.map(c => c.label)}
                                    selectedValues={selectedColors}
                                    onChange={setSelectedColors}
                                />

                                {/* Body Shape */}
                                <FilterMultiSelect
                                    label="Body Shape"
                                    options={BODY_SHAPES.map(b => b.label)}
                                    selectedValues={selectedBodyShapes}
                                    onChange={setSelectedBodyShapes}
                                />
                                
                                {/* Skin Tone */}
                                <FilterMultiSelect
                                    label="Skin Tone"
                                    options={SKIN_TONES.map(s => s.label)}
                                    selectedValues={selectedSkinTones}
                                    onChange={setSelectedSkinTones}
                                />

                                {/* Rating */}
                                <FilterMultiSelect
                                    label="Rating"
                                    options={STATIC_RATINGS}
                                    selectedValues={selectedRatings}
                                    onChange={setSelectedRatings}
                                />

                                {/* Discount */}
                                <FilterMultiSelect
                                    label="Discount"
                                    options={STATIC_DISCOUNTS}
                                    selectedValues={selectedDiscounts}
                                    onChange={setSelectedDiscounts}
                                />

                                {/* Price Range */}
                                <div>
                                    <label className="block text-xs font-medium text-[#6B5D4F] mb-2 uppercase tracking-wide">Price Range</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={priceRange[0]}
                                            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                            className="w-full px-3 py-2.5 bg-white border border-[#E8DCC4] rounded-lg text-sm text-[#2C2416] focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={priceRange[1]}
                                            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                            className="w-full px-3 py-2.5 bg-white border border-[#E8DCC4] rounded-lg text-sm text-[#2C2416] focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Products Section */}
            <main id="collection-products" className="py-12 scroll-mt-24">
                <div className="max-w-7xl mx-auto px-4">
                    {/* Products Grid */}
                    {isLoading ? (
                        <div className="text-center py-20">
                            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#D4AF37] border-t-transparent"></div>
                            <p className="mt-6 text-[#6B5D4F]">Loading collection...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <p className="text-[#6B5D4F]">Failed to load products</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-lg mb-2 text-[#2C2416]">No products found</p>
                            <p className="text-[#6B5D4F]">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {filteredProducts.map(product => {
                                    const isStaticDemoProduct =
                                        isPulkitDemoUser(user?.email) &&
                                        Boolean(getPulkitDemoTryOnUrl(product.title));
                                    const sameAvatarTryOn =
                                        getLatestBaseTryOnForCurrentAvatar(
                                            tryOnHistory,
                                            product.product_id,
                                            aura,
                                        );
                                    const anyAvatarTryOn =
                                        getLatestBaseTryOnForProduct(
                                            tryOnHistory,
                                            product.product_id,
                                        );
                                    const primaryTryOnLabel = isStaticDemoProduct
                                        ? 'Try On'
                                        : sameAvatarTryOn
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
                                                isStaticDemoProduct
                                                    ? handleTryOn(
                                                        product,
                                                        defaultTryOnProvider,
                                                    )
                                                    : sameAvatarTryOn
                                                    ? openSavedTryOn(sameAvatarTryOn, product)
                                                    : handleTryOn(
                                                        product,
                                                        defaultTryOnProvider,
                                                    )
                                            }
                                            onTryOnGemini={
                                                isStaticDemoProduct
                                                    ? undefined
                                                    : !sameAvatarTryOn && anyAvatarTryOn
                                                    ? () => openSavedTryOn(anyAvatarTryOn, product)
                                                    : showMultipleTryOnProviders && !sameAvatarTryOn
                                                        ? () =>
                                                            handleTryOn(
                                                                product,
                                                                TRYON_PROVIDER.GEMINI,
                                                            )
                                                        : undefined
                                            }
                                            primaryTryOnLabel={primaryTryOnLabel}
                                            secondaryTryOnLabel={secondaryTryOnLabel}
                                        />
                                    );
                                })}
                            </div>

                            {/* Pagination and Items Per Page selection */}
                            {data?.pagination && data.pagination.totalPages > 1 && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={data.pagination.totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            )}
                            
                            <div className="flex flex-wrap justify-center items-center mt-6 gap-2">
                                <span className="text-sm text-[#6B5D4F]">Items per page:</span>
                                <select 
                                    className="px-2 py-1 rounded-md bg-[#F8F4EC] border border-[#D4C5A9] text-sm focus:outline-none"
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value={30}>30</option>
                                    <option value={40}>40</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        </>
                    )}
                </div>

                {/* New collection interest */}
                <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20">
                    <div className="max-w-2xl">
                        <p className="text-lg font-medium leading-8 text-[#2C2416] sm:text-xl">
                            Looking for more?
                        </p>
                        <p className="mt-2 text-base leading-7 text-[#6B6258]">
                            {isMensSection
                                ? "We’re preparing 11 new men’s designs across 3 categories. Let us know if you’d like to see them in the collection."
                                : "We’re preparing 16 new women’s designs across 5 categories. Let us know if you’d like to see them in the collection."}
                        </p>

                        <label className="mt-5 flex min-h-11 w-fit cursor-pointer items-center gap-3 text-sm font-medium text-[#2C2416]">
                            <input
                                type="checkbox"
                                checked={collectionInterest[activeCollectionSection]}
                                onChange={toggleCollectionInterest}
                                className="h-5 w-5 rounded border-[#D4C5A9] accent-[#D4AF37]"
                            />
                            <span>
                                {collectionInterest[activeCollectionSection]
                                    ? "Interest saved"
                                    : "I’m interested"}
                                </span>
                            </label>
                        </div>
                </div>
            </main>

            <Footer />

            <WorkflowDiscoveryModal
                isOpen={showWorkflowDiscovery}
                slides={loginOnboardingSlides}
                galleryImages={workflowDiscoveryGalleryImages}
                onClose={closeWorkflowDiscovery}
            />

            <AuraPromptDialog
                isOpen={showAuraWelcomeModal}
                onAccept={() => {
                    setShowAuraWelcomeModal(false);
                    navigate('/aura-dashboard');
                }}
                onDecline={() => setShowAuraWelcomeModal(false)}
            />

            <TryOnUpgradePopup
                isOpen={showUpgradePopup}
                onClose={() => setShowUpgradePopup(false)}
                onPurchaseComplete={fetchUser}
                tryOnsUsed={tryOnUsageSnapshot.tryOnsUsed}
                maxTryOns={tryOnUsageSnapshot.maxTryOns}
            />

            <GuestTryOnModal
                isOpen={isGuestTryOnModalOpen}
                product={selectedTryOnProduct}
                garmentGender={isMensSection ? "male" : "female"}
                onClose={() => setIsGuestTryOnModalOpen(false)}
                onLogin={() => {
                    setIsGuestTryOnModalOpen(false);
                    navigate('/user-login', {
                        state: { returnUrl: `${location.pathname}${location.search}` },
                    });
                }}
            />

            <TryOnResultModal
                isOpen={showResultModal}
                onClose={closeResultModal}
                resultImage={resultImage}
                loading={tryOnLoading}
                error={tryOnError}
                comparisonImage={originalTryOnImage}
                onGenerateMoreAngles={handleGenerateMoreAngles}
                generatingAngles={generatingAngles}
                userPhoto={currentUserPhoto || getAvatarImageUrl(aura)}
                garmentImage={currentGarmentImage || undefined}
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

export default CollectionPage;
