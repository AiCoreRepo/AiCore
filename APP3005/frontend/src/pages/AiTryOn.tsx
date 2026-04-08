import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuraDisplayCard } from "@/components/ai-tryon/AuraDisplayCard";
import { ClothingItemCard } from "@/components/ai-tryon/ClothingItemCard";
import { TryOnResultModal } from "@/components/ai-tryon/TryOnResultModal";
import { TryOnGalleryModal } from "@/components/ai-tryon/TryOnGalleryModal";
import { TryOnUpgradePopup } from "@/components/ai-tryon/TryOnUpgradePopup";
import { AuthPopup } from "@/components/AuthPopup";
import { usePublicProducts } from "@/hooks/usePublicProducts";
import {
  getAura,
  getProductById,
  tryOnWithGemini,
  tryOnWithVertex,
  generateMoreAngles,
  getTryOnHistory,
  requestTryOnAccess,
  FeedbackContextType,
} from "@/lib/api";
import { Sparkles, AlertCircle, Images, Lock, Clock } from "lucide-react";
import "@/components/ai-tryon/ai-tryon-styles.css";
import {
  getTryOnLimitSnapshot,
  getTryOnUsageSnapshot,
  isTryOnLimitError,
  TRY_ON_PREMIUM_UPGRADE_URL,
  type TryOnUsageSnapshot,
} from "@/lib/try-on-limit";
import {
  TRYON_PROVIDER,
  getDefaultTryOnProvider,
  shouldShowMultipleTryOnProviders,
  type TryOnProvider,
} from "@/lib/try-on-environment";
import _ from "lodash";
import type { PublicProduct } from "@/hooks/usePublicProducts";

interface AuraData {
  aura_id: string;
  user_id: string;
  image_url: string | null;
  model_url: string | null;
  tryon_model_url?: string | null;
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
  is_primary?: boolean;
  order_index?: number;
}

type TryOnProduct = PublicProduct & {
  images?: ProductImage[];
  thumbnail?: string | null;
};

type TryOnResult = {
  success: boolean;
  resultImage?: string;
  message?: string;
  tryOnId?: string | number;
};

type AutoTryOnNavigationState = {
  autoTryOnProductId?: string;
  autoTryOnProvider?: TryOnProvider;
  autoTryOnProduct?: TryOnProduct;
};

const getProductImageUrl = (product: TryOnProduct): string | null => {
  const primaryImage = _.find(product.images, (image) => image.is_primary);
  const fallbackImage = primaryImage ?? _.head(product.images);
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
        ...(aura.extra_attributes && typeof aura.extra_attributes === "object"
          ? aura.extra_attributes
          : {}),
      }
    : undefined,
  maskClothingModel: false,
});

