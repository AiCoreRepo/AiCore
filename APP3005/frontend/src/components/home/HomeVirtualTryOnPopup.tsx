import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Camera,
  Check,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Lock,
  Maximize2,
  RotateCcw,
  Sparkles,
  Upload,
  UserRound,
  UserPlus,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useAuth } from "@/context/AuthContext";
import { getGuestStaticTryOnLooks, tryOnAsGuest, tryOnWithGemini } from "@/lib/api";
import { normalizeTryOnResultImage } from "@/lib/try-on-history";
import {
  readGuestTryOnHandoff,
  saveGuestTryOnHandoff,
} from "@/lib/guest-tryon-handoff";

const POPUP_DISMISSED_KEY = "aivestire:home-virtual-tryon-dismissed";
const SESSION_AVATAR_KEY = "aivestire:home-tryon-avatar";
const SESSION_AVATAR_LOOK_KEY = "aivestire:home-tryon-avatar-look";
const SESSION_GUEST_AVATAR_LINK_KEY = "aivestire:home-tryon-avatar-link";
const GUEST_TRY_ON_USED_KEY =
  "aivestire_guest_try_on_used:gemini31-avatar-v2";
const GUEST_SESSION_KEY =
  "aivestire_guest_try_on_session:gemini31-avatar-v2";

const FALLBACK_MODEL_IMAGE = "/guesttryon/model.png";

type TryOnMode = "demo" | "upload";
type TryOnPhase = "ready" | "loading" | "result";
type GuestCollectionGender = "female" | "male";

interface HomeTryOnLook {
  id: string;
  productId?: string;
  title: string;
  subtitle: string;
  price: string;
  collectionImage: string;
  staticResultImage: string;
}

const FALLBACK_HOME_TRY_ON_LOOKS: HomeTryOnLook[] = [
  {
    id: "item1",
    title: "Ivory Threadwork Kurta",
    subtitle: "Ivory kurta with relaxed cocoa trousers",
    price: "₹2,899",
    collectionImage: "/guesttryon/item1.png",
    staticResultImage: "/guesttryon/item1.png",
  },
  {
    id: "item2",
    title: "Olive Breeze Shirt Set",
    subtitle: "Flowing olive shirt with soft ivory trousers",
    price: "₹2,899",
    collectionImage: "/guesttryon/item2.png",
    staticResultImage: "/guesttryon/item2.png",
  },
  {
    id: "item3",
    title: "Teal Woven Saree",
    subtitle: "Elegant teal drape with a woven border",
    price: "₹2,899",
    collectionImage: "/guesttryon/item3.png",
    staticResultImage: "/guesttryon/item3.png",
  },
];

const assetDataUrlCache = new Map<string, string>();
const imagePreloadCache = new Map<string, Promise<void>>();

const naturalizeVisibleMessage = (message: string) =>
  message
    .replaceAll("try-on", "try on")
    .replaceAll("Try-on", "Try on")
    .replaceAll("sign-in", "sign in")
    .replaceAll("full-body", "full body");

const preloadImage = (source: string): Promise<void> => {
  if (!source) return Promise.reject(new Error("Image source is missing."));

  const cached = imagePreloadCache.get(source);
  if (cached) return cached;

  const pending = new Promise<void>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("An image could not be preloaded."));
    image.src = source;

    if (image.complete && image.naturalWidth > 0) {
      resolve();
    }
  });

  imagePreloadCache.set(source, pending);
  pending.catch(() => imagePreloadCache.delete(source));
  return pending;
};

const preloadGuestCollection = (
  modelImage: string,
  looks: HomeTryOnLook[],
) =>
  Promise.all([
    preloadImage(modelImage),
    ...looks.flatMap((look) => [
      preloadImage(look.collectionImage),
      preloadImage(look.staticResultImage),
    ]),
  ]);

const imageSourceToDataUrl = async (source: string): Promise<string> => {
  if (source.startsWith("data:")) return source;
  const cached = assetDataUrlCache.get(source);
  if (cached) return cached;

  const response = await fetch(source);
  if (!response.ok) {
    throw new Error("The selected try on image could not be loaded.");
  }
  const blob = await response.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("The selected try on image could not be read."));
    reader.readAsDataURL(blob);
  });
  assetDataUrlCache.set(source, dataUrl);
  return dataUrl;
};

