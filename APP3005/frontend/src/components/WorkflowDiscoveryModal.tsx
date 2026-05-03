import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import type {
  LoginOnboardingSlide,
  WorkflowDiscoveryGalleryImage,
} from "@/constants/featureDiscovery";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getOptimizedImageUrl } from "@/lib/utils";

interface WorkflowDiscoveryModalProps {
  isOpen: boolean;
  slides: LoginOnboardingSlide[];
  galleryImages: WorkflowDiscoveryGalleryImage[];
  onClose: () => void;
}

export function WorkflowDiscoveryModal({
  isOpen,
  galleryImages,
  onClose,
}: WorkflowDiscoveryModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const totalSteps = galleryImages.length;
  const isLastStep = stepIndex === totalSteps - 1;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setStepIndex(0);
    setLoadedImages({});
  }, [isOpen]);

  if (!galleryImages.length) {
    return null;
  }

  const currentImage = galleryImages[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isCurrentImageLoaded = Boolean(loadedImages[currentImage.id]);

  const handlePrevious = () => {
    setStepIndex((current) => Math.max(current - 1, 0));
  };

  const handleAdvance = () => {
    if (isLastStep) {
      onClose();
      return;
    }

    setStepIndex((current) => Math.min(current + 1, totalSteps - 1));
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        className="w-[96vw] max-w-[980px] border-0 bg-transparent p-0 shadow-none sm:rounded-none [&>button]:hidden"
        onEscapeKeyDown={(event) => {
          event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          event.preventDefault();
        }}
      >
        <DialogTitle className="sr-only">AiVestire preview gallery</DialogTitle>
        <DialogDescription className="sr-only">
          Step through the AiVestire preview images one by one after login.
        </DialogDescription>

        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_30%),linear-gradient(180deg,#1b140f_0%,#120d09_100%)] shadow-[0_36px_100px_rgba(0,0,0,0.5)]">
          <div className="p-3 sm:p-4">
            <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0)_100%)] p-2 sm:p-3">
              <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_68%)]" />
              <div className="relative h-[62vh] min-h-[400px] max-h-[760px] sm:h-[70vh]">
                <div
                  key={`${currentImage.id}-${stepIndex}`}
                  className="absolute inset-0 flex animate-in fade-in zoom-in-95 items-center justify-center p-1 sm:p-2 duration-300"
                >
                  <img
                    src={getOptimizedImageUrl(currentImage.image, 2200)}
                    alt={currentImage.alt}
                    onLoad={() =>
                      setLoadedImages((current) => ({ ...current, [currentImage.id]: true }))
                    }
                    className={`h-full w-full rounded-[1.7rem] object-contain transition-opacity duration-500 ${
                      isCurrentImageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </div>

                {!isCurrentImageLoaded && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[1.6rem] bg-[#120d09]/65 backdrop-blur-sm">
                    <Loader2 className="h-9 w-9 animate-spin text-[#D4AF37]" />
                  </div>
                )}
              </div>
            </div>

            <div className="px-1 pb-1 pt-2 sm:px-2">
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  disabled={isFirstStep}
                  onClick={handlePrevious}
                  className="h-8 rounded-full border border-[#E6CB7B]/28 bg-[#2A1F17] px-4 text-[11px] font-semibold text-[#F8F2E8] shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition-colors duration-200 hover:bg-[#36281d] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-[#201813] disabled:text-white/45 sm:h-9 sm:px-5 sm:text-xs"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                <Button
                  type="button"
                  onClick={handleAdvance}
                  className="h-8 rounded-full bg-[#D4AF37] px-5 text-[11px] font-semibold text-[#1d140d] shadow-[0_16px_40px_rgba(0,0,0,0.28)] transition-colors duration-200 hover:bg-[#E2BD49] sm:h-9 sm:text-xs"
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
