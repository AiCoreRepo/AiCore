import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { fetchCreatorOnboardingState } from "@/lib/creatorOnboarding";

interface CreatorOnboardingGuardProps {
  children: ReactNode;
}

export const CreatorOnboardingGuard = ({ children }: CreatorOnboardingGuardProps) => {
  const [status, setStatus] = useState<"checking" | "allowed" | "redirect">("checking");

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const onboardingState = await fetchCreatorOnboardingState();
        setStatus(onboardingState.isComplete ? "allowed" : "redirect");
      } catch (error) {
        console.error("Failed to verify creator onboarding state:", error);
        setStatus("allowed");
      }
    };

    void checkOnboarding();
  }, []);

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#D4AF37] border-t-transparent"></div>
      </div>
    );
  }

  if (status === "redirect") {
    return <Navigate to="/creator-onboarding" replace />;
  }

  return <>{children}</>;
};
