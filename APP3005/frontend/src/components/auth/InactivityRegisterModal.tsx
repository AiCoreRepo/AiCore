import { useEffect, useMemo, useRef, useState } from "react";
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
const SESSION_KEY = "aivestire:register-popup-dismissed";
const ACTIVITY_EVENTS = [
  "pointerdown",
  "pointermove",
  "keydown",
  "scroll",
  "touchstart",
  "wheel",
] as const;

const PUBLIC_POPUP_PATHS = ["/", "/collection"] as const;

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
  const [googleLoading, setGoogleLoading] = useState(false);

  const imageTrack = useMemo(() => [...popupImages, ...popupImages], []);

  const dismissForSession = () => {
    setOpen(false);
    sessionStorage.setItem(SESSION_KEY, "true");
  };

  const handleRegister = () => {
    dismissForSession();
    navigate("/user-signup");
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
    if (loading || user || !shouldShowOnPath(location.pathname)) {
      setOpen(false);
      return;
    }

    if (sessionStorage.getItem(SESSION_KEY) === "true") {
      return;
    }

    const clearTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const scheduleOpen = () => {
      clearTimer();

      if (document.hidden || sessionStorage.getItem(SESSION_KEY) === "true") {
        return;
      }

      timerRef.current = window.setTimeout(() => {
        setOpen(true);
      }, SHOW_DELAY_MS);
    };

    const handleActivity = () => {
      if (open) {
        return;
      }

      scheduleOpen();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearTimer();
        return;
      }

      if (!open) {
        scheduleOpen();
      }
    };

    scheduleOpen();

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, handleActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimer();

      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, handleActivity);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loading, location.pathname, open, user]);

  if (loading || user || !shouldShowOnPath(location.pathname)) {
    return null;
  }

  if (!open) {
    return null;
  }

  return (
    <div className="register-popup-overlay fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="register-popup-content relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/60 lg:grid-cols-[1.1fr_0.9fr]">
        <button
          type="button"
          aria-label="Close register popup"
          className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/80 text-stone-700 transition hover:bg-white"
          onClick={dismissForSession}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col justify-between gap-6 p-6 sm:p-8 lg:p-10">
          <div className="space-y-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d7b56d]/50 bg-[#f8edd2] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6120]">
              <Sparkles className="h-3.5 w-3.5" />
              No Activity Detected
            </div>

            <div className="space-y-3">
              <h2 className="font-serif text-3xl leading-tight text-[#2f1b0d] sm:text-4xl">
                Register and unlock personalized fashion picks.
              </h2>
              <p className="max-w-xl text-sm leading-7 text-stone-600 sm:text-base">
                Create your AIVestire profile to save looks, discover curated
                collections, and move faster into try-on and styling flows.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:max-w-md">
            <Button
              type="button"
              variant="luxury"
              size="lg"
              className="h-12 rounded-full text-sm uppercase tracking-[0.18em]"
              onClick={handleRegister}
            >
              Register Now
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              size="lg"
              disabled={googleLoading}
              className="h-12 rounded-full border border-[#d8c59c] bg-white text-sm font-semibold text-[#2f1b0d] shadow-sm hover:bg-[#fff7e8]"
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
              {googleLoading ? "Connecting to Google..." : "Register With Google"}
            </Button>

            <button
              type="button"
              className="text-sm font-medium text-stone-500 transition hover:text-stone-800"
              onClick={dismissForSession}
            >
              Not now
            </button>
          </div>
        </div>

        <div className="order-first bg-[#f4ebd9] p-4 lg:order-none">
          <div className="register-popup-scroll-viewport h-56 rounded-[1.6rem] lg:h-full">
            <div className="register-popup-scroll-track">
              {imageTrack.map((image, index) => (
                <div key={`${image.label}-${index}`} className="register-popup-scroll-card">
                  <img src={image.src} alt={image.alt} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-4 text-white">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/70">
                      AIVestire
                    </p>
                    <p className="mt-1 text-base font-semibold">{image.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InactivityRegisterModal;