const AiTryOn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = location.state as AutoTryOnNavigationState | null;
  const { user, loading: authLoading, fetchUser } = useAuth();
  const showMultipleTryOnProviders = shouldShowMultipleTryOnProviders();
  const defaultTryOnProvider = getDefaultTryOnProvider();
  const [aura, setAura] = useState<AuraData | null>(null);
  const [loadingAura, setLoadingAura] = useState(true);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showAuraPopup, setShowAuraPopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [originalTryOnImage, setOriginalTryOnImage] = useState<string | null>(
    null,
  ); // Stores the FIRST try-on result for face consistency
  const [tryOnError, setTryOnError] = useState<string | null>(null);
  const [generatingAngles, setGeneratingAngles] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [tryOnHistory, setTryOnHistory] = useState<any[]>([]);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [showFeedbackSheet, setShowFeedbackSheet] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [tryOnUsageSnapshot, setTryOnUsageSnapshot] =
    useState<TryOnUsageSnapshot>(getTryOnUsageSnapshot(user));
  const [feedbackContext, setFeedbackContext] = useState<{
    type: FeedbackContextType;
    referenceId?: string;
    label?: string;
  } | null>(null);
  const feedbackCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [pendingAutoTryOnProductId, setPendingAutoTryOnProductId] = useState<
    string | null
  >(navigationState?.autoTryOnProductId || null);
  const [pendingAutoTryOnProvider, setPendingAutoTryOnProvider] =
    useState<TryOnProvider>(
      navigationState?.autoTryOnProvider || defaultTryOnProvider,
    );
  const [pendingAutoTryOnProduct, setPendingAutoTryOnProduct] =
    useState<TryOnProduct | null>(navigationState?.autoTryOnProduct || null);

  // Fetch products
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = usePublicProducts(1);

  const resolveProductLabel = (productId: string) => {
    const product = _.find(
      productsData?.products,
      (item) => item.product_id === productId,
    );
    return product?.title || product?.name || productId;
  };
  const currentUserName =
    user?.store_name || user?.email?.split("@")[0] || "You";
  const currentTryOnUsage = getTryOnUsageSnapshot(user);
  const hasFreeTryOnsRemaining =
    user?.role === "ADMIN" || currentTryOnUsage.remainingTryOns > 0;

  const closeFeedbackSheet = () => {
    if (feedbackCloseTimerRef.current) {
      clearTimeout(feedbackCloseTimerRef.current);
      feedbackCloseTimerRef.current = null;
    }
    setShowFeedbackSheet(false);
    setFeedbackContext(null);
  };

  const openUpgradePopup = (error?: {
    tryOnsUsed?: number;
    maxTryOns?: number;
  }) => {
    setTryOnUsageSnapshot(getTryOnLimitSnapshot(error, user));
    setShowUpgradePopup(true);
  };

  const handleUpgradeToPremium = () => {
    window.location.href = TRY_ON_PREMIUM_UPGRADE_URL;
  };

  // Check authentication and Aura status on mount
  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // Check if user is logged in
    if (!user) {
      console.log("❌ User not logged in, showing popup");
      setShowLoginPopup(true);
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
    } catch (error: any) {
      console.error("Error fetching Aura:", error);
      // User doesn't have Aura, show popup
      setShowAuraPopup(true);
    } finally {
      setLoadingAura(false);
    }
  };

  const handleTryOn = async (
    productId: string,
    provider: TryOnProvider = defaultTryOnProvider,
    sourceProduct?: TryOnProduct | null,
  ) => {
    if (!hasFreeTryOnsRemaining) {
      openUpgradePopup();
      return;
    }
    if (!aura) {
      setShowAuraPopup(true);
      return;
    }

    try {
      if (feedbackCloseTimerRef.current) {
        clearTimeout(feedbackCloseTimerRef.current);
        feedbackCloseTimerRef.current = null;
      }

      const fallbackProductLabel = sourceProduct?.title || resolveProductLabel(productId);
      setSelectedProduct(productId);
      setCurrentProductId(productId); // Store productId for angle generation
      setTryOnLoading(true);
      setTryOnError(null);
      setShowFeedbackSheet(false);
      setShowResultModal(true);

      let result: TryOnResult;
      let resolvedProductLabel = fallbackProductLabel;

      if (provider === TRYON_PROVIDER.GEMINI) {
        const product =
          sourceProduct?.product_id === productId
            ? sourceProduct
            : ((_.find(
                productsData?.products,
                (item) => item.product_id === productId,
              ) as TryOnProduct | undefined) ??
              ((await getProductById(productId)) as TryOnProduct));
        resolvedProductLabel = product?.title || fallbackProductLabel;
        const avatarImage = getAvatarImageUrl(aura);
        const clothingImage = product ? getProductImageUrl(product) : null;

        if (!avatarImage || !clothingImage) {
          throw new Error("Try-on requires both avatar and clothing images");
        }

        result = await tryOnWithGemini({
          avatarImage,
          clothingImage,
          additionalParams: buildGeminiTryOnAdditionalParams(aura),
          productId,
          auraId: aura?.aura_id,
        });
      } else {
        const product =
          sourceProduct?.product_id === productId
            ? sourceProduct
            : ((_.find(
                productsData?.products,
                (item) => item.product_id === productId,
              ) as TryOnProduct | undefined) ??
              ((await getProductById(productId)) as TryOnProduct));

        resolvedProductLabel = product?.title || fallbackProductLabel;
        const avatarImage = getAvatarImageUrl(aura);
        const clothingImage = product ? getProductImageUrl(product) : null;

        if (!avatarImage || !clothingImage) {
          throw new Error("Try-on requires both avatar and clothing images");
        }

        result = await tryOnWithVertex({
          avatarImage,
          clothingImage,
          productId,
          auraId: aura?.aura_id,
        });
      }

      if (result.success && result.resultImage) {
        // Ensure the image has the data URI prefix
        const imageData = result.resultImage.startsWith("data:")
          ? result.resultImage
          : `data:image/jpeg;base64,${result.resultImage}`;
        setResultImage(imageData);
        setOriginalTryOnImage(imageData); // Store original for face consistency in angle generation
        setGeneratedImages([imageData]);
        if (feedbackCloseTimerRef.current) {
          clearTimeout(feedbackCloseTimerRef.current);
          feedbackCloseTimerRef.current = null;
        }
        setFeedbackContext({
          type: "VIRTUAL_TRYON",
          referenceId: result.tryOnId ? String(result.tryOnId) : undefined,
          label: resolvedProductLabel,
        });
        // Refresh user data to update try-on count
        fetchUser();
      } else {
        throw new Error(result.message || "Try-on failed");
      }
    } catch (error: any) {
      console.error("Try-on error:", error);
      if (isTryOnLimitError(error)) {
        setShowResultModal(false);
        setTryOnError(null);
        openUpgradePopup(error);
        return;
      }
      setTryOnError(
        error.message || "Failed to process try-on. Please try again.",
      );
    } finally {
      setTryOnLoading(false);
      setSelectedProduct(null);
    }
  };

  useEffect(() => {
    if (!aura || !pendingAutoTryOnProductId || tryOnLoading) return;

    const productId = pendingAutoTryOnProductId;
    const provider = pendingAutoTryOnProvider;
    const sourceProduct = pendingAutoTryOnProduct;
    setPendingAutoTryOnProductId(null);
    setPendingAutoTryOnProvider(defaultTryOnProvider);
    setPendingAutoTryOnProduct(null);
    handleTryOn(productId, provider, sourceProduct);

    // Clear one-time navigation state so auto-try doesn't trigger again on remount.
    navigate(location.pathname, { replace: true });
  }, [
    aura,
    pendingAutoTryOnProductId,
    pendingAutoTryOnProvider,
    pendingAutoTryOnProduct,
    tryOnLoading,
    defaultTryOnProvider,
    navigate,
    location.pathname,
  ]);

  const handleGenerateMoreAngles = async () => {
    if (!aura || !resultImage) return;
    if (!hasFreeTryOnsRemaining) {
      openUpgradePopup();
      return;
    }

    try {
      setGeneratingAngles(true);
      setTryOnError(null);

      // ALWAYS use the original try-on image as reference, not the current displayed image
      // This prevents face identity drift when generating back view (no face) and then other angles
      const result = await generateMoreAngles({
        userId: aura.user_id,
        productId: currentProductId!,
        previousImageUrl: originalTryOnImage || resultImage, // Use original for face consistency
      });

      if (result.success && result.resultImage) {
        const imageData = result.resultImage.startsWith("data:")
          ? result.resultImage
          : `data:image/jpeg;base64,${result.resultImage}`;
        setResultImage(imageData);
        setGeneratedImages((prev) => [...prev, imageData]);
        // Refresh user data to update try-on count
        fetchUser();
      } else {
        throw new Error(result.message || "Failed to generate more angles");
      }
    } catch (error: any) {
      console.error("Generate angles error:", error);
      if (isTryOnLimitError(error)) {
        openUpgradePopup(error);
        return;
      }
      setTryOnError(
        error.message || "Failed to generate more angles. Please try again.",
      );
    } finally {
      setGeneratingAngles(false);
    }
  };

  const handleRequestAccess = async () => {
    try {
      setRequestingAccess(true);
      await requestTryOnAccess();
      setRequestSuccess(true);
      // Optional: re-fetch user profile if it's cached in context
    } catch (error: any) {
      console.error("Request access error:", error);
      alert(error.message || "Failed to request access");
    } finally {
      setRequestingAccess(false);
    }
  };

  const closeResultModal = () => {
    setShowResultModal(false);
    setResultImage(null);
    setTryOnError(null);

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

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#F5F0E6",
      }}
    >
      <Navbar />

      <main className="pb-8 pt-24 md:pb-12 md:pt-32">
        {/* Header */}
        <section className="border-b border-[#D4AF37]/10 bg-[#F8F4EC] py-6 md:py-8">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 md:px-12">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center md:gap-6">
              <div className="flex-1">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-luxury-gold" />
                    <h1 className="text-[2rem] font-serif text-luxury-black md:text-4xl">
                      AI Virtual Try-On
                    </h1>
                  </div>
                  <p className="text-sm md:text-base text-neutral-500 font-light tracking-wide">
                    See how clothes look on your AI avatar before you buy
                  </p>
                </div>
              </div>

              <div className="flex shrink-0">
                <button
                  onClick={() => {
                    console.log("Gallery button clicked!");
                    getTryOnHistory()
                      .then((history) => {
                        console.log("Got history:", history);
                        setTryOnHistory(history.tryOns || []);
                        setShowGallery(true);
                      })
                      .catch((error) => {
                        console.error("Failed to load gallery:", error);
                        alert("Failed to load gallery: " + error.message);
                      });
                  }}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 hover:shadow-gold/10 active:scale-[0.98] sm:w-auto sm:px-7"
                  style={{
                    background: "#D4AF37",
                    color: "#FFFFFF",
                  }}
                >
                  <Images className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>My Gallery</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-6 md:py-8">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 md:px-12">
            {/* Loading State */}
            {loadingAura && (
              <div className="py-16 text-center md:py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-luxury-gold border-t-transparent mb-6" />
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 font-medium italic">
                  Summoning your digital twin...
                </p>
              </div>
            )}

            {/* Main Layout */}
            {!loadingAura && aura && (
              <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-12 lg:gap-10">
                {/* Left Sidebar - Aura Display (3/12) */}
                <div className="lg:col-span-3">
                  <AuraDisplayCard
                    aura={aura}
                    tryOnCount={user?.try_ons_used || 0}
                    maxTryOns={user?.max_try_ons}
                  />
                </div>

                {/* Right Content - Clothing Grid or Permission Gate */}
                {/* Right Content - Clothing Grid (9/12) */}
                <div className="lg:col-span-9">
                  {/* BYPASSED: Admin approval check - All users can now access try-on */}
                  {false &&
                  user?.role !== "ADMIN" &&
                  user?.try_on_permission !== "APPROVED" ? (
                    <div
                      className="p-16 rounded-[40px] text-center flex flex-col items-center justify-center gap-8 shadow-sm"
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid rgba(212, 175, 55, 0.15)",
                      }}
                    >
                      {user?.try_on_permission === "PENDING" ||
                      requestSuccess ? (
                        <>
                          <div className="w-24 h-24 rounded-full bg-[#F8F4EC] flex items-center justify-center mb-2">
                            <Clock className="w-10 h-10 text-luxury-gold animate-pulse" />
                          </div>
                          <h2 className="text-4xl font-serif text-luxury-black">
                            Access Under Review
                          </h2>
                          <p className="text-charcoal/60 max-w-md mx-auto">
                            Your request to use Virtual Try-On is being reviewed
                            by our team. We will notify you once you have been
                            granted access.
                          </p>
                          <button
                            onClick={() => navigate("/collection")}
                            className="px-10 py-3.5 rounded-xl font-medium text-xs tracking-widest uppercase border border-luxury-gold text-luxury-gold hover:bg-luxury-gold/5 transition-all"
                          >
                            Browse Collection
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-24 h-24 rounded-full bg-[#F8F4EC] flex items-center justify-center mb-2">
                            <Lock className="w-10 h-10 text-luxury-gold" />
                          </div>
                          <h2 className="text-4xl font-serif text-luxury-black">
                            Access Required
                          </h2>
                          <p className="text-charcoal/60 max-w-md mx-auto">
                            Virtual Try-On is currently restricted to approved
                            users during this phase. Request access now to try
                            on outfits with your AI avatar.
                          </p>
                          <button
                            onClick={handleRequestAccess}
                            disabled={requestingAccess}
                            className="px-12 py-4 rounded-xl font-medium text-xs tracking-[0.2em] uppercase text-white transition-all shadow-lg hover:shadow-gold/20 active:scale-[0.98]"
                            style={{
                              background: "#D4AF37",
                            }}
                          >
                            {requestingAccess
                              ? "Requesting..."
                              : "Request Try-On Access"}
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Products Loading */}
                      {productsLoading && (
                        <div className="py-20 text-center md:py-24">
                          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-luxury-gold border-t-transparent mb-6" />
                          <p className="text-xs uppercase tracking-widest text-neutral-400 italic">
                            Curating your selection...
                          </p>
                        </div>
                      )}

                      {/* Products Error */}
                      {productsError && (
                        <div
                          className="p-8 rounded-2xl text-center"
                          style={{
                            background: "rgba(239, 68, 68, 0.05)",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                          }}
                        >
                          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                          <p className="text-charcoal font-medium">
                            Failed to load clothing items. Please try again
                            later.
                          </p>
                        </div>
                      )}

                      {/* Products Grid */}
                      {!productsLoading &&
                        !productsError &&
                        productsData?.products && (
                          <>
                            <div className="mb-6 flex flex-col gap-3 border-b border-neutral-100 pb-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:pb-5">
                              <div>
                                <h2 className="text-2xl md:text-3xl font-serif text-luxury-black italic mb-1">
                                  Select Your Masterpiece
                                </h2>
                                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 font-medium">
                                  {
                                    productsData.products.filter((p: any) => {
                                      // Age filter: Only show models 40 or younger (or if age not specified)
                                      const age = p.metadata?.model_age;
                                      if (age && age > 40) return false;

                                      // Description filter: Must have a description
                                      if (
                                        !p.description ||
                                        p.description.trim() === ""
                                      )
                                        return false;

                                      // Quality filter: Remove "Bad quality" items
                                      if (
                                        p.title
                                          .toLowerCase()
                                          .includes("bad quality")
                                      )
                                        return false;

                                      return true;
                                    }).length
                                  }{" "}
                                  Designs Curated for Your Aura
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                              {productsData.products
                                .filter((product: any) => {
                                  // Age filter: Only show models 40 or younger (or if age not specified)
                                  const age = product.metadata?.model_age;
                                  if (age && age > 40) return false;

                                  // Description filter: Must have a description
                                  if (
                                    !product.description ||
                                    product.description.trim() === ""
                                  )
                                    return false;

                                  // Quality filter: Remove "Bad quality" items
                                  if (
                                    product.title
                                      .toLowerCase()
                                      .includes("bad quality")
                                  )
                                    return false;

                                  return true;
                                })
                                .map((product: any) => (
                                  <ClothingItemCard
                                    key={product.product_id}
                                    product={product}
                                    onTryOn={() =>
                                      handleTryOn(
                                        product.product_id,
                                        defaultTryOnProvider,
                                      )
                                    }
                                    onTryOnGemini={
                                      showMultipleTryOnProviders
                                        ? () =>
                                            handleTryOn(
                                              product.product_id,
                                              TRYON_PROVIDER.GEMINI,
                                            )
                                        : undefined
                                    }
                                    loading={
                                      selectedProduct === product.product_id &&
                                      tryOnLoading
                                    }
                                  />
                                ))}
                            </div>
                          </>
                        )}
                    </>
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
          navigate(-1);
        }}
        type="login"
        onAction={() => navigate("/user-login")}
      />

      {/* Aura Popup */}
      <AuthPopup
        isOpen={showAuraPopup}
        onClose={() => navigate("/collection")}
        type="aura"
        onAction={() => navigate("/aura-dashboard")}
      />

      <TryOnUpgradePopup
        isOpen={showUpgradePopup}
        onClose={() => setShowUpgradePopup(false)}
        onUpgrade={handleUpgradeToPremium}
        tryOnsUsed={tryOnUsageSnapshot.tryOnsUsed}
        maxTryOns={tryOnUsageSnapshot.maxTryOns}
      />

      {/* Try-On Result Modal */}
      <TryOnResultModal
        isOpen={showResultModal}
        onClose={closeResultModal}
        resultImage={resultImage}
        loading={tryOnLoading}
        error={tryOnError}
        comparisonImage={originalTryOnImage}
        onGenerateMoreAngles={handleGenerateMoreAngles}
        generatingAngles={generatingAngles}
        userPhoto={aura?.image_url}
        garmentId={currentProductId || undefined}
        garmentTitle={
          currentProductId ? resolveProductLabel(currentProductId) : undefined
        }
        generatedImages={generatedImages}
        onSelectImage={(img) => setResultImage(img)}
        feedbackContext={
          feedbackContext?.type === "VIRTUAL_TRYON"
            ? {
                referenceId: feedbackContext.referenceId,
                label: feedbackContext.label,
              }
            : null
        }
        userName={currentUserName}
      />

      {/* Gallery Modal */}
      <TryOnGalleryModal
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        tryOns={tryOnHistory}
      />
    </div>
  );
};

export default AiTryOn;
