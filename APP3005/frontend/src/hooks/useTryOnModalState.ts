import { useCallback, useState } from "react";
import type { StreamEventHandler } from "@/lib/api";
import { normalizeTryOnImageData } from "@/lib/try-on-image";
import {
  getCompletedTryOnStreamStatusMessage,
  getInitialTryOnStreamStatusMessage,
  getTryOnStreamStatusMessage,
} from "@/lib/try-on-stream-status";

const DEFAULT_INITIAL_STATUS = getInitialTryOnStreamStatusMessage();
const DEFAULT_INITIAL_PROGRESS = 6;
const STREAM_PROGRESS_CAP = 95;
const PREVIEW_PROGRESS_FLOOR = 78;
const PREVIEW_PROGRESS_CAP = 90;

function requireTryOnImage(
  resultImage: string | null | undefined,
  errorMessage: string,
): string {
  const imageData = normalizeTryOnImageData(resultImage);
  if (!imageData) {
    throw new Error(errorMessage);
  }

  return imageData;
}

export function useTryOnModalState() {
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [streamPreviewImage, setStreamPreviewImage] = useState<string | null>(
    null,
  );
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [tryOnStreamStatus, setTryOnStreamStatus] = useState<string | null>(
    null,
  );
  const [tryOnStreamProgress, setTryOnStreamProgress] = useState(0);
  const [tryOnError, setTryOnError] = useState<string | null>(null);
  const [generatingAngles, setGeneratingAngles] = useState(false);
  const [originalTryOnImage, setOriginalTryOnImage] = useState<string | null>(
    null,
  );
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const startTryOnSession = useCallback(
    (initialStatus = DEFAULT_INITIAL_STATUS) => {
      setTryOnLoading(true);
      setResultImage(null);
      setStreamPreviewImage(null);
      setOriginalTryOnImage(null);
      setGeneratedImages([]);
      setTryOnStreamStatus(initialStatus);
      setTryOnStreamProgress(DEFAULT_INITIAL_PROGRESS);
      setTryOnError(null);
      setShowResultModal(true);
    },
    [],
  );

  const handleGeminiStreamEvent = useCallback<StreamEventHandler>(
    (eventName, payload) => {
      if (!payload || typeof payload !== "object") {
        return;
      }

      const streamPayload = payload as {
        error?: string;
        message?: string;
        phase?: string;
        text?: string;
        progress?: number;
        resultImage?: string;
        status?: string;
      };

      if (eventName === "status") {
        const nextStatus = getTryOnStreamStatusMessage(eventName, streamPayload);
        if (nextStatus) {
          setTryOnStreamStatus(nextStatus);
        }
        if (typeof streamPayload.progress === "number") {
          setTryOnStreamProgress((prev) =>
            Math.max(prev, Math.min(streamPayload.progress, STREAM_PROGRESS_CAP)),
          );
        }
        return;
      }

      if (eventName === "chunk") {
        return;
      }

      if (eventName === "preview") {
        const nextPreviewImage = normalizeTryOnImageData(
          streamPayload.resultImage,
        );
        if (nextPreviewImage) {
          setStreamPreviewImage(nextPreviewImage);
          setTryOnStreamProgress((prev) =>
            Math.max(
              prev,
              Math.min(streamPayload.progress ?? PREVIEW_PROGRESS_FLOOR, PREVIEW_PROGRESS_CAP),
            ),
          );
        }
      }
    },
    [],
  );

  const applyPrimaryResult = useCallback((nextResultImage: string) => {
    const imageData = requireTryOnImage(
      nextResultImage,
      "Try-on completed without a valid image payload",
    );

    setResultImage(imageData);
    setOriginalTryOnImage(imageData);
    setGeneratedImages([imageData]);
    setTryOnStreamProgress(100);
    setTryOnStreamStatus(getCompletedTryOnStreamStatusMessage());

    return imageData;
  }, []);

  const appendAngleResult = useCallback((nextResultImage: string) => {
    const imageData = requireTryOnImage(
      nextResultImage,
      "Angle generation completed without a valid image payload",
    );

    setResultImage(imageData);
    setGeneratedImages((prev) => [...prev, imageData]);

    return imageData;
  }, []);

  const finishTryOnSession = useCallback(() => {
    setTryOnLoading(false);
    setStreamPreviewImage(null);
    setTryOnStreamProgress(0);
    setTryOnStreamStatus(null);
  }, []);

  const hideResultModal = useCallback(() => {
    setShowResultModal(false);
    setStreamPreviewImage(null);
  }, []);

  const resetResultModal = useCallback(() => {
    setShowResultModal(false);
    setResultImage(null);
    setStreamPreviewImage(null);
    setOriginalTryOnImage(null);
    setGeneratedImages([]);
    setTryOnError(null);
  }, []);

  return {
    showResultModal,
    resultImage,
    streamPreviewImage,
    tryOnLoading,
    tryOnStreamStatus,
    tryOnStreamProgress,
    tryOnError,
    generatingAngles,
    originalTryOnImage,
    generatedImages,
    setResultImage,
    setTryOnError,
    setGeneratingAngles,
    startTryOnSession,
    handleGeminiStreamEvent,
    applyPrimaryResult,
    appendAngleResult,
    finishTryOnSession,
    hideResultModal,
    resetResultModal,
  };
}
