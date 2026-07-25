import { ChangeEvent, useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Loader2, LogIn, Maximize2, Sparkles, Upload, X } from "lucide-react";
import { getProductImageUrl } from "@/lib/product-image";
import { normalizeTryOnResultImage } from "@/lib/try-on-history";
import { tryOnAsGuest } from "@/lib/api";
import { LOADING_QUOTES } from "@/components/ai-tryon/loading-quotes";
import { saveGuestTryOnHandoff } from "@/lib/guest-tryon-handoff";
import type { PublicProduct } from "@/hooks/useInfinitePublicProducts";

const GUEST_USED_KEY = "aivestire_guest_try_on_used:gemini31-avatar-v2";
const GUEST_SESSION_KEY =
  "aivestire_guest_try_on_session:gemini31-avatar-v2";

const getGuestSession = () => {
  let value = localStorage.getItem(GUEST_SESSION_KEY);
  if (!value) {
    value = crypto.randomUUID().replace(/-/g, "");
    localStorage.setItem(GUEST_SESSION_KEY, value);
  }
  return value;
};

interface GuestTryOnModalProps {
  isOpen: boolean;
  product: PublicProduct | null;
  garmentGender?: "male" | "female";
  onClose: () => void;
  onLogin: () => void;
}

export function GuestTryOnModal({
  isOpen,
  product,
  garmentGender,
  onClose,
  onLogin,
}: GuestTryOnModalProps) {
  const [photo, setPhoto] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [error, setError] = useState("");
  const [alreadyUsed, setAlreadyUsed] = useState(false);
  const [expandedImage, setExpandedImage] = useState<{ src: string; alt: string } | null>(null);
  const garmentImage = product
    ? getProductImageUrl(product, { requireRemote: true }) || ""
    : "";

  useEffect(() => {
    if (!isOpen) return;
    setAlreadyUsed(localStorage.getItem(GUEST_USED_KEY) === "true");
    setPhoto("");
    setResult("");
    setError("");
    setCurrentQuoteIndex(0);
    setExpandedImage(null);
  }, [isOpen, product?.product_id]);

  useEffect(() => {
    if (!loading) return;
    const interval = window.setInterval(() => {
      setCurrentQuoteIndex((current) => (current + 1) % LOADING_QUOTES.length);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (!expandedImage) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpandedImage(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [expandedImage]);

  const expandButton = (src: string, alt: string) => (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setExpandedImage({ src, alt });
      }}
      className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/95 text-[#2C2416] shadow-lg transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
      aria-label={`View ${alt} full screen`}
      title="View full screen"
    >
      <Maximize2 className="h-4 w-4" />
    </button>
  );

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setError("Please upload an image smaller than 6 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const runGuestTryOn = async () => {
    if (!photo || !garmentImage || loading) return;
    setLoading(true);
    setCurrentQuoteIndex(0);
    setError("");
    try {
      const guestSession = getGuestSession();
      const response = await tryOnAsGuest({
        avatarImage: photo,
        clothingImage: garmentImage,
        guestSession,
        additionalParams: {
          garmentGender,
          selectedLookId: product?.product_id,
        },
      });
      const image = normalizeTryOnResultImage(response.resultImage);
      if (!response.success || !image) {
        throw new Error(response.message || "Try-on could not be created.");
      }
      setResult(image);
      setAlreadyUsed(true);
      localStorage.setItem(GUEST_USED_KEY, "true");
      const guestJobId =
        typeof response.metadata?.guestJobId === "string"
          ? response.metadata.guestJobId
          : "";
      const guestAvatarUrl =
        typeof response.metadata?.guestAvatarUrl === "string"
          ? response.metadata.guestAvatarUrl
          : "";
      if (guestJobId && guestAvatarUrl && product) {
        saveGuestTryOnHandoff({
          mode: "upload",
          gender: garmentGender === "male" ? "male" : "female",
          guestSession,
          guestJobId,
          guestAvatarUrl,
          look: {
            id: product.product_id,
            productId: product.product_id,
            title: product.title,
            collectionImage: garmentImage,
          },
        });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Guest try-on failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogPrimitive.Root open={isOpen && Boolean(product)} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[75] bg-black/70 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed inset-0 z-[76] flex h-[100dvh] w-full flex-col overflow-hidden bg-[#FCFAF6] shadow-2xl outline-none sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[94vh] sm:w-[96vw] sm:max-w-5xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E8DCC4] px-3 py-3 sm:px-5 sm:py-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#98752E]">One free guest try-on</p>
              <DialogPrimitive.Title className="truncate font-serif text-lg text-[#2C2416] sm:text-2xl">
                {loading
                  ? "Creating your look"
                  : result
                    ? "Your try-on is ready"
                    : "Upload your full-body photo"}
              </DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Close className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6">
            {loading ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#FCFAF6] via-[#F7F0E4] to-[#EFE2CF] px-6 text-center sm:min-h-[560px]">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#C9A55C] to-[#D4B896] shadow-[0_10px_28px_rgba(201,165,92,0.35)]">
                  <Sparkles className="h-8 w-8 animate-pulse text-white" />
                </span>
                <h3 className="mt-5 font-serif text-2xl font-bold text-[#2C2416]">
                  Creating Your Look
                </h3>
                <p
                  className="mt-3 min-h-12 max-w-md text-sm leading-6 text-[#6B5D4F]"
                  aria-live="polite"
                >
                  {LOADING_QUOTES[currentQuoteIndex]}
                </p>
                <div className="mt-5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[#DCCDB7]">
                  <span className="block h-full w-2/3 animate-pulse rounded-full bg-[#C9A55C]" />
                </div>
                <p className="mt-4 text-xs text-[#87745D]">
                  Keep this window open while we fit the outfit to your photo.
                </p>
              </div>
            ) : alreadyUsed && !result ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <Sparkles className="h-12 w-12 text-[#D4AF37]" />
                <h3 className="mt-4 font-serif text-3xl text-[#2C2416]">Want to try another look?</h3>
                <p className="mt-2 max-w-md text-sm text-[#6B5D4F]">Sign in to save your Aura and continue with more virtual try-ons.</p>
                <button onClick={onLogin} className="mt-6 flex h-12 items-center gap-2 rounded-xl bg-[#D4AF37] px-7 font-bold text-[#2C2416]">
                  <LogIn className="h-4 w-4" /> Sign in to try more
                </button>
              </div>
            ) : result ? (
              <div className="grid gap-3 md:min-h-[560px] md:grid-cols-2">
                <figure className="relative min-h-[360px] overflow-hidden rounded-2xl bg-[#EEE5D7] sm:min-h-[480px] md:min-h-[560px]">
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-black/75 px-3 py-1 text-xs font-bold text-white">Your uploaded photo</span>
                  {expandButton(photo, "uploaded full-body model")}
                  <img src={photo} alt="Uploaded full-body model" className="absolute inset-0 h-full w-full object-contain" />
                </figure>
                <figure className="relative min-h-[360px] overflow-hidden rounded-2xl bg-[#EEE5D7] sm:min-h-[480px] md:min-h-[560px]">
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-[#D4AF37] px-3 py-1 text-xs font-bold text-[#2C2416]">Your AI try-on</span>
                  {expandButton(result, "guest virtual try-on result")}
                  <img src={result} alt="Guest virtual try-on result" className="absolute inset-0 h-full w-full object-contain" />
                </figure>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                <label className="relative flex min-h-[360px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#D4AF37] bg-white sm:min-h-[480px] md:min-h-[560px]">
                  {photo ? (
                    <>
                      {expandButton(photo, "selected full-body photo")}
                      <img src={photo} alt="Selected full-body photo" className="absolute inset-0 h-full w-full object-contain" />
                    </>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-[#D4AF37]" />
                      <strong className="mt-4 text-lg text-[#2C2416]">Choose your photo</strong>
                      <span className="mt-2 max-w-xs text-center text-sm text-[#6B5D4F]">Use a clear, front-facing, head-to-toe image.</span>
                    </>
                  )}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleUpload} />
                </label>
                <figure className="relative min-h-[360px] overflow-hidden rounded-2xl bg-white sm:min-h-[480px] md:min-h-[560px]">
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-black/75 px-3 py-1 text-xs font-bold text-white">Selected collection outfit</span>
                  {expandButton(garmentImage, product?.title || "selected outfit")}
                  <img src={garmentImage} alt={product?.title || "Selected outfit"} className="absolute inset-0 h-full w-full object-contain" />
                </figure>
              </div>
            )}
            {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          </div>

          {!alreadyUsed && !result && (
            <footer className="shrink-0 border-t border-[#E8DCC4] bg-[#FCFAF6] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
              <button disabled={!photo || loading} onClick={runGuestTryOn} className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3.5 font-bold text-[#2C2416] disabled:opacity-45">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                {loading ? "Creating your try-on…" : "Try on free — no sign-in"}
              </button>
            </footer>
          )}
          {result && (
            <footer className="shrink-0 border-t border-[#E8DCC4] bg-[#FCFAF6] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
              <button onClick={onLogin} className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#2C2416] px-5 py-3.5 font-bold text-white">
                <LogIn className="h-5 w-5" /> Sign in to try more
              </button>
            </footer>
          )}

          {expandedImage && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-3 backdrop-blur-sm sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-label={`${expandedImage.alt} full-screen image`}
              onClick={() => setExpandedImage(null)}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setExpandedImage(null);
                }}
                className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/65 text-white shadow-xl"
                aria-label="Close full-screen image"
              >
                <X className="h-6 w-6" />
              </button>
              <img
                src={expandedImage.src}
                alt={expandedImage.alt}
                className="max-h-[94dvh] max-w-[96vw] object-contain"
                onClick={(event) => event.stopPropagation()}
              />
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
