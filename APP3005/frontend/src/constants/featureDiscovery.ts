import { cloudinaryImages } from "@/constants/cloudinaryImages";

export const POST_LOGIN_WORKFLOW_SESSION_KEY =
  "aivestire:post-login-workflow-pending";

export interface LoginOnboardingSlide {
  id: "styled-for-you" | "create-aura" | "ai-try-on" | "guided-finish";
  stepLabel: string;
  title: string;
  description: string;
}

export const loginOnboardingSlides: LoginOnboardingSlide[] = [
  {
    id: "styled-for-you",
    stepLabel: "Step 1",
    title: "Designed, stitched, and styled for you",
    description: "See styling ideas shaped around your taste and look.",
  },
  {
    id: "create-aura",
    stepLabel: "Step 2",
    title: "Create your Aura avatar",
    description: "Create your Aura in a few simple guided steps.",
  },
  {
    id: "ai-try-on",
    stepLabel: "Step 3",
    title: "Try outfits on instantly",
    description: "Preview outfits on yourself before making a choice.",
  },
  {
    id: "guided-finish",
    stepLabel: "Step 4",
    title: "Move through the experience with ease",
    description: "Navigate the experience smoothly and keep exploring with confidence.",
  },
];

export interface WorkflowDiscoveryGalleryImage {
  id: "preview-0" | "preview-1" | "preview-2" | "preview-3";
  image: string;
  alt: string;
}

export const workflowDiscoveryGalleryImages: WorkflowDiscoveryGalleryImage[] = [
  {
    id: "preview-0",
    image: cloudinaryImages.featureDiscovery.workflowPreview0,
    alt: "AiVestire workflow preview one",
  },
  {
    id: "preview-1",
    image: cloudinaryImages.featureDiscovery.workflowPreview1,
    alt: "AiVestire workflow preview two",
  },
  {
    id: "preview-2",
    image: cloudinaryImages.featureDiscovery.workflowPreview2,
    alt: "AiVestire workflow preview three",
  },
  {
    id: "preview-3",
    image: cloudinaryImages.featureDiscovery.workflowPreview3,
    alt: "AiVestire workflow preview four",
  },
];

export interface UpcomingFeatureCard {
  id: "main-sidebar-feature";
  title: string;
  description: string;
  image: string;
  accent: string;
}

export const upcomingFeatureCards: UpcomingFeatureCard[] = [
  {
    id: "main-sidebar-feature",
    title: "Upcoming preview",
    description:
      "This preview uses the upcoming image only. Register for early access to be first in when the experience launches.",
    image: cloudinaryImages.featureDiscovery.upcomingPreview,
    accent: "rgba(212, 175, 55, 0.22)",
  },
];

export function markWorkflowDiscoveryPending() {
  sessionStorage.setItem(POST_LOGIN_WORKFLOW_SESSION_KEY, "true");
}

export function hasPendingWorkflowDiscovery(): boolean {
  return sessionStorage.getItem(POST_LOGIN_WORKFLOW_SESSION_KEY) === "true";
}

export function clearWorkflowDiscoveryPending() {
  sessionStorage.removeItem(POST_LOGIN_WORKFLOW_SESSION_KEY);
}

export function getEarlyAccessStorageKey(
  userId: string,
  featureId: UpcomingFeatureCard["id"],
) {
  return `aivestire:early-access:${userId}:${featureId}`;
}

export function hasRegisteredEarlyAccess(
  userId: string,
  featureId: UpcomingFeatureCard["id"],
): boolean {
  return Boolean(
    localStorage.getItem(getEarlyAccessStorageKey(userId, featureId)),
  );
}

export function registerEarlyAccessInterest(
  userId: string,
  featureId: UpcomingFeatureCard["id"],
) {
  localStorage.setItem(
    getEarlyAccessStorageKey(userId, featureId),
    new Date().toISOString(),
  );
}
