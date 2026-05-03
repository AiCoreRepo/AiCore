import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  MessageSquarePlus,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  hasRegisteredEarlyAccess,
  registerEarlyAccessInterest,
  upcomingFeatureCards,
} from "@/constants/featureDiscovery";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { getOptimizedImageUrl } from "@/lib/utils";

export function UpcomingFeaturesSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [registeredFeatures, setRegisteredFeatures] = useState<string[]>([]);
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);
  const [featureRequest, setFeatureRequest] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [hasSubmittedRequest, setHasSubmittedRequest] = useState(false);
  const feature = upcomingFeatureCards[0];

  useEffect(() => {
    if (!user?.user_id) {
      setRegisteredFeatures([]);
      return;
    }

    const activeRegistrations = upcomingFeatureCards
      .filter((feature) => hasRegisteredEarlyAccess(user.user_id, feature.id))
      .map((feature) => feature.id);

    setRegisteredFeatures(activeRegistrations);
  }, [user]);

  useEffect(() => {
    setIsPreviewLoaded(false);
  }, [feature?.image]);

  const handleEarlyAccess = (featureId: (typeof upcomingFeatureCards)[number]["id"]) => {
    if (!user?.user_id) {
      navigate("/user-signup");
      return;
    }

    registerEarlyAccessInterest(user.user_id, featureId);
    setRegisteredFeatures((current) =>
      current.includes(featureId) ? current : [...current, featureId],
    );
  };

  const handleFeatureRequest = async () => {
    const trimmedRequest = featureRequest.trim();

    if (!trimmedRequest || !feature) {
      return;
    }

    setIsSubmittingRequest(true);

    const storageKey = `aivestire:feature-requests:${feature.id}`;
    const existingRequests = localStorage.getItem(storageKey);
    const parsedRequests = existingRequests ? JSON.parse(existingRequests) : [];

    parsedRequests.push({
      message: trimmedRequest,
      createdAt: new Date().toISOString(),
      userId: user?.user_id ?? null,
    });

    localStorage.setItem(storageKey, JSON.stringify(parsedRequests));

    await new Promise((resolve) => window.setTimeout(resolve, 320));

    setFeatureRequest("");
    setHasSubmittedRequest(true);
    setIsSubmittingRequest(false);
  };

  if (!feature) {
    return null;
  }

  const isRegistered = registeredFeatures.includes(feature.id);

  return (
    <section
      id="upcoming-features"
      className="relative overflow-hidden border-t border-white/6 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_30%),linear-gradient(180deg,#120d09_0%,#1b140f_42%,#f5eee2_42%,#f5eee2_100%)] py-16 sm:py-20 lg:py-24"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_62%)]" />
      <div className="container-luxury relative z-10">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-[#E7C870]/35 bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,rgba(212,175,55,0.18)_100%)] px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_14px_28px_rgba(17,12,8,0.18)] backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-[#D4AF37]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[#F0D68A]">
                Upcoming Feature
              </span>
            </div>
          </div>

          <div className="mx-auto mt-8 flex max-w-4xl justify-center">
            <div className="relative w-full overflow-hidden rounded-[2.2rem] border border-[#E4D6C1] bg-[linear-gradient(180deg,#fbf5ea_0%,#f1e4cf_100%)] p-3 shadow-[0_28px_80px_rgba(17,12,8,0.22)]">
              <div className="pointer-events-none absolute inset-x-10 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.22),transparent_70%)]" />
              {!isPreviewLoaded && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-[2.2rem] bg-[#f8f1e5]/78 backdrop-blur-sm">
                  <Loader2 className="h-9 w-9 animate-spin text-[#B88B2C]" />
                  <span className="text-sm font-medium tracking-[0.14em] text-[#7b5d1f]">
                    Loading preview
                  </span>
                </div>
              )}

              <img
                src={getOptimizedImageUrl(feature.image, 1600)}
                alt={feature.title}
                onLoad={() => setIsPreviewLoaded(true)}
                className={`relative h-auto w-full rounded-[1.85rem] border border-white/55 bg-[#f6efe4] object-contain drop-shadow-[0_24px_60px_rgba(17,12,8,0.18)] transition-opacity duration-500 ${
                  isPreviewLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <div className="text-center">
              <button
                type="button"
                onClick={() => handleEarlyAccess(feature.id)}
                className={`inline-flex h-12 items-center justify-center gap-2 rounded-full border px-6 text-sm font-semibold shadow-[0_18px_30px_rgba(17,12,8,0.18)] transition-all duration-300 ${
                  isRegistered
                    ? "border-[#D8C39B] bg-[#F7EEDC] text-[#7A5A1B]"
                    : "border-[#D4AF37]/40 bg-[#D4AF37] text-[#24160C] hover:bg-[#E3BF53]"
                }`}
              >
                {isRegistered ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Registered for early access
                  </>
                ) : (
                  <>
                    Register for early access
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            <div className="mx-auto max-w-2xl rounded-[1.75rem] border border-[#E3D6C2] bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(247,238,224,0.96)_100%)] p-5 shadow-[0_20px_60px_rgba(17,12,8,0.12)] sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F2E4C7] text-[#A67A21]">
                  <MessageSquarePlus className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-2xl text-[#2A1B10] sm:text-[1.85rem]">
                    Request a New Feature
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-[#6F5940] sm:text-[15px]">
                    Tell us what you want AiVestire to build next.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <Textarea
                  value={featureRequest}
                  onChange={(event) => {
                    setFeatureRequest(event.target.value);
                    if (hasSubmittedRequest) {
                      setHasSubmittedRequest(false);
                    }
                  }}
                  placeholder="Example: AI outfit moodboards, occasion-based wardrobe planning, creator wishlists..."
                  className="min-h-[120px] rounded-[1.2rem] border-[#DCCFB7] bg-white/88 px-4 py-3 text-[#24160C] placeholder:text-[#9B8870] focus-visible:ring-[#D4AF37]/35"
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#9A7B45]">
                    Your idea helps shape the next release
                  </p>

                  <Button
                    type="button"
                    onClick={handleFeatureRequest}
                    disabled={!featureRequest.trim() || isSubmittingRequest}
                    className="h-11 rounded-full bg-[#2A1B10] px-6 text-sm font-semibold text-[#F7EEDC] shadow-[0_16px_34px_rgba(17,12,8,0.18)] transition-colors duration-200 hover:bg-[#3A2617] disabled:bg-[#7C6B59]"
                  >
                    {isSubmittingRequest ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending
                      </>
                    ) : (
                      <>
                        Submit request
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>

                {hasSubmittedRequest && (
                  <div className="rounded-[1rem] border border-[#E3D1AE] bg-[#FFF8EC] px-4 py-3 text-sm text-[#7A5A1B]">
                    Feature request saved. We will use it to shape upcoming AiVestire experiences.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