const readSessionValue = (key: string) => {
  try {
    return sessionStorage.getItem(key) || "";
  } catch {
    return "";
  }
};

const writeSessionValue = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // A large uploaded image can exceed browser storage. The current preview still works.
  }
};

const getGuestSession = () => {
  let value = localStorage.getItem(GUEST_SESSION_KEY);
  if (!value) {
    value = crypto.randomUUID().replace(/-/g, "");
    localStorage.setItem(GUEST_SESSION_KEY, value);
  }
  return value;
};

export function HomeVirtualTryOnPopup() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [staticModelImage, setStaticModelImage] = useState(FALLBACK_MODEL_IMAGE);
  const [homeTryOnLooks, setHomeTryOnLooks] = useState(FALLBACK_HOME_TRY_ON_LOOKS);
  const [initialAssetsReady, setInitialAssetsReady] = useState(false);
  const [collectionGender, setCollectionGender] = useState<GuestCollectionGender>("female");
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [mode, setMode] = useState<TryOnMode>("demo");
  const [phase, setPhase] = useState<TryOnPhase>("ready");
  const [selectedLookId, setSelectedLookId] = useState(FALLBACK_HOME_TRY_ON_LOOKS[0].id);
  const [uploadedAvatar, setUploadedAvatar] = useState("");
  const [resultImage, setResultImage] = useState("");
  const [message, setMessage] = useState("");
  const [expandedImage, setExpandedImage] = useState<{ src: string; alt: string } | null>(null);
  const [guestTryOnUsed, setGuestTryOnUsed] = useState(
    () => localStorage.getItem(GUEST_TRY_ON_USED_KEY) === "true",
  );
  const staticTimerRef = useRef<number | null>(null);

  const selectedLook = useMemo(
    () =>
      homeTryOnLooks.find((look) => look.id === selectedLookId) ||
      homeTryOnLooks[0],
    [homeTryOnLooks, selectedLookId],
  );

  useEffect(() => {
    const sessionAvatar =
      readSessionValue(SESSION_GUEST_AVATAR_LINK_KEY) ||
      readSessionValue(SESSION_AVATAR_KEY);
    const sessionLookId = readSessionValue(SESSION_AVATAR_LOOK_KEY);
    if (sessionAvatar) {
      setUploadedAvatar(sessionAvatar);
      setMode("upload");
    }
    if (FALLBACK_HOME_TRY_ON_LOOKS.some((look) => look.id === sessionLookId)) {
      setSelectedLookId(sessionLookId);
    }

    if (authLoading || !initialAssetsReady) return;
    if (user) {
      setOpen(false);
      return;
    }

    const shouldForceOpen =
      Boolean(
        (location.state as { openHomeVirtualTryOn?: boolean } | null)
          ?.openHomeVirtualTryOn,
      );
    if (
      !shouldForceOpen &&
      readSessionValue(POPUP_DISMISSED_KEY) === "true"
    ) {
      return;
    }
    const timer = window.setTimeout(
      () => setOpen(true),
      shouldForceOpen ? 300 : 1200,
    );
    return () => window.clearTimeout(timer);
  }, [authLoading, initialAssetsReady, location.state, user]);

  useEffect(() => {
    let cancelled = false;

    const prepareInitialCollection = async () => {
      let modelImage = FALLBACK_MODEL_IMAGE;
      let looks = FALLBACK_HOME_TRY_ON_LOOKS;

      try {
        const data = await getGuestStaticTryOnLooks("female");
        if (data.modelImage && data.looks.length === 3) {
          await preloadGuestCollection(data.modelImage, data.looks);
          modelImage = data.modelImage;
          looks = data.looks;
        }
      } catch {
        // Keep the local guest collection as a resilient fallback.
        await Promise.allSettled(
          [
            FALLBACK_MODEL_IMAGE,
            ...FALLBACK_HOME_TRY_ON_LOOKS.flatMap((look) => [
              look.collectionImage,
              look.staticResultImage,
            ]),
          ].map(preloadImage),
        );
      }

      if (cancelled) return;
      setStaticModelImage(modelImage);
      setHomeTryOnLooks(looks);
      setInitialAssetsReady(true);
    };

    void prepareInitialCollection();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectCollectionGender = async (gender: GuestCollectionGender) => {
    if (gender === collectionGender || collectionLoading) return;
    resetResult();
    setCollectionLoading(true);
    setMessage("");
    try {
      const data = await getGuestStaticTryOnLooks(gender);
      if (!data.modelImage || data.looks.length !== 3) {
        throw new Error(`The ${gender} guest collection is not ready.`);
      }
      await preloadGuestCollection(data.modelImage, data.looks);
      setCollectionGender(gender);
      setStaticModelImage(data.modelImage);
      setHomeTryOnLooks(data.looks);
      setSelectedLookId(data.looks[0].id);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "This guest collection could not be loaded.",
      );
    } finally {
      setCollectionLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (expandedImage) {
          setExpandedImage(null);
          return;
        }
        if (staticTimerRef.current !== null) {
          window.clearTimeout(staticTimerRef.current);
          staticTimerRef.current = null;
        }
        writeSessionValue(POPUP_DISMISSED_KEY, "true");
        setPhase("ready");
        setResultImage("");
        setMessage("");
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [expandedImage, open]);

  const resetResult = () => {
    if (staticTimerRef.current !== null) {
      window.clearTimeout(staticTimerRef.current);
      staticTimerRef.current = null;
    }
    setPhase("ready");
    setResultImage("");
    setMessage("");
    setExpandedImage(null);
  };

  const closePopup = () => {
    resetResult();
    writeSessionValue(POPUP_DISMISSED_KEY, "true");
    setOpen(false);
  };

  const selectMode = (nextMode: TryOnMode) => {
    setMode(nextMode);
    resetResult();
  };

  const handleLookSelect = (lookId: string) => {
    setSelectedLookId(lookId);
    writeSessionValue(SESSION_AVATAR_LOOK_KEY, lookId);
    resetResult();
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (guestTryOnUsed && !user) {
      event.target.value = "";
      setMessage("Your photo is locked after the completed try on. Sign up to continue.");
      return;
    }
    const file = event.target.files?.[0];
    setMessage("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setMessage("Please choose an image smaller than 6 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = String(reader.result || "");
      setUploadedAvatar(image);
      writeSessionValue(SESSION_AVATAR_KEY, image);
      resetResult();
    };
    reader.readAsDataURL(file);
  };

  const handleSignup = () => {
    const existingHandoff = readGuestTryOnHandoff();
    if (
      phase === "result" &&
      (!existingHandoff || existingHandoff.mode !== "upload")
    ) {
      saveGuestTryOnHandoff({
        mode,
        gender: collectionGender,
        look: {
          id: selectedLook.id,
          productId: selectedLook.productId,
          title: selectedLook.title,
          subtitle: selectedLook.subtitle,
          price: selectedLook.price,
          collectionImage: selectedLook.collectionImage,
        },
      });
    }
    setOpen(false);
    navigate("/user-signup", {
      state: {
        returnUrl: "/",
        returnState: { openHomeVirtualTryOn: true },
        fromGuestTryOn: true,
      },
    });
  };

  const handleTryOn = async () => {
    setMessage("");
    const originalInputImage =
      mode === "demo" ? staticModelImage : uploadedAvatar;
    if (mode === "demo") {
      setPhase("loading");
      staticTimerRef.current = window.setTimeout(() => {
        setResultImage(selectedLook.staticResultImage);
        setPhase("result");
        staticTimerRef.current = null;
      }, 1400);
      return;
    }
    if (mode === "upload" && !uploadedAvatar) {
      setMessage("Upload a clear photo facing the camera first.");
      return;
    }
    if (guestTryOnUsed && !user) {
      setMessage("Your free guest try on is used. Sign in to try more looks.");
      return;
    }
    try {
      setPhase("loading");
      const guestSession = getGuestSession();
      const [avatarImage, clothingImage] = await Promise.all([
        imageSourceToDataUrl(originalInputImage),
        imageSourceToDataUrl(selectedLook.collectionImage),
      ]);
      const result = user
        ? await tryOnWithGemini({
            avatarImage,
            clothingImage,
            additionalParams: {
              maskClothingModel: true,
              forceRegenerate: true,
            },
          })
        : await tryOnAsGuest({
            avatarImage,
            clothingImage,
            guestSession,
            additionalParams: {
              garmentGender: collectionGender,
              selectedLookId: selectedLook.productId || selectedLook.id,
            },
          });
      if (!result.success || !result.resultImage) {
        throw new Error(
          naturalizeVisibleMessage(result.message || "Try on could not be created."),
        );
      }
      const normalized = normalizeTryOnResultImage(result.resultImage);
      if (!normalized) throw new Error("Try on returned an invalid image.");
      await preloadImage(normalized);
      const guestAvatarUrl =
        typeof result.metadata?.guestAvatarUrl === "string"
          ? result.metadata.guestAvatarUrl
          : "";
      if (!user) {
        localStorage.setItem(GUEST_TRY_ON_USED_KEY, "true");
        setGuestTryOnUsed(true);
        if (mode === "upload" && guestAvatarUrl) {
          setUploadedAvatar(guestAvatarUrl);
          writeSessionValue(SESSION_GUEST_AVATAR_LINK_KEY, guestAvatarUrl);
        }
        writeSessionValue(SESSION_AVATAR_LOOK_KEY, selectedLook.id);
        const guestJobId =
          typeof result.metadata?.guestJobId === "string"
            ? result.metadata.guestJobId
            : "";
        if (mode === "upload" && guestAvatarUrl && guestJobId) {
          saveGuestTryOnHandoff({
            mode: "upload",
            gender: collectionGender,
            guestSession,
            guestJobId,
            guestAvatarUrl,
            look: {
              id: selectedLook.id,
              productId: selectedLook.productId,
              title: selectedLook.title,
              subtitle: selectedLook.subtitle,
              price: selectedLook.price,
              collectionImage: selectedLook.collectionImage,
            },
          });
        }
      }
      setResultImage(normalized);
      setPhase("result");
    } catch (error) {
      setPhase("ready");
      setMessage(
        error instanceof Error
          ? naturalizeVisibleMessage(error.message)
          : "Something went wrong. Please try again.",
      );
    }
  };

  const sourceImage = mode === "demo" ? staticModelImage : uploadedAvatar;
  const isUploadMissing = mode === "upload" && !uploadedAvatar;
  const shouldLockLook = (lookId: string) =>
    mode === "upload" &&
    guestTryOnUsed &&
    !user &&
    lookId !== selectedLook.id;

  return (
    <AnimatePresence>
      {open && !authLoading && !user && (
        <>
          <motion.div
            className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePopup}
          />
          <div className="fixed inset-0 z-[131] flex items-end justify-center sm:items-center sm:p-4">
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="home-tryon-title"
              className="relative flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-[#FCFAF6] shadow-[0_32px_90px_rgba(0,0,0,0.55)] sm:h-auto sm:max-h-[96dvh] sm:rounded-3xl lg:h-[min(850px,96dvh)]"
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
            >
              <header className="flex shrink-0 items-start justify-between border-b border-[#E8DCC4] px-3 py-2.5 sm:px-6 sm:py-4">
                <div className="pr-8">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A7437]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Virtual Try On
                  </div>
                  <h2 id="home-tryon-title" className="mt-0.5 font-serif text-lg leading-tight text-[#2C2416] sm:mt-1 sm:text-3xl">
                    See the outfit before you choose it
                  </h2>
                  <p className="mt-1 hidden max-w-4xl text-xs leading-5 text-[#6B5D4F] sm:block sm:text-sm">
                    Pick an outfit and see how it looks. Start with our model or upload your own photo.
                  </p>
                </div>
                <button type="button" onClick={closePopup} aria-label="Close virtual try on" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#DED3C3] bg-white text-[#5F5345] hover:bg-[#F5EFE5]">
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div
                className={`min-h-0 flex-1 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:overflow-hidden ${
                  phase === "ready"
                    ? "overflow-y-auto"
                    : "flex overflow-hidden lg:grid"
                }`}
              >
                <div
                  className={`p-3 sm:p-4 lg:overflow-hidden ${
                    phase === "ready" ? "block" : "hidden sm:block"
                  }`}
                >
                  <section>
                    <div className="mb-3 hidden items-center gap-3 sm:flex">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2C2416] text-xs font-bold text-white">1</span>
                      <div>
                        <h3 className="text-sm font-bold text-[#2C2416]">Who are you dressing?</h3>
                        <p className="text-xs text-[#7A6B5B]">Try instantly or use your own photo.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <button type="button" onClick={() => selectMode("demo")} className={`min-h-12 rounded-xl border p-2 text-left transition sm:p-2.5 ${mode === "demo" ? "border-[#B78C32] bg-[#FBF4E4] ring-1 ring-[#D4AF37]" : "border-[#E1D7C8] bg-white hover:border-[#C8B89F]"}`}>
                        <span className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#2C2416] sm:justify-start sm:gap-2 sm:text-sm"><UserRound className="h-4 w-4 text-[#9A7437]" /> Our model</span>
                        <span className="mt-1 hidden text-[11px] leading-4 text-[#6B5D4F] sm:block">Instant preview · no sign in</span>
                      </button>
                      <button type="button" onClick={() => selectMode("upload")} className={`min-h-12 rounded-xl border p-2 text-left transition sm:p-2.5 ${mode === "upload" ? "border-[#B78C32] bg-[#FBF4E4] ring-1 ring-[#D4AF37]" : "border-[#E1D7C8] bg-white hover:border-[#C8B89F]"}`}>
                        <span className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#2C2416] sm:justify-start sm:gap-2 sm:text-sm"><Camera className="h-4 w-4 text-[#9A7437]" /> My photo</span>
                        <span className="mt-1 hidden text-[11px] leading-4 text-[#6B5D4F] sm:block">One AI preview · no sign in</span>
                      </button>
                    </div>
                  </section>

                  <section className="mt-2 sm:mt-3">
                    <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-[#E1D7C8] bg-white p-1 sm:p-1.5">
                      <span className="hidden pl-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A765F] sm:block">
                        Collection
                      </span>
                      <div className="grid flex-1 grid-cols-2 gap-1 sm:max-w-[270px]">
                        {(["female", "male"] as const).map((gender) => (
                          <button
                            key={gender}
                            type="button"
                            onClick={() => selectCollectionGender(gender)}
                            disabled={collectionLoading}
                            aria-pressed={collectionGender === gender}
                            className={`flex min-h-10 items-center justify-center rounded-lg px-4 text-xs font-bold capitalize transition sm:min-h-11 ${
                              collectionGender === gender
                                ? "bg-[#2C2416] text-white shadow-sm"
                                : "text-[#6B5D4F] hover:bg-[#F5EFE5]"
                            } disabled:cursor-wait disabled:opacity-60`}
                          >
                            {collectionLoading && collectionGender !== gender ? (
                              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            ) : null}
                            {gender}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-2 flex items-center gap-2 sm:mb-3 sm:gap-3">
                      <span className="hidden h-7 w-7 items-center justify-center rounded-full bg-[#2C2416] text-xs font-bold text-white sm:flex">2</span>
                      <div>
                        <h3 className="text-sm font-bold text-[#2C2416]">Pick an outfit</h3>
                        <p className="hidden text-xs text-[#7A6B5B] sm:block">
                          Three {collectionGender === "male" ? "men’s" : "women’s"} looks from the collection.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pb-1 sm:gap-3">
                      {homeTryOnLooks.map((look) => {
                        const selected = look.id === selectedLook.id;
                        const locked = shouldLockLook(look.id);
                        return (
                          <button type="button" key={look.id} disabled={locked} onClick={() => handleLookSelect(look.id)} aria-pressed={selected} className={`group relative min-w-0 overflow-hidden rounded-xl border bg-white text-left transition ${selected ? "border-[#B78C32] ring-2 ring-[#D4AF37]/50" : "border-[#E1D7C8] hover:-translate-y-0.5 hover:border-[#C8B89F]"} ${locked ? "cursor-not-allowed grayscale" : ""}`}>
                            {selected && <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#2C2416] text-white"><Check className="h-3.5 w-3.5" /></span>}
                            {locked && <span className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#241D15]/70 text-center text-white backdrop-blur-[1px]"><Lock className="h-5 w-5" /><span className="mt-1 text-[10px] font-bold uppercase tracking-wider">Sign in to unlock</span></span>}
                            <span
                              role="button"
                              tabIndex={0}
                              aria-label={`View ${look.title} full screen`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setExpandedImage({ src: look.collectionImage, alt: `${look.title} full body collection look` });
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  setExpandedImage({ src: look.collectionImage, alt: `${look.title} full body collection look` });
                                }
                              }}
                              className={`absolute left-1.5 top-1.5 z-30 flex h-8 min-h-8 w-8 min-w-8 max-w-8 flex-none items-center justify-center rounded-full border border-white/50 bg-black/25 text-white shadow-md backdrop-blur-sm sm:left-2 sm:top-2 ${locked ? "hidden" : ""}`}
                            >
                              <Maximize2 className="h-3.5 w-3.5" />
                            </span>
                            <img src={look.collectionImage} alt={`${look.title} full body collection look`} className="h-[29vw] max-h-32 min-h-24 w-full bg-[#F1EADF] object-contain object-center sm:h-40 sm:max-h-none lg:h-[clamp(9rem,19vh,10.5rem)]" />
                            <span className="block p-1.5 sm:p-2">
                              <span className="line-clamp-2 block min-h-7 text-[10px] font-bold leading-3.5 text-[#2C2416] sm:min-h-8 sm:text-sm sm:leading-4">{look.title}</span>
                              <span className="mt-0.5 hidden truncate whitespace-nowrap text-[10px] leading-4 text-[#786A5B] sm:block">{look.subtitle}</span>
                              <span className="mt-1 hidden text-[11px] font-semibold text-[#9A7437] sm:block">{look.price}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </div>

                <div
                  className={`flex min-h-0 flex-1 flex-col bg-[#241D15] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-white sm:min-h-[500px] sm:p-5 lg:min-h-0 lg:overflow-hidden ${
                    phase === "ready" ? "min-h-[350px]" : "h-full"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2 sm:mb-3 sm:gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-[#241D15]">3</span>
                    <div>
                      <h3 className="text-sm font-bold">See your result</h3>
                      <p className="text-xs text-white/55">{mode === "demo" ? "Ready in a few seconds." : "AI fits the selected outfit to your photo."}</p>
                    </div>
                  </div>

                  <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#EEE5D7]">
                    {phase === "loading" ? (
                      <div className="flex h-full min-h-[300px] flex-col items-center justify-center px-8 text-center text-[#2C2416] sm:min-h-[360px]">
                        <Loader2 className="h-10 w-10 animate-spin text-[#A77B22]" />
                        <p className="mt-4 font-serif text-xl">Creating your look…</p>
                        <p className="mt-2 text-xs leading-5 text-[#6B5D4F]">{mode === "demo" ? "Loading the prepared preview." : "Our AI is fitting the outfit to your photo. This can take up to a minute."}</p>
                      </div>
                    ) : phase === "result" && resultImage ? (
                      <div className="relative h-full min-h-[300px] bg-[#EEE5D7] sm:min-h-[420px]">
                        <span className="absolute left-3 top-3 z-10 rounded-full bg-[#D4AF37] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#241D15]">
                          Final virtual try on
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedImage({
                              src: resultImage,
                              alt: `${selectedLook.title} virtual try on result`,
                            })
                          }
                          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-black/25 text-white shadow-md backdrop-blur-sm transition hover:scale-105 hover:bg-black/45"
                          aria-label="View virtual try on result full screen"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </button>
                        <img
                          src={resultImage}
                          alt={`${selectedLook.title} virtual try on result`}
                          className="h-full min-h-[300px] w-full object-contain object-center sm:min-h-[420px]"
                        />
                        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-xl bg-black/70 px-3 py-2 text-xs text-white backdrop-blur-sm">
                          <span className="flex items-center gap-2 font-semibold">
                            <CheckCircle2 className="h-4 w-4 text-[#E4C45D]" />
                            Your preview is ready
                          </span>
                          <button type="button" onClick={resetResult} className="flex min-h-9 items-center gap-1 text-white/75 hover:text-white">
                            <RotateCcw className="h-3.5 w-3.5" />
                            Change look
                          </button>
                        </div>
                      </div>
                    ) : isUploadMissing ? (
                      <label className="flex h-[230px] min-h-[230px] cursor-pointer flex-col items-center justify-center px-8 text-center text-[#2C2416] transition hover:bg-white/30 sm:h-full sm:min-h-[360px]">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm"><Upload className="h-6 w-6 text-[#A77B22]" /></span>
                        <span className="mt-4 text-base font-bold">Upload a full body photo</span>
                        <span className="mt-2 max-w-xs text-xs leading-5 text-[#6B5D4F]">Face the camera, keep your arms visible, and use good lighting for the best result.</span>
                        <span className="mt-4 rounded-full bg-[#2C2416] px-5 py-2 text-xs font-bold text-white">Choose photo</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleUpload} />
                      </label>
                    ) : (
                      <div className="relative h-[230px] min-h-[230px] sm:h-full sm:min-h-[360px]">
                        <button type="button" onClick={() => setExpandedImage({ src: sourceImage, alt: mode === "demo" ? "Demo model before try on" : "Your uploaded photo" })} className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-black/25 text-white shadow-lg backdrop-blur-sm transition hover:scale-105 hover:bg-black/45" aria-label="View model image full screen"><Maximize2 className="h-4 w-4" /></button>
                        <img src={sourceImage} alt={mode === "demo" ? "Demo model before try on" : "Your uploaded photo"} className="h-full w-full object-contain object-center sm:min-h-[360px]" />
                        {mode === "upload" && (
                          guestTryOnUsed && !user ? (
                            <button
                              type="button"
                              disabled
                              aria-label="Photo locked after completed try on"
                              className="absolute bottom-3 right-3 flex cursor-not-allowed items-center gap-1.5 rounded-full bg-black/70 px-3 py-2 text-[11px] font-semibold text-white/65 backdrop-blur-sm"
                            >
                              <Lock className="h-3.5 w-3.5" />
                              Photo locked
                            </button>
                          ) : (
                            <label className="absolute bottom-3 right-3 cursor-pointer rounded-full bg-black/70 px-3 py-2 text-[11px] font-semibold text-white backdrop-blur-sm hover:bg-black/80">
                              Change photo
                              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleUpload} />
                            </label>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {message && <p role="alert" className="mt-3 rounded-lg border border-red-300/20 bg-red-300/10 px-3 py-2 text-xs leading-5 text-red-100">{message}</p>}

                  <div className="mt-3 sm:mt-4">
                    <div className="grid grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)] gap-2">
                      <button type="button" onClick={handleTryOn} disabled={phase === "loading" || isUploadMissing} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-3 text-sm font-bold text-[#241D15] transition hover:bg-[#E1BE4A] disabled:cursor-not-allowed disabled:opacity-45">
                        {phase === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {phase === "result" ? "Try Again" : "Try On"}
                      </button>
                      <button type="button" onClick={handleSignup} className="creator-shine-button flex h-12 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 text-[10px] font-bold text-[#E4C45D] transition min-[375px]:text-[11px] sm:gap-2 sm:px-3 sm:text-xs">
                        <UserPlus className="h-4 w-4 shrink-0" /> Sign Up for More Fashion Trends
                      </button>
                    </div>
                    <p className="mt-2 hidden text-center text-[10px] leading-4 text-white/45 sm:block">
                      {phase === "result" && !user
                        ? "Create your account to save this look and discover more styles."
                        : mode === "demo"
                        ? "One model with three full body outfit previews."
                        : guestTryOnUsed && !user
                          ? "Your photo and selected outfit are ready for sign in."
                          : "We create your avatar first, then apply the selected outfit."}
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>

            {expandedImage && (
              <div
                className="fixed inset-0 z-[160] flex items-center justify-center bg-black/95 p-3 backdrop-blur-sm sm:p-6"
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
                  className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/65 text-white shadow-xl transition hover:bg-white hover:text-black"
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
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
