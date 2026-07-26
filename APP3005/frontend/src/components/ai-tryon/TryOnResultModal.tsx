import {
  X,
  Download,
  Share2,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Loader2,
  Star,
  AlertCircle,
  MessageSquareText,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatedComplimentText } from "@/components/AnimatedComplimentText";
import { LOADING_QUOTES } from "./loading-quotes";
import { getComplimentForGarment, ComplimentMessage } from "./compliment-messages";
import { submitFeedback } from "@/lib/api";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface TryOnResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultImage: string | null;
  comparisonImage?: string | null;
  loading: boolean;
  error: string | null;
  onGenerateMoreAngles?: () => void;
  generatingAngles?: boolean;
  userPhoto?: string | null;
  garmentImage?: string | null;
  garmentId?: string;
  garmentTitle?: string;
  generatedImages?: string[];
  onSelectImage?: (image: string) => void;
  feedbackContext?: {
    referenceId?: string;
    label?: string;
  } | null;
  userName?: string;
  onComplimentComplete?: () => void;
}

interface ProcessStep {
  id: number;
  label: string;
  icon: string;
  status: "pending" | "active" | "complete";
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
  garmentTitle,
  generatedImages = [],
  feedbackContext,
  userName,
  onComplimentComplete,
}: TryOnResultModalProps) {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [imageRevealed, setImageRevealed] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentCompliment, setCurrentCompliment] =
    useState<ComplimentMessage | null>(null);
  const [hasShownCompliment, setHasShownCompliment] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showInlineFeedback, setShowInlineFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [showOptionalFeedbackNote, setShowOptionalFeedbackNote] =
    useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [hasCompletedUserPrompt, setHasCompletedUserPrompt] = useState(false);
  const [isMobileShayariCollapsed, setIsMobileShayariCollapsed] =
    useState(false);
  const [isMobileFeedbackOpen, setIsMobileFeedbackOpen] = useState(false);
  const wasOpenRef = useRef(false);
  const previousLoadingRef = useRef(false);
  const feedbackRevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const mobileShayariCollapseTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const lightboxHistoryActiveRef = useRef(false);
  const chatScrollContainersRef = useRef<Record<string, HTMLDivElement | null>>(
    {},
  );

  // Progress State
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // Refs for monotonic progress (prevents backward jumps)
  const progressRef = useRef(0);
  const hasTriggeredComplimentCompleteRef = useRef(false);

  const navigate = useNavigate();
  const displayUserName = userName?.trim() || "You";
  const displayGarmentTitle = garmentTitle?.trim() || "this look";
  const carouselImages =
    generatedImages.length > 0
      ? generatedImages
      : resultImage
        ? [resultImage]
        : [];
  const hasMultipleGeneratedImages = carouselImages.length > 1;
  const activeImageIndex = resultImage
    ? Math.max(carouselImages.indexOf(resultImage), 0)
    : 0;
  const activeDisplayImage = carouselImages[currentImageIndex] || resultImage;
  const isProcessingState = loading || generatingAngles;
  const showMobileActionBar =
    Boolean(resultImage) && !loading && !generatingAngles && !error;
  const userPrompt = garmentTitle
    ? `How does ${displayGarmentTitle} look on me? Does it suit me?`
    : "How does this look on me? Does it suit me?";
  const userInitial = displayUserName.charAt(0).toUpperCase();
  const feedbackRequiresComment = feedbackRating > 0 && feedbackRating <= 3;
  const showFeedbackCommentField =
    feedbackRequiresComment ||
    showOptionalFeedbackNote ||
    feedbackComment.trim().length > 0;
  const canSubmitFeedback =
    feedbackRating > 0 &&
    (!feedbackRequiresComment || feedbackComment.trim().length >= 4);

  const processSteps: ProcessStep[] = [
    { id: 1, label: "Analyzing Image", icon: "🔍", status: "pending" },
    { id: 2, label: "AI Processing", icon: "🤖", status: "pending" },
    { id: 3, label: "Rendering Result", icon: "✨", status: "pending" },
    { id: 4, label: "Finalizing", icon: "🎨", status: "pending" },
  ];

  // Reset the conversation only for a fresh try-on, not for angle generation.
  useEffect(() => {
    const openedNow = isOpen && !wasOpenRef.current;
    const startedFreshTryOn = isOpen && loading && !previousLoadingRef.current;

    if (openedNow || startedFreshTryOn) {
      if (feedbackRevealTimerRef.current) {
        clearTimeout(feedbackRevealTimerRef.current);
        feedbackRevealTimerRef.current = null;
      }
      if (mobileShayariCollapseTimerRef.current) {
        clearTimeout(mobileShayariCollapseTimerRef.current);
        mobileShayariCollapseTimerRef.current = null;
      }
      setHasShownCompliment(false);
      setCurrentCompliment(null);
      setImageRevealed(false);
      hasTriggeredComplimentCompleteRef.current = false;
      setLoadingProgress(0);
      setCurrentStep(0);
      progressRef.current = 0;
      setShowInlineFeedback(false);
      setFeedbackRating(0);
      setFeedbackComment("");
      setShowOptionalFeedbackNote(false);
      setFeedbackSubmitting(false);
      setFeedbackSubmitted(false);
      setFeedbackError("");
      setHasCompletedUserPrompt(false);
      setIsMobileShayariCollapsed(false);
      setIsMobileFeedbackOpen(false);
      setCurrentImageIndex(activeImageIndex);
    }

    wasOpenRef.current = isOpen;
    previousLoadingRef.current = loading;
  }, [
    activeImageIndex,
    isOpen,
    loading,
  ]);

  // The modal stays mounted between try-ons. Reset its message explicitly
  // whenever the selected garment changes to prevent a stale shayari.
  useEffect(() => {
    setHasShownCompliment(false);
    setCurrentCompliment(null);
    hasTriggeredComplimentCompleteRef.current = false;
  }, [garmentTitle]);

  useEffect(() => {
    return () => {
      if (feedbackRevealTimerRef.current) {
        clearTimeout(feedbackRevealTimerRef.current);
      }
      if (mobileShayariCollapseTimerRef.current) {
        clearTimeout(mobileShayariCollapseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setHasCompletedUserPrompt(false);
  }, [currentCompliment?.id]);

  useEffect(() => {
    if (!carouselApi || carouselImages.length === 0) {
      return;
    }

    const syncFromCarousel = () => {
      const nextIndex = Math.max(
        0,
        Math.min(carouselApi.selectedScrollSnap(), carouselImages.length - 1),
      );
      setCurrentImageIndex(nextIndex);
    };

    carouselApi.on("select", syncFromCarousel);
    carouselApi.on("reInit", syncFromCarousel);

    return () => {
      carouselApi.off("select", syncFromCarousel);
      carouselApi.off("reInit", syncFromCarousel);
    };
  }, [carouselApi, carouselImages.length]);

  useEffect(() => {
    if (!carouselApi || carouselImages.length === 0) {
      return;
    }

    const nextIndex = Math.min(activeImageIndex, carouselImages.length - 1);
    setCurrentImageIndex(nextIndex);
    const frameId = window.requestAnimationFrame(() => {
      if (carouselApi.selectedScrollSnap() !== nextIndex) {
        carouselApi.scrollTo(nextIndex, true);
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeImageIndex, carouselApi, carouselImages.length]);

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
      setImageRevealed(false);
    }
  }, [loading, generatingAngles, resultImage]);

  // Trigger animations and compliment when ready
  useEffect(() => {
    if (resultImage && !loading && !error && !generatingAngles) {
      const revealTimer = setTimeout(() => setImageRevealed(true), 100);

      if (!hasShownCompliment) {
        const showTimer = setTimeout(() => {
          setCurrentCompliment(getComplimentForGarment(garmentTitle));
          setHasShownCompliment(true);
        }, 800);
        return () => {
          clearTimeout(revealTimer);
          clearTimeout(showTimer);
        };
      }

      return () => clearTimeout(revealTimer);
    }
  }, [resultImage, loading, error, generatingAngles, hasShownCompliment, garmentTitle]);

  const handleComplimentComplete = () => {
    if (
      hasTriggeredComplimentCompleteRef.current ||
      !currentCompliment ||
      loading ||
      error ||
      generatingAngles
    ) {
      return;
    }

    hasTriggeredComplimentCompleteRef.current = true;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReducedMotion) {
      if (mobileShayariCollapseTimerRef.current) {
        clearTimeout(mobileShayariCollapseTimerRef.current);
      }
      mobileShayariCollapseTimerRef.current = setTimeout(() => {
        setIsMobileShayariCollapsed(true);
        mobileShayariCollapseTimerRef.current = null;
      }, 3000);
    }
    if (feedbackContext) {
      if (feedbackRevealTimerRef.current) {
        clearTimeout(feedbackRevealTimerRef.current);
      }
      feedbackRevealTimerRef.current = setTimeout(() => {
        setShowInlineFeedback(true);
        feedbackRevealTimerRef.current = null;
      }, 550);
    }
    onComplimentComplete?.();
  };

  // Prevent body scroll when modal or lightbox is open.
  useEffect(() => {
    if (!isOpen && !isLightboxOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isLightboxOpen]);

  useEffect(() => {
    if (!isMobileFeedbackOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setIsMobileFeedbackOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMobileFeedbackOpen]);

  useEffect(() => {
    if (!isOpen || !resultImage || loading || error) {
      return;
    }

    const containers = Object.values(chatScrollContainersRef.current).filter(
      (container): container is HTMLDivElement => Boolean(container),
    );

    if (containers.length === 0) {
      return;
    }

    const scrollToBottom = (container: HTMLDivElement) => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    };

    const frameId = window.requestAnimationFrame(() => {
      containers.forEach(scrollToBottom);
    });

    const observers = containers.map((container) => {
      const observer = new MutationObserver(() => scrollToBottom(container));
      observer.observe(container, {
        childList: true,
        characterData: true,
        subtree: true,
      });
      return observer;
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      observers.forEach((observer) => observer.disconnect());
    };
  }, [
    currentCompliment?.id,
    error,
    feedbackComment,
    feedbackRating,
    feedbackSubmitted,
    hasCompletedUserPrompt,
    isOpen,
    loading,
    resultImage,
    showInlineFeedback,
  ]);

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    lightboxHistoryActiveRef.current = true;
    window.history.pushState(
      { ...(window.history.state ?? {}), __aivestireTryOnLightbox: true },
      "",
    );

    const handlePopState = () => {
      lightboxHistoryActiveRef.current = false;
      setIsLightboxOpen(false);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);

      if (lightboxHistoryActiveRef.current) {
        lightboxHistoryActiveRef.current = false;
        window.history.back();
      }
    };
  }, [isLightboxOpen]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!activeDisplayImage) return;
    const link = document.createElement("a");
    link.href = activeDisplayImage;
    link.download = `ai-tryon-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    if (navigator.share && resultImage) {
      navigator
        .share({
          title: "My AI Try-On Result",
          text: "Check out my virtual try-on!",
          url: window.location.href,
        })
        .catch(() => {});
    }
  };

  const openLightbox = () => {
    if (!activeDisplayImage) {
      return;
    }

    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const handleShopOutfit = () => {
    onClose();
    if (garmentId) {
      navigate(`/collection?item=${garmentId}`);
    } else {
      navigate("/collection");
    }
  };

  const getStepStatus = (
    stepIndex: number,
  ): "pending" | "active" | "complete" => {
    if (stepIndex < currentStep) return "complete";
    if (stepIndex === currentStep) return "active";
    return "pending";
  };

  const feedbackReplyMessage =
    feedbackRating >= 4
      ? "We are glad you liked the virtual try-on."
      : "We are continuously improving the virtual try-on experience. Please tell us what felt off.";

  const feedbackSubmittedMessage =
    feedbackRating >= 4
      ? "Thanks for the rating. We are glad the virtual try-on worked well for you."
      : "Thanks for the honest feedback. We are continuously improving the virtual try-on experience.";

  const handleFeedbackSubmit = async () => {
    if (!feedbackContext || feedbackSubmitted || feedbackSubmitting) {
      return;
    }

    if (!canSubmitFeedback) {
      if (feedbackRequiresComment) {
        setFeedbackError("Please add a short note for 3 stars or below.");
      }
      return;
    }

    setFeedbackSubmitting(true);
    setFeedbackError("");

    try {
      await submitFeedback({
        context_type: "VIRTUAL_TRYON",
        context_reference_id: feedbackContext.referenceId,
        context_label: feedbackContext.label || displayGarmentTitle,
        rating: feedbackRating,
        comment: feedbackComment.trim() || undefined,
      });
      setFeedbackSubmitted(true);
    } catch (submitError) {
      setFeedbackError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to submit feedback",
      );
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const renderFeedbackConversation = (
    layout: "default" | "mobile" = "default",
  ) => {
    if (
      !feedbackContext ||
      !showInlineFeedback ||
      !resultImage ||
      loading ||
      error
    ) {
      return null;
    }

    const isMobileLayout = layout === "mobile";

    return (
      <div
        className={`${isMobileLayout ? "mt-3 space-y-3" : "mt-4 space-y-4 md:mt-5"} slide-up`}
      >
        <div
          className={`flex min-w-0 items-start ${isMobileLayout ? "gap-2" : "gap-3"}`}
        >
          <div
            className={`flex shrink-0 items-center justify-center ${isMobileLayout ? "h-10 w-10 rounded-[18px]" : "h-11 w-11 rounded-2xl"}`}
            style={{
              background: "linear-gradient(135deg, #d1aa62 0%, #f2dfba 100%)",
              boxShadow: "0 8px 20px rgba(160, 123, 54, 0.18)",
            }}
          >
            <MessageSquareText
              className={`${isMobileLayout ? "h-4 w-4" : "h-5 w-5"} text-white`}
            />
          </div>

          <div
            className={`min-w-0 flex-1 ${isMobileLayout ? "rounded-[20px] rounded-tl-md px-3.5 py-3.5" : "rounded-[24px] rounded-tl-md px-4 py-4"}`}
            style={{
              background: "rgba(255, 251, 244, 0.96)",
              border: "1px solid rgba(138, 105, 54, 0.12)",
              boxShadow: "0 10px 24px rgba(160, 123, 54, 0.08)",
            }}
          >
            <p
              className={`${isMobileLayout ? "text-[10px] tracking-[0.13em]" : "text-xs tracking-[0.16em]"} font-semibold uppercase text-[#8a6936]`}
            >
              AiVestire Fashion Expert
            </p>
            <p
              className={`${isMobileLayout ? "mt-2 text-[13px] leading-5" : "mt-2 text-sm leading-6"} text-[#5a4630]`}
            >
              How was your virtual try-on? Rate it below.
            </p>

            <div
              className={`mt-3 flex items-center ${isMobileLayout ? "gap-1" : "gap-1.5"}`}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    if (feedbackSubmitted || feedbackSubmitting) {
                      return;
                    }
                    setFeedbackRating(value);
                    setFeedbackError("");
                    if (value > 3) {
                      setShowOptionalFeedbackNote(false);
                    }
                  }}
                  className={`rounded-full transition ${feedbackSubmitted ? "pointer-events-none" : "hover:scale-105"} ${value <= feedbackRating ? "text-[#D4AF37]" : "text-[#CAB08A]/50"}`}
                  aria-label={`Rate ${value} stars`}
                  disabled={feedbackSubmitted || feedbackSubmitting}
                >
                  <Star
                    className={`${isMobileLayout ? "h-5 w-5" : "h-6 w-6"} fill-current`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {feedbackRating > 0 && (
          <>
            <div
              className={`flex min-w-0 items-start justify-end ${isMobileLayout ? "gap-2" : "gap-3"}`}
            >
              <div
                className={`chat-pop-right min-w-0 ${isMobileLayout ? "max-w-[calc(100%-3rem)] rounded-[20px] rounded-tr-md px-3 py-3" : "max-w-[85%] rounded-[24px] rounded-tr-md px-4 py-3.5"}`}
                style={{
                  background:
                    "linear-gradient(135deg, #2f2416 0%, #4a3520 100%)",
                  boxShadow: "0 10px 24px rgba(47, 36, 22, 0.22)",
                }}
              >
                <p
                  className={`${isMobileLayout ? "text-[10px] tracking-[0.12em]" : "text-xs tracking-[0.14em]"} font-semibold uppercase text-[#f2d7a5]`}
                >
                  {displayUserName}
                </p>
                <div className="mt-1 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      key={value}
                      className={`${isMobileLayout ? "h-3.5 w-3.5" : "h-4 w-4"} ${value <= feedbackRating ? "fill-[#f2d7a5] text-[#f2d7a5]" : "text-[#8f7652]"}`}
                    />
                  ))}
                  <span
                    className={`${isMobileLayout ? "ml-1 text-[11px]" : "ml-1.5 text-xs"} text-[#fff8ec]`}
                  >
                    {feedbackRating}/5
                  </span>
                </div>
              </div>

              <div
                className={`flex shrink-0 items-center justify-center overflow-hidden ${isMobileLayout ? "h-10 w-10 rounded-[18px]" : "h-11 w-11 rounded-2xl"}`}
                style={{
                  background:
                    "linear-gradient(135deg, #e8c98b 0%, #f9f1df 100%)",
                  boxShadow: "0 8px 20px rgba(160, 123, 54, 0.16)",
                }}
              >
                {userPhoto ? (
                  <img
                    src={userPhoto}
                    alt={displayUserName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span
                    className={`${isMobileLayout ? "text-[13px]" : "text-sm"} font-semibold text-[#6b4f26]`}
                  >
                    {userInitial}
                  </span>
                )}
              </div>
            </div>

            <div
              className={`flex min-w-0 items-start ${isMobileLayout ? "gap-2" : "gap-3"}`}
            >
              <div
                className={`flex shrink-0 items-center justify-center ${isMobileLayout ? "h-10 w-10 rounded-[18px]" : "h-11 w-11 rounded-2xl"}`}
                style={{
                  background:
                    "linear-gradient(135deg, #d1aa62 0%, #f2dfba 100%)",
                  boxShadow: "0 8px 20px rgba(160, 123, 54, 0.18)",
                }}
              >
                {feedbackSubmitted ? (
                  <CheckCircle2
                    className={`${isMobileLayout ? "h-4 w-4" : "h-5 w-5"} text-white`}
                  />
                ) : (
                  <MessageSquareText
                    className={`${isMobileLayout ? "h-4 w-4" : "h-5 w-5"} text-white`}
                  />
                )}
              </div>

              <div
                className={`chat-pop-left min-w-0 flex-1 ${isMobileLayout ? "rounded-[20px] rounded-tl-md px-3.5 py-3.5" : "rounded-[24px] rounded-tl-md px-4 py-4"}`}
                style={{
                  background: "rgba(255, 251, 244, 0.96)",
                  border: "1px solid rgba(138, 105, 54, 0.12)",
                  boxShadow: "0 10px 24px rgba(160, 123, 54, 0.08)",
                }}
              >
                <p
                  className={`${isMobileLayout ? "text-[10px] tracking-[0.13em]" : "text-xs tracking-[0.16em]"} font-semibold uppercase text-[#8a6936]`}
                >
                  AiVestire Fashion Expert
                </p>
                <p
                  className={`${isMobileLayout ? "mt-2 text-[13px] leading-5" : "mt-2 text-sm leading-6"} text-[#2f2416]`}
                >
                  {feedbackSubmitted
                    ? feedbackSubmittedMessage
                    : feedbackReplyMessage}
                </p>

                {!feedbackSubmitted && (
                  <>
                    {!feedbackRequiresComment && !showFeedbackCommentField && (
                      <button
                        type="button"
                        onClick={() => setShowOptionalFeedbackNote(true)}
                        className={`mt-3 rounded-full border border-[#D4B76E]/40 bg-white px-3 py-1.5 ${isMobileLayout ? "text-[10px]" : "text-xs"} font-semibold text-[#7A6240] transition hover:bg-[#FAF4E8]`}
                      >
                        Add a note
                      </button>
                    )}

                    {showFeedbackCommentField && (
                      <div className="mt-3">
                        <label
                          className={`${isMobileLayout ? "text-[10px]" : "text-xs"} font-medium text-[#4A3F2E]`}
                        >
                          Note{" "}
                          {feedbackRequiresComment
                            ? "(required)"
                            : "(optional)"}
                        </label>
                        <textarea
                          value={feedbackComment}
                          onChange={(event) => {
                            setFeedbackComment(event.target.value);
                            setFeedbackError("");
                          }}
                          rows={2}
                          disabled={feedbackSubmitting}
                          className={`mt-1 w-full resize-none rounded-xl border border-[#D4B76E]/50 bg-white px-3 py-2 ${isMobileLayout ? "text-[12px]" : "text-sm"} outline-none placeholder:text-[#B7A07D] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/35`}
                          placeholder={
                            feedbackRequiresComment
                              ? "Tell us what can be better..."
                              : "Anything you loved or want improved?"
                          }
                        />
                      </div>
                    )}

                    {feedbackError && (
                      <p
                        className={`mt-3 flex items-center gap-1.5 ${isMobileLayout ? "text-[10px]" : "text-xs"} text-red-600`}
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                        {feedbackError}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleFeedbackSubmit}
                      disabled={!canSubmitFeedback || feedbackSubmitting}
                      className={`mt-3 w-full rounded-xl bg-[#D4AF37] px-4 py-2.5 ${isMobileLayout ? "text-[12px]" : "text-sm"} font-semibold text-[#2B2015] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {feedbackSubmitting ? "Submitting..." : "Submit feedback"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderComplimentCard = (
    className = "",
    layout: "default" | "mobile" = "default",
    scrollKey = "default",
  ) => {
    if (!currentCompliment || !resultImage || loading || error) {
      return null;
    }

    const isMobileLayout = layout === "mobile";

    return (
      <div
        className={`relative min-w-0 rounded-[24px] border border-[rgba(201,165,92,0.18)] md:rounded-[28px] ${
          isMobileLayout
            ? "max-h-[38dvh] overflow-y-auto overscroll-contain rounded-[16px] p-2.5 sm:max-h-[50dvh] sm:rounded-[20px] sm:p-3"
            : "flex min-h-[18rem] flex-col overflow-hidden p-4 md:max-h-[40vh] md:p-5 lg:max-h-[42vh]"
        } ${className}`}
        style={{
          background:
            "linear-gradient(160deg, #fffdf9 0%, #f9f1df 58%, #efd19e 100%)",
          boxShadow:
            "0 18px 40px rgba(160, 123, 54, 0.16), 0 0 0 1px rgba(201, 165, 92, 0.2)",
          animation: "slideUp 0.6s ease-out",
        }}
      >
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(circle at top right, rgba(255,255,255,0.92), transparent 35%), linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.2) 35%, transparent 70%)",
          }}
        />
        <div
          ref={(node) => {
            chatScrollContainersRef.current[scrollKey] = node;
          }}
          className={`relative min-w-0 flex min-h-0 flex-1 flex-col ${
            isMobileLayout ? "overflow-visible" : "overflow-y-auto overscroll-contain"
          } ${
            isMobileLayout ? "pr-0.5" : "pr-1"
          }`}
        >
          <div
            className={`flex min-w-0 ${isMobileLayout ? "mb-2 items-center gap-2" : "mb-3 items-center gap-3 md:mb-4"}`}
          >
            <div
              className={`flex shrink-0 items-center justify-center ${isMobileLayout ? "h-8 w-8 rounded-lg" : "h-11 w-11 rounded-2xl"}`}
              style={{
                background:
                  "linear-gradient(135deg, rgba(201, 165, 92, 0.22) 0%, rgba(255, 255, 255, 0.92) 100%)",
                border: "1px solid rgba(127, 96, 49, 0.12)",
              }}
            >
              <Sparkles
                className={`${isMobileLayout ? "h-4 w-4" : "h-5 w-5"} text-[#8a6936]`}
              />
            </div>
            <div className="min-w-0">
              <p
                className={`${isMobileLayout ? "text-[9px] tracking-[0.14em]" : "text-[11px] tracking-[0.2em]"} font-semibold uppercase text-[#8a6936]`}
              >
                Stylist Conversation
              </p>
              <h3
                className={`${isMobileLayout ? "text-[13px] leading-4" : "text-lg leading-6"} font-serif text-[#2f2416]`}
              >
                A quick verdict on your try-on
              </h3>
            </div>
          </div>

          <div
            className={isMobileLayout ? "space-y-3" : "space-y-4 md:space-y-[18px]"}
          >
            <div
              className={`flex min-w-0 items-start justify-end ${isMobileLayout ? "gap-2" : "gap-3"}`}
            >
              <div
                className={`chat-pop-right min-w-0 w-fit max-w-full break-words ${isMobileLayout ? "max-w-[calc(100%-3rem)] rounded-[20px] rounded-tr-md px-3 py-3" : "max-w-[86%] rounded-[24px] rounded-tr-md px-4 py-3.5"}`}
                style={{
                  background:
                    "linear-gradient(135deg, #2f2416 0%, #4a3520 100%)",
                  boxShadow: "0 10px 24px rgba(47, 36, 22, 0.22)",
                }}
              >
                <p
                  className={`${isMobileLayout ? "text-[10px] tracking-[0.12em]" : "text-xs tracking-[0.14em]"} font-semibold uppercase text-[#f2d7a5]`}
                >
                  {displayUserName}
                </p>
                <AnimatedComplimentText
                  text={userPrompt}
                  className={`${isMobileLayout ? "mt-1 block text-[13px] leading-5" : "mt-1 block text-sm leading-6 md:text-[15px]"} text-[#fff8ec]`}
                  caretClassName="text-[#f2d7a5]"
                  speedMs={95}
                  startDelayMs={120}
                  unit="word"
                  onComplete={() => setHasCompletedUserPrompt(true)}
                />
              </div>

              <div
                className={`flex shrink-0 items-center justify-center overflow-hidden ${isMobileLayout ? "h-9 w-9 rounded-xl" : "h-11 w-11 rounded-2xl"}`}
                style={{
                  background:
                    "linear-gradient(135deg, #e8c98b 0%, #f9f1df 100%)",
                  boxShadow: "0 8px 20px rgba(160, 123, 54, 0.16)",
                }}
              >
                {userPhoto ? (
                  <img
                    src={userPhoto}
                    alt={displayUserName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span
                    className={`${isMobileLayout ? "text-[13px]" : "text-sm"} font-semibold text-[#6b4f26]`}
                  >
                    {userInitial}
                  </span>
                )}
              </div>
            </div>

            <div
              className={`flex min-w-0 items-start ${isMobileLayout ? "gap-2" : "gap-3"}`}
            >
              <div
                className={`flex shrink-0 items-center justify-center ${isMobileLayout ? "h-9 w-9 rounded-xl" : "h-11 w-11 rounded-2xl"}`}
                style={{
                  background:
                    "linear-gradient(135deg, #d1aa62 0%, #f2dfba 100%)",
                  boxShadow: "0 8px 20px rgba(160, 123, 54, 0.18)",
                }}
              >
                <Sparkles
                  className={`${isMobileLayout ? "h-4 w-4" : "h-5 w-5"} text-white`}
                />
              </div>

              <div
                className={`chat-pop-left min-w-0 flex-1 max-w-full break-words ${isMobileLayout ? "rounded-[18px] rounded-tl-md px-3 py-3" : "rounded-[24px] rounded-tl-md px-4 py-4"}`}
                style={{
                  background: "rgba(255, 251, 244, 0.96)",
                  border: "1px solid rgba(138, 105, 54, 0.12)",
                  boxShadow: "0 10px 24px rgba(160, 123, 54, 0.08)",
                }}
              >
                <p
                  className={`${isMobileLayout ? "text-[10px] tracking-[0.13em]" : "text-xs tracking-[0.16em]"} font-semibold uppercase text-[#8a6936]`}
                >
                  AiVestire Fashion Expert
                </p>

                {hasCompletedUserPrompt ? (
                  <AnimatedComplimentText
                    text={currentCompliment.message}
                    className={`mt-1.5 block font-serif text-[#2f2416] ${isMobileLayout ? "text-sm leading-5" : "text-[17px] leading-8 md:text-[19px]"}`}
                    caretClassName="text-[#9a7b4f]"
                    speedMs={110}
                    startDelayMs={160}
                    unit="word"
                    onComplete={handleComplimentComplete}
                  />
                ) : (
                  <div className="mt-2 flex items-center gap-1.5 text-[#9a7b4f]">
                    {[0, 1, 2].map((index) => (
                      <span
                        key={index}
                        className={`${isMobileLayout ? "h-2 w-2" : "h-2.5 w-2.5"} rounded-full bg-current`}
                        style={{
                          animation: `pulse 1.15s ease-in-out ${index * 0.18}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {renderFeedbackConversation(layout)}
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-3 md:p-4"
      style={{
        background:
          "linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 100%)",
        backdropFilter: "blur(16px)",
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

                @keyframes chatPopRight {
                    0% { opacity: 0; transform: translateX(18px) scale(0.96); }
                    65% { opacity: 1; transform: translateX(-2px) scale(1.015); }
                    100% { opacity: 1; transform: translateX(0) scale(1); }
                }

                @keyframes chatPopLeft {
                    0% { opacity: 0; transform: translateX(-18px) scale(0.96); }
                    65% { opacity: 1; transform: translateX(2px) scale(1.015); }
                    100% { opacity: 1; transform: translateX(0) scale(1); }
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
                .chat-pop-right {
                    animation: chatPopRight 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
                    transform-origin: right bottom;
                }
                .chat-pop-left {
                    animation: chatPopLeft 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
                    transform-origin: left bottom;
                }
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
        className="relative flex h-[100dvh] w-full max-w-[1600px] flex-col overflow-hidden rounded-none modal-appear sm:h-[96vh] sm:w-[96vw] sm:rounded-[28px] md:h-[94vh]"
        style={{
          background: "linear-gradient(135deg, #fdfbf7 0%, #f7f4ef 100%)",
          boxShadow:
            "0 30px 90px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(201, 165, 92, 0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Premium Header */}
        <div
          className="relative flex items-center justify-between border-b px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-5"
          style={{
            background:
              "linear-gradient(135deg, rgba(253, 251, 247, 0.98) 0%, rgba(247, 244, 239, 0.98) 100%)",
            backdropFilter: "blur(20px)",
            borderColor: "rgba(201, 165, 92, 0.12)",
          }}
        >
          <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
            <div>
              <h1 className="text-lg font-bold font-serif bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent sm:text-xl md:text-2xl">
                AiVestire
              </h1>
              <p className="mt-0.5 text-[11px] text-gray-500 sm:text-xs md:text-sm">
                Virtual Fitting Room
              </p>
            </div>

          </div>

          <button
            onClick={onClose}
            className="hidden items-center gap-2 rounded-xl px-4 py-2 transition-all duration-300 hover:bg-black/5 active:scale-95 md:flex md:px-5 md:py-2.5"
            style={{
              color: "#2c2c2c",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <span className="text-sm font-semibold">CLOSE</span>
            <X className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 hover:bg-black/5 active:scale-95 md:hidden"
            style={{
              color: "#2c2c2c",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
            aria-label="Close try-on result"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content */}
        <div className="relative flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-3 pb-[calc(6.75rem+env(safe-area-inset-bottom))] pt-3 sm:gap-4 sm:p-4 sm:pb-32 md:flex-row md:gap-5 md:overflow-hidden md:p-6 md:pb-6">
          {/* Left Sidebar - AI Insights (Desktop) */}
          {resultImage && !loading && !error && (
            <div className="hidden min-h-0 flex-col gap-4 slide-right xl:flex xl:w-[22rem] 2xl:w-[24rem]">
              {/* Style Analysis Card */}
              <div
                className="rounded-2xl p-5"
                style={{
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #fafafa 100%)",
                  boxShadow:
                    "0 4px 20px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-[#c9a55c]" />
                  <span className="text-sm font-bold font-serif text-gray-800">
                    STYLE COMPATIBILITY
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-500">
                        Overall Match
                      </span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div
                            key={star}
                            className="w-3 h-3 rounded-full bg-[#c9a55c]"
                            style={{ opacity: star <= 5 ? 1 : 0.3 }}
                          />
                        ))}
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-2 p-3 rounded-xl"
                      style={{ background: "rgba(201, 165, 92, 0.08)" }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#c9a55c]" />
                      <span className="text-sm font-bold text-[#9a7b4f]">
                        Excellent Match
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {["✨", "💃", "🌟", "🔥"].map((emoji, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                        style={{
                          background: "rgba(201, 165, 92, 0.1)",
                          border: "1px solid rgba(201, 165, 92, 0.2)",
                        }}
                      >
                        {emoji}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Smart Tips Card */}
              {renderComplimentCard("flex-1 min-h-0", "default", "desktop")}
            </div>
          )}

          {/* Center - Result Image Area */}
          <div className="relative flex min-h-0 flex-col gap-4 md:flex-1 md:overflow-hidden">
            {/* Image Display */}
            <div
              className={`relative mx-auto flex h-[calc(100dvh-10.25rem)] min-h-[24rem] max-h-none w-full shrink-0 items-center justify-center overflow-hidden rounded-[20px] sm:h-[calc(100dvh-11rem)] sm:min-h-[30rem] sm:rounded-[26px] md:mx-0 md:h-auto md:min-h-0 md:shrink md:flex-1 md:rounded-3xl ${
                isProcessingState
                  ? "sm:aspect-[4/5] md:aspect-auto md:min-h-0"
                  : "sm:aspect-[4/5] md:aspect-auto md:min-h-0"
              }`}
              style={{
                background:
                  "linear-gradient(145deg, #fbf7ef 0%, #f3e6cf 52%, #fcfaf6 100%)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -10px 24px rgba(138,105,54,0.08)",
              }}
            >
              {/* Loading State - Game-Like Queue Animation (Compact Version) */}
              {(loading || generatingAngles) && (
                <div
                  className="absolute inset-0 z-20 flex flex-col items-center justify-start overflow-y-auto px-4 py-5 pb-8 sm:justify-center sm:p-6 slide-up"
                  style={{
                    background:
                      "linear-gradient(135deg, #fcfaf7 0%, #f7f5f2 100%)",
                    backdropFilter: "blur(24px)",
                  }}
                >
                  {/* Animated Icon - Smaller */}
                  <div className="relative mb-4 mt-1 sm:mb-5 sm:mt-0">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full sm:h-16 sm:w-16"
                      style={{
                        background:
                          "linear-gradient(135deg, #c9a55c 0%, #d4b896 100%)",
                        boxShadow: "0 8px 24px rgba(201, 165, 92, 0.35)",
                        animation: "pulse 2s ease-in-out infinite",
                      }}
                    >
                      <Sparkles className="h-7 w-7 text-white sm:h-8 sm:w-8" />
                    </div>
                  </div>

                  {/* Title - Smaller */}
                  <h3 className="mb-1 text-center text-lg font-bold font-serif bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent sm:text-xl md:text-2xl">
                    {generatingAngles
                      ? "Generating New Angle"
                      : "Creating Your Look"}
                  </h3>
                  <p className="mb-5 max-w-md text-center text-sm text-gray-500 sm:mb-6">
                    {LOADING_QUOTES[currentQuoteIndex]}
                  </p>

                  {/* Process Steps - Compact Grid */}
                  <div className="mb-5 w-full max-w-xl sm:mb-6">
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
                      {processSteps.map((step, idx) => {
                        const status = getStepStatus(idx);
                        return (
                          <div
                            key={step.id}
                            className="flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition-all duration-500 sm:p-3"
                            style={{
                              background:
                                status === "complete"
                                  ? "linear-gradient(135deg, #c9a55c 0%, #d4b896 100%)"
                                  : status === "active"
                                    ? "linear-gradient(135deg, rgba(201, 165, 92, 0.15) 0%, rgba(212, 184, 150, 0.15) 100%)"
                                    : "rgba(0,0,0,0.03)",
                              border:
                                status === "active"
                                  ? "1.5px solid #c9a55c"
                                  : "1.5px solid transparent",
                              boxShadow:
                                status === "complete"
                                  ? "0 3px 12px rgba(201, 165, 92, 0.25)"
                                  : status === "active"
                                    ? "0 3px 12px rgba(201, 165, 92, 0.15)"
                                    : "none",
                            }}
                          >
                            <div className="text-xl mb-0.5">
                              {status === "complete" ? (
                                <CheckCircle2 className="w-5 h-5 text-white checkmark-animate" />
                              ) : status === "active" ? (
                                <Loader2 className="w-5 h-5 text-[#c9a55c] animate-spin" />
                              ) : (
                                <span className="opacity-40 text-lg">
                                  {step.icon}
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-[10px] md:text-xs font-semibold text-center ${
                                status === "complete"
                                  ? "text-white"
                                  : status === "active"
                                    ? "text-gray-900"
                                    : "text-gray-400"
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Progress Bar - Compact */}
                  <div className="w-full max-w-lg">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600">
                        Progress
                      </span>
                      <span className="text-xs font-bold text-[#c9a55c]">
                        {/* Safety: If loading but progress high, show 0 to prevent flash */}
                        {Math.round(
                          (loading || generatingAngles) && loadingProgress > 95
                            ? 0
                            : loadingProgress,
                        )}
                        %
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{
                        background: "rgba(0,0,0,0.06)",
                      }}
                    >
                      <div
                        className="h-full transition-all duration-500 ease-out shimmer-effect"
                        style={{
                          // Safety override here too
                          width: `${(loading || generatingAngles) && loadingProgress > 95 ? 0 : loadingProgress}%`,
                          background:
                            "linear-gradient(90deg, #c9a55c 0%, #d4b896 50%, #c9a55c 100%)",
                          boxShadow: "0 0 8px rgba(201, 165, 92, 0.5)",
                        }}
                      />
                    </div>
                  </div>

                  <p className="mt-4 max-w-lg px-1 text-center text-[11px] leading-5 text-gray-400">
                    AI-generated previews may occasionally make mistakes.
                  </p>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="text-center p-6 slide-up">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-4 mx-auto"
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                    }}
                  >
                    <X className="w-10 h-10 text-red-500" />
                  </div>
                  <p
                    className="text-lg md:text-xl mb-4 font-semibold"
                    style={{ color: "#d32f2f" }}
                  >
                    {error}
                  </p>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{
                      background: "#2c2c2c",
                      color: "white",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    }}
                  >
                    Close
                  </button>
                </div>
              )}

              {/* Result Image */}
              {resultImage && !loading && !error && (
                <div className="absolute inset-0 p-2.5 sm:p-3 md:p-4">
                  <div
                    className="relative flex h-full w-full overflow-hidden rounded-[20px] md:grid md:grid-cols-1 md:rounded-[26px]"
                    style={{
                      background:
                        "radial-gradient(circle at top, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.2) 24%, rgba(244,233,208,0.92) 100%)",
                      boxShadow:
                        "inset 0 0 0 1px rgba(255,255,255,0.68), 0 16px 34px rgba(118,87,37,0.12)",
                    }}
                  >
                    <div className="relative h-full min-w-full overflow-hidden rounded-[16px] bg-white md:min-w-0 md:rounded-[22px]">
                    {hasMultipleGeneratedImages && (
                      <div className="absolute left-2.5 right-2.5 top-2.5 z-10 flex items-center justify-between gap-2 sm:left-3 sm:right-3 sm:top-3 md:left-4 md:right-4 md:top-4">
                        <span className="rounded-full bg-[rgba(44,36,22,0.68)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur">
                          Swipe to view generated angles
                        </span>
                        <span className="rounded-full border border-white/60 bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6f5a42] shadow-[0_10px_22px_rgba(28,21,14,0.12)] backdrop-blur">
                          {currentImageIndex + 1} / {carouselImages.length}
                        </span>
                      </div>
                    )}

                    {hasMultipleGeneratedImages ? (
                      <div className="absolute inset-0 h-full w-full">
                        <Carousel
                          setApi={setCarouselApi}
                          opts={{ loop: true, align: "start" }}
                          className="h-full w-full"
                        >
                          <CarouselContent className="h-full -ml-0">
                            {carouselImages.map((image, index) => (
                              <CarouselItem
                                key={`${image}-${index}`}
                                className="h-full basis-full pl-0"
                              >
                                <button
                                  type="button"
                                  className="group flex h-full w-full items-center justify-center p-0"
                                  onClick={openLightbox}
                                  title="Tap to view full size"
                                >
                                  <img
                                    src={image}
                                    alt={`Generated angle ${index + 1}`}
                                    className={`block h-full w-full transition-all duration-500 ${imageRevealed ? "modal-appear" : "opacity-0"}`}
                                    style={{
                                      objectFit: "contain",
                                      objectPosition: "center center",
                                    }}
                                  />
                                </button>
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          <CarouselPrevious className="left-2 top-1/2 h-9 w-9 -translate-y-1/2 border-white/60 bg-white/92 text-[#2f2416] shadow-[0_12px_28px_rgba(28,21,14,0.12)] hover:bg-white md:left-3" />
                          <CarouselNext className="right-2 top-1/2 h-9 w-9 -translate-y-1/2 border-white/60 bg-white/92 text-[#2f2416] shadow-[0_12px_28px_rgba(28,21,14,0.12)] hover:bg-white md:right-3" />
                        </Carousel>
                      </div>
                    ) : (
                      <div
                        className="group absolute inset-0 flex h-full w-full cursor-pointer items-center justify-center"
                        onClick={openLightbox}
                        title="Click to view full size"
                      >
                        <img
                          src={resultImage}
                          alt="Try-On Result"
                          className={`block h-full w-full transition-all duration-500 ${imageRevealed ? "modal-appear" : "opacity-0"}`}
                          style={{
                            objectFit: "contain",
                            objectPosition: "center center",
                          }}
                        />
                      </div>
                    )}
                    </div>
                  </div>

                  {currentCompliment && (
                    <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 z-30 md:hidden">
                      <div className="flex justify-end">
                        {isMobileShayariCollapsed ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setIsMobileShayariCollapsed(false);
                            }}
                            className="pointer-events-auto flex min-h-11 items-center gap-2 rounded-full border border-white/30 bg-black/55 px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur-md transition-opacity"
                            aria-label="View stylist message"
                          >
                            <Sparkles className="h-4 w-4 text-[#F2D7A5]" />
                            View message
                          </button>
                        ) : (
                          <div className="pointer-events-auto relative ml-auto max-h-[26dvh] w-[92%] max-w-[24rem] overflow-y-auto rounded-2xl border border-white/25 bg-gradient-to-t from-black/80 via-black/65 to-black/45 px-4 pb-4 pt-3 text-white shadow-[0_16px_40px_rgba(0,0,0,0.3)] backdrop-blur-md">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                if (mobileShayariCollapseTimerRef.current) {
                                  clearTimeout(
                                    mobileShayariCollapseTimerRef.current,
                                  );
                                  mobileShayariCollapseTimerRef.current = null;
                                }
                                setIsMobileShayariCollapsed(true);
                              }}
                              className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition active:bg-white/10"
                              aria-label="Minimize stylist message"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <div className="mb-2 flex items-center gap-2 pr-10 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F2D7A5]">
                              <Sparkles className="h-3.5 w-3.5" />
                              AiVestire Fashion Expert
                            </div>
                            <AnimatedComplimentText
                              text={currentCompliment.message}
                              className="block pr-2 font-serif text-sm leading-6 text-white"
                              caretClassName="text-[#F2D7A5]"
                              speedMs={110}
                              startDelayMs={160}
                              unit="word"
                              onComplete={handleComplimentComplete}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {renderComplimentCard(
              "hidden w-full flex-shrink-0 self-center md:block xl:hidden md:max-w-4xl lg:max-w-5xl",
              "default",
              "tablet",
            )}
          </div>

          {/* Right Sidebar - Premium Action Buttons */}
          <div className="hidden w-full flex-shrink-0 flex-col gap-3 md:flex md:w-56">
            <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
              <button
                onClick={handleDownload}
                disabled={!resultImage || loading}
                className="flex-1 md:flex-none flex items-center justify-center gap-2.5 py-4 px-4 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  background:
                    "linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)",
                  color: "white",
                  boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2)",
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
                  background: "rgba(255, 255, 255, 0.95)",
                  color: "#2c2c2c",
                  border: "1px solid rgba(0,0,0,0.08)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
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
                    background: generatingAngles
                      ? "rgba(201, 165, 92, 0.15)"
                      : "linear-gradient(135deg, #c9a55c 0%, #d4b896 100%)",
                    color: generatingAngles ? "#9a7b4f" : "white",
                    boxShadow: "0 6px 16px rgba(201, 165, 92, 0.3)",
                  }}
                >
                  {generatingAngles ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  <span>
                    {generatingAngles ? "GENERATING..." : "NEW ANGLE"}
                  </span>
                </button>
              )}

              <button
                onClick={handleShopOutfit}
                disabled={loading}
                className="flex-1 md:flex-none flex items-center justify-center gap-2.5 py-4 px-4 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  color: "#2c2c2c",
                  border: "1px solid rgba(0,0,0,0.08)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                }}
              >
                <ShoppingBag className="w-5 h-5" />
                <span>SHOP</span>
              </button>
            </div>
          </div>
        </div>

        {showMobileActionBar && (
          <div
            className="absolute inset-x-2.5 bottom-[calc(0.625rem+env(safe-area-inset-bottom))] z-10 rounded-[18px] border border-white/70 bg-white/92 p-2 shadow-[0_18px_48px_rgba(0,0,0,0.14)] backdrop-blur md:hidden"
            style={{
              boxShadow: "0 18px 48px rgba(28, 21, 14, 0.16)",
            }}
          >
            <div className={`grid gap-1.5 ${feedbackContext ? "grid-cols-4" : "grid-cols-3"}`}>
              <button
                onClick={handleDownload}
                disabled={!resultImage || loading}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2c2c2c] transition active:scale-95 disabled:opacity-40"
                style={{
                  background:
                    "linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)",
                  color: "#ffffff",
                }}
              >
                <Download className="h-5 w-5" />
                <span>Download</span>
              </button>

              <button
                onClick={handleShare}
                disabled={!resultImage || loading}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2c2c2c] transition active:scale-95 disabled:opacity-40"
              >
                <Share2 className="h-5 w-5" />
                <span>Share</span>
              </button>

              <button
                onClick={onGenerateMoreAngles}
                disabled={
                  generatingAngles ||
                  !resultImage ||
                  loading ||
                  !onGenerateMoreAngles
                }
                className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2c2c2c] transition active:scale-95 disabled:opacity-40"
              >
                {generatingAngles ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
                <span>{generatingAngles ? "Working" : "New Angle"}</span>
              </button>

              {feedbackContext && (
                <button
                  type="button"
                  onClick={() => {
                    setShowInlineFeedback(true);
                    setIsMobileFeedbackOpen(true);
                  }}
                  disabled={!resultImage || loading}
                  className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white px-1 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#2c2c2c] transition active:scale-95 disabled:opacity-40"
                  aria-label="Open try-on feedback"
                >
                  <MessageSquareText className="h-5 w-5" />
                  <span>Feedback</span>
                </button>
              )}
            </div>
          </div>
        )}

        {isMobileFeedbackOpen && feedbackContext && (
          <div
            className="fixed inset-0 z-[90] flex items-end bg-black/55 backdrop-blur-sm md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Virtual try-on feedback"
            onClick={() => setIsMobileFeedbackOpen(false)}
          >
            <div
              className="max-h-[82dvh] w-full overflow-hidden rounded-t-[28px] border-t border-[#D4AF37]/25 bg-[#FCFAF6] shadow-[0_-20px_60px_rgba(0,0,0,0.25)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#D4AF37]/15 px-4 py-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A6936]">
                    Your opinion matters
                  </p>
                  <h2 className="font-serif text-lg text-[#2F2416]">
                    Try-on feedback
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileFeedbackOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D4AF37]/20 bg-white text-[#2F2416]"
                  aria-label="Close feedback"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[calc(82dvh-4.5rem)] overflow-y-auto overscroll-contain px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {renderFeedbackConversation("mobile")}
              </div>
            </div>
          </div>
        )}

        {/* Lightbox */}
        {isLightboxOpen && activeDisplayImage && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{
              background: "rgba(0, 0, 0, 0.96)",
              backdropFilter: "blur(24px)",
            }}
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute right-4 top-4 z-10 rounded-full p-3 transition-all duration-300 hover:scale-110 hover:rotate-90 sm:right-6 sm:top-6 sm:p-4"
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              <X className="w-6 h-6 text-white" />
            </button>

            <div
              className="relative flex h-full w-full items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={activeDisplayImage}
                alt="Try-On Result - Full Size"
                className="h-full w-full object-contain modal-appear"
                style={{
                  boxShadow: "0 40px 120px rgba(0, 0, 0, 0.7)",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
