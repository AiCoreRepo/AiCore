import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { ArrowRight, Sparkles, X } from "lucide-react";

import { googleAuth } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/error-utils";
import heroClean from "@/assets/hero-clean.jpg";
import heroFashion from "@/assets/hero-fashion.jpg";
import collectionShowcase from "@/assets/collection-showcase.jpeg";
import authSignup from "@/assets/auth-hero-signup.jpg";
import "./InactivityRegisterModal.css";

const SHOW_DELAY_MS = 10_000;
const POPUP_IMAGE_ROTATE_MS = 2400;
const SESSION_KEY = "aivestire:register-popup-dismissed";

const PUBLIC_POPUP_PATHS = ["/", "/collection", "/ai-try-on", "/aitryon", "/let-ai-decide"] as const;

const popupImages = [
  {
    src: heroClean,
    alt: "Elegant model styling preview",
    label: "Curated luxury edits",
  },
  {
    src: authSignup,
    alt: "AIVestire account signup preview",
    label: "Register in seconds",
  },
  {
    src: collectionShowcase,
    alt: "Fashion collection showcase",
    label: "Personalized discovery",
  },
  {
    src: heroFashion,
    alt: "Fashion editorial styling preview",
    label: "AI-led wardrobe journey",
  },
];

function shouldShowOnPath(pathname: string): boolean {
  return (
    PUBLIC_POPUP_PATHS.includes(pathname as (typeof PUBLIC_POPUP_PATHS)[number]) ||
    pathname.startsWith("/product/")
  );
}

export function InactivityRegisterModal() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [googleLoading, setGoogleLoading] = useState(false);

  const dismissForSession = () => {
    setOpen(false);
    sessionStorage.setItem(SESSION_KEY, "true");
  };

  const handleGoogleRegister = useGoogleLogin({
    flow: "implicit",
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);

      try {
        const result = await googleAuth({
          token: tokenResponse.access_token,
          role: "BUYER",
        });

        if (result.access_token) {
          localStorage.setItem("access_token", result.access_token);
        }

        window.dispatchEvent(new Event("auth-refresh"));
        window.dispatchEvent(new Event("aura-updated"));
        dismissForSession();
        navigate("/collection");
      } catch (error: unknown) {
        toast({
          title: "Google sign-up failed",
          description: getErrorMessage(
            error,
            "Could not complete Google sign-up. Please try again.",
          ),
          variant: "destructive",
        });
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      toast({
        title: "Google sign-up failed",
        description: "Could not connect to Google. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    if (loading || user || !shouldShowOnPath(location.pathname)) {
      clearTimer();
      setOpen(false);
      return clearTimer;
    }

    if (sessionStorage.getItem(SESSION_KEY) === "true") {
      clearTimer();
      return clearTimer;
    }

    clearTimer();
    timerRef.current = window.setTimeout(() => {
      setOpen(true);
    }, SHOW_DELAY_MS);

    return clearTimer;
  }, [loading, location.pathname, user]);

  useEffect(() => {
    if (!open) {
      setActiveImageIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setActiveImageIndex((current) => (current + 1) % popupImages.length);
    }, POPUP_IMAGE_ROTATE_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [open]);

  if (loading || user || !shouldShowOnPath(location.pathname)) {
    return null;
  }

  if (!open) {
    return null;
  }

  return (
    <div className="register-popup-overlay fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="register-popup-content register-popup-compact relative w-full max-w-[26rem] overflow-hidden rounded-[1.5rem] border border-white/60">
        <button
          type="button"
          aria-label="Close register popup"
          className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/80 text-stone-700 transition hover:bg-white"
          onClick={dismissForSession}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="register-popup-media relative h-44 overflow-hidden sm:h-48">
          <img
            src={popupImages[activeImageIndex].src}
            alt={popupImages[activeImageIndex].alt}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-4 text-white">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/70">
              AIVestire
            </p>
            <p className="mt-1 text-sm font-semibold">
              {popupImages[activeImageIndex].label}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="space-y-2.5">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d7b56d]/50 bg-[#f8edd2] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a6120]">
              <Sparkles className="h-3.5 w-3.5" />
              Join AIVestire
            </div>

            <h2 className="font-serif text-[1.7rem] leading-tight text-[#2f1b0d] sm:text-[1.9rem]">
              Create your account in one tap.
            </h2>
            <p className="text-sm leading-6 text-stone-600">
              Register with Google to create your avatar, try on outfits, and get smarter recommendations.
            </p>
          </div>

          <Button
            type="button"
            disabled={googleLoading}
            className="h-11 rounded-full border border-[#d8c59c] bg-white text-sm font-semibold text-[#2f1b0d] shadow-sm hover:bg-[#fff7e8]"
            onClick={() => handleGoogleRegister()}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
            >
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 0.8 3.7 1.4l2.5-2.4C16.7 3.5 14.6 2.6 12 2.6 6.9 2.6 2.8 6.7 2.8 11.8S6.9 21 12 21c6.9 0 9.1-4.8 9.1-7.3 0-.5 0-1-.1-1.4H12Z"
              />
              <path
                fill="#34A853"
                d="M2.8 7.5 6 9.8c.9-1.8 2.8-3.1 6-3.1 1.8 0 3 0.8 3.7 1.4l2.5-2.4C16.7 3.5 14.6 2.6 12 2.6c-3.6 0-6.8 2-8.4 4.9Z"
              />
              <path
                fill="#FBBC05"
                d="M12 21c2.5 0 4.7-.8 6.3-2.3l-2.9-2.4c-.8.6-1.9 1-3.4 1-3.7 0-5.1-2.6-5.4-3.9l-3.2 2.5C5 19 8.2 21 12 21Z"
              />
              <path
                fill="#4285F4"
                d="M21.1 13.7c0-.5 0-1-.1-1.4H12v3.9h5.4c-.3 1.2-1.2 2.1-2 2.7l2.9 2.4c1.7-1.6 2.8-4 2.8-7.6Z"
              />
            </svg>
            {googleLoading ? "Connecting..." : "Register with Google"}
            <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="text-xs text-stone-500">
            Shows after 10 seconds on page.
          </p>
        </div>
      </div>
    </div>
  );
}

export default InactivityRegisterModal;
