import { claimGuestTryOn } from "@/lib/api";

const GUEST_TRY_ON_HANDOFF_KEY = "aivestire:guest-tryon-handoff:v1";
const HANDOFF_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface GuestTryOnHandoffLook {
  id: string;
  productId?: string;
  title: string;
  subtitle?: string;
  price?: string;
  collectionImage: string;
}

export interface GuestTryOnHandoff {
  version: 1;
  mode: "demo" | "upload";
  gender: "female" | "male";
  guestSession?: string;
  guestJobId?: string;
  guestAvatarUrl?: string;
  look: GuestTryOnHandoffLook;
  createdAt: number;
}

export type GuestTryOnResumeResult =
  | { kind: "none" }
  | { kind: "requires-aura"; handoff: GuestTryOnHandoff }
  | { kind: "navigate"; to: string; state?: Record<string, unknown> };

export const saveGuestTryOnHandoff = (
  handoff: Omit<GuestTryOnHandoff, "version" | "createdAt">,
) => {
  try {
    sessionStorage.setItem(
      GUEST_TRY_ON_HANDOFF_KEY,
      JSON.stringify({
        ...handoff,
        version: 1,
        createdAt: Date.now(),
      } satisfies GuestTryOnHandoff),
    );
  } catch {
    // Authentication can still continue if storage is unavailable.
  }
};

export const clearGuestTryOnHandoff = () => {
  try {
    sessionStorage.removeItem(GUEST_TRY_ON_HANDOFF_KEY);
  } catch {
    // Ignore unavailable browser storage.
  }
};

export const readGuestTryOnHandoff = (): GuestTryOnHandoff | null => {
  try {
    const raw = sessionStorage.getItem(GUEST_TRY_ON_HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GuestTryOnHandoff>;
    if (
      parsed.version !== 1 ||
      (parsed.mode !== "demo" && parsed.mode !== "upload") ||
      (parsed.gender !== "female" && parsed.gender !== "male") ||
      !parsed.look ||
      typeof parsed.look.title !== "string" ||
      typeof parsed.look.collectionImage !== "string" ||
      typeof parsed.createdAt !== "number" ||
      Date.now() - parsed.createdAt > HANDOFF_MAX_AGE_MS
    ) {
      clearGuestTryOnHandoff();
      return null;
    }
    return parsed as GuestTryOnHandoff;
  } catch {
    clearGuestTryOnHandoff();
    return null;
  }
};

export const resumeGuestTryOnAfterAuth = async (
  hasAura: boolean,
): Promise<GuestTryOnResumeResult> => {
  const handoff = readGuestTryOnHandoff();
  if (!handoff) return { kind: "none" };

  if (handoff.mode === "upload") {
    if (!handoff.guestSession || !handoff.guestJobId) {
      throw new Error(
        "The guest try-on session is incomplete. Please try the upload again.",
      );
    }
    const claimed = await claimGuestTryOn({
      guestSession: handoff.guestSession,
      jobId: handoff.guestJobId,
    });
    clearGuestTryOnHandoff();
    return {
      kind: "navigate",
      to: "/ai-try-on",
      state: {
        claimedGuestTryOn: {
          resultImage: claimed.resultImageUrl,
          tryOnId: claimed.tryOnId,
          productId: claimed.productId || handoff.look.productId,
          productTitle: claimed.productTitle || handoff.look.title,
          garmentImage: handoff.look.collectionImage,
        },
      },
    };
  }

  if (!hasAura) {
    return { kind: "requires-aura", handoff };
  }

  clearGuestTryOnHandoff();
  if (handoff.look.productId) {
    return {
      kind: "navigate",
      to: "/ai-try-on",
      state: {
        autoTryOnProductId: handoff.look.productId,
      },
    };
  }

  return {
    kind: "navigate",
    to: `/collection?section=${handoff.gender === "male" ? "mens" : "womens"}`,
  };
};
