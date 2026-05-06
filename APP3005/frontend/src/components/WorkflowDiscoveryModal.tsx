import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";

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
  slides: _slides,
  galleryImages,
  onClose,
}: WorkflowDiscoveryModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const totalSteps = galleryImages.length;
  const isLastStep = stepIndex === totalSteps - 1;
  const currentImage = galleryImages[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isCurrentImageLoaded = currentImage
    ? Boolean(loadedImages[currentImage.id])
    : false;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setStepIndex(0);
    setLoadedImages({});
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !galleryImages.length) {
      return;
    }

    const indexesToPreload = [stepIndex, stepIndex + 1, stepIndex - 1].filter(
      (index, position, indexes) =>
        index >= 0 && index < galleryImages.length && indexes.indexOf(index) === position,
    );

    const preloaders = indexesToPreload.map((index) => {
      const image = galleryImages[index];

      if (!image || loadedImages[image.id]) {
        return null;
      }

      const preloader = new window.Image();
      preloader.src = getOptimizedImageUrl(image.image, 2200);
      preloader.onload = () => {
        setLoadedImages((current) =>
          current[image.id] ? current : { ...current, [image.id]: true },
        );
      };

      return preloader;
    });

    return () => {
      preloaders.forEach((preloader) => {
        if (!preloader) {
          return;
        }

        preloader.onload = null;
      });
    };
  }, [galleryImages, isOpen, loadedImages, stepIndex]);

  if (!galleryImages.length) {
    return null;
  }

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
        className="w-[calc(100vw-1rem)] max-w-[1080px] border-0 bg-transparent p-0 shadow-none sm:w-[calc(100vw-2rem)] [&>button]:hidden"
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

        <div className="relative flex max-h-[calc(100svh-1rem)] flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_28%),linear-gradient(180deg,#1b140f_0%,#120d09_100%)] shadow-[0_36px_100px_rgba(0,0,0,0.5)] sm:max-h-[calc(100svh-2rem)] sm:rounded-[2rem]">
          <div className="absolute right-4 top-4 z-20 sm:right-5 sm:top-5">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close walkthrough"
              className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#F8F2E8] transition-colors hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 p-3 sm:p-4 lg:p-5">
            <div className="relative h-[78svh] min-h-[320px] overflow-hidden rounded-[1.3rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0)_100%)] p-1.5 sm:h-[82svh] sm:min-h-[420px] sm:rounded-[1.6rem] sm:p-2.5 lg:min-h-[640px]">
              <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_68%)]" />
              <div className="relative flex h-full items-center justify-center overflow-hidden rounded-[1.05rem] bg-[#120d09] lg:rounded-[1.35rem]">
                <div
                  key={`${currentImage.id}-${stepIndex}`}
                  className="absolute inset-0 flex animate-in fade-in zoom-in-95 items-center justify-center p-1 duration-300 sm:p-2"
                >
                  <img
                    src={getOptimizedImageUrl(currentImage.image, 2200)}
                    alt={currentImage.alt}
                    onLoad={() =>
                      setLoadedImages((current) => ({ ...current, [currentImage.id]: true }))
                    }
                    className={`h-full w-full object-contain transition-opacity duration-500 ${
                      isCurrentImageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </div>

                {!isCurrentImageLoaded && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#120d09]/70 backdrop-blur-sm">
                    <Loader2 className="h-9 w-9 animate-spin text-[#D4AF37]" />
                  </div>
                )}

                <div className="absolute inset-x-3 bottom-3 z-20 flex items-center justify-between gap-3 sm:inset-x-4 sm:bottom-4">
                  <Button
                    type="button"
                    size="icon"
                    disabled={isFirstStep}
                    onClick={handlePrevious}
                    className="h-11 w-11 rounded-full border border-[#E6CB7B]/28 bg-[#2A1F17]/90 text-[#F8F2E8] shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition-colors duration-200 hover:bg-[#36281d] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-[#201813] disabled:text-white/45"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  <div className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-sm">
                    {galleryImages.map((image, index) => (
                      <span
                        key={image.id}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          index === stepIndex ? "w-7 bg-[#D4AF37]" : "w-1.5 bg-white/25"
                        }`}
                      />
                    ))}
                  </div>

                  <Button
                    type="button"
                    size="icon"
                    onClick={handleAdvance}
                    className="h-11 w-11 rounded-full bg-[#D4AF37] text-[#1d140d] shadow-[0_16px_40px_rgba(0,0,0,0.28)] transition-colors duration-200 hover:bg-[#E2BD49]"
                  >
                    {isLastStep ? (
                      <X className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
