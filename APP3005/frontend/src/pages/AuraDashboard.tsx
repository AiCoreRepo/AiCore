import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { HeroImageSection } from "@/components/aura/HeroImageSection";
import { AuraFormCard } from "@/components/aura/AuraFormCard";
import { ProcessingModal } from "@/components/aura/ProcessingModal";
import { AuraSuccessState } from "@/components/aura/AuraSuccessState";
import {
  FeedbackContextType,
  createAuraWithStream,
  type StreamEventHandler,
} from "@/lib/api";

interface BodyAttributes {
  height?: number;
  weight?: number;
  skinTone?: string;
  gender?: string;
  bodyShape?: string;
  bodySize?: string;
  ageRange?: string;
  hairStyle?: string;
}

interface AuraCreationFeedbackContext {
  type: FeedbackContextType;
  referenceId?: string;
  label?: string;
}

interface AuraDashboardLocationState {
  prefilledDob?: string;
}

const AuraDashboard = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatusMessage, setProcessingStatusMessage] = useState<string | null>(null);
  const [creationContext, setCreationContext] = useState<AuraCreationFeedbackContext | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as AuraDashboardLocationState | null;
  const prefilledDob = locationState?.prefilledDob;
  const progress = processingProgress;
  const estimatedTime = Math.max(0, Math.ceil((100 - progress) / 5));

  const handleCreateAura = async (photoFile: File, attributes: BodyAttributes) => {
    if (!localStorage.getItem('access_token')) {
      alert('Please log in to create your Aura');
      window.location.href = '/user-login';
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(8);
    setProcessingStatusMessage("Uploading and validating your photo");
    setCreationContext(null);

    try {
      const formData = new FormData();
      formData.append('photo', photoFile);

      if (attributes.height) formData.append('height', attributes.height.toString());
      if (attributes.weight) formData.append('weight', attributes.weight.toString());
      if (attributes.skinTone) formData.append('skinTone', attributes.skinTone);
      if (attributes.gender) formData.append('gender', attributes.gender);
      if (attributes.bodyShape) formData.append('bodyShape', attributes.bodyShape);
      if (attributes.bodySize) formData.append('bodySize', attributes.bodySize);
      if (attributes.ageRange) formData.append('ageRange', attributes.ageRange);
      if (attributes.hairStyle) formData.append('hairStyle', attributes.hairStyle);

      const handleStreamEvent: StreamEventHandler = (eventName, payload) => {
        if (!payload || typeof payload !== "object") {
          return;
        }

        const streamPayload = payload as {
          aura_id?: string;
          progress?: number;
          message?: string;
          status?: string;
          error?: string;
        };

        if (eventName === "accepted" && streamPayload.aura_id) {
          setCreationContext({
            type: "AVATAR_CREATION",
            referenceId: streamPayload.aura_id,
            label: "Avatar Creation",
          });
        }

        if (typeof streamPayload.progress === "number") {
          setProcessingProgress((prev) =>
            Math.max(prev, Math.min(streamPayload.progress, 100)),
          );
        }

        if (streamPayload.message) {
          setProcessingStatusMessage(streamPayload.message);
        } else if (eventName === "status" && streamPayload.status) {
          const statusMessageMap: Record<string, string> = {
            waiting: "Queued for avatar generation",
            active: "Generating your Aura with Gemini",
            completed: "Aura generation completed",
            failed: streamPayload.error || "Aura generation failed",
          };
          setProcessingStatusMessage(
            statusMessageMap[streamPayload.status] || "Processing your Aura",
          );
        }
      };

      const result = await createAuraWithStream(formData, {
        onEvent: handleStreamEvent,
      });

      const completedAuraId =
        result.auraId || result.aura?.aura_id || creationContext?.referenceId;
      setAvatarUrl(result.avatar?.url);
      setProcessingProgress(100);
      setProcessingStatusMessage("Aura generation completed");
      window.dispatchEvent(new Event('aura-updated'));

      setTimeout(() => {
        setIsProcessing(false);
        setProcessingProgress(0);
        setProcessingStatusMessage(null);
        navigate("/aura-profile", {
          state: {
            feedbackContext: {
              type: "AVATAR_CREATION",
              referenceId: completedAuraId,
              label: "Avatar Creation",
            },
            hideAuraLibrary: true,
          },
        });
      }, 700);
    } catch (error) {
      console.error('Error creating Aura:', error);
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessingStatusMessage(null);
      alert(error instanceof Error ? error.message : 'Failed to create Aura. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col lg:flex-row overflow-x-hidden lg:overflow-hidden">
      {/* Hero Image Section - Left side on desktop, top on mobile */}
      <HeroImageSection />

      {/* Form Card Section - Right side on desktop, bottom on mobile */}
      {!isSuccess ? (
        <AuraFormCard
          onCreateAura={handleCreateAura}
          isProcessing={isProcessing}
          prefilledDob={prefilledDob}
        />
      ) : (
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-ivory px-4 py-12">
          <div className="w-full max-w-xl">
            <AuraSuccessState avatarUrl={avatarUrl} />
          </div>
        </div>
      )}

      {/* Processing Modal */}
      <ProcessingModal
        isOpen={isProcessing}
        progress={progress}
        estimatedTime={estimatedTime}
        statusMessage={processingStatusMessage}
      />
    </div>
  );
};

export default AuraDashboard;
