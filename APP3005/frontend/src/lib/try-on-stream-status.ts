interface TryOnStreamStatusPayload {
  error?: string;
  message?: string;
  phase?: string;
  progress?: number;
  status?: string;
  text?: string;
}

const INITIAL_TRY_ON_STREAM_STATUS = "Preparing your virtual try-on";
const COMPLETED_TRY_ON_STREAM_STATUS = "Try-on completed";
const FAILED_TRY_ON_STREAM_STATUS = "Try-on failed";

export function getInitialTryOnStreamStatusMessage(): string {
  return INITIAL_TRY_ON_STREAM_STATUS;
}

export function getCompletedTryOnStreamStatusMessage(): string {
  return COMPLETED_TRY_ON_STREAM_STATUS;
}

export function getTryOnStreamStatusMessage(
  eventName: string,
  payload: TryOnStreamStatusPayload,
): string | null {
  if (eventName === "chunk") {
    return null;
  }

  if (eventName === "error") {
    return payload.error || FAILED_TRY_ON_STREAM_STATUS;
  }

  if (payload.status === "failed") {
    return payload.error || FAILED_TRY_ON_STREAM_STATUS;
  }

  if (
    payload.phase === "completed" ||
    payload.status === "completed" ||
    (typeof payload.progress === "number" && payload.progress >= 100)
  ) {
    return COMPLETED_TRY_ON_STREAM_STATUS;
  }

  if (payload.phase === "postprocessing") {
    return "Finalizing your look";
  }

  if (payload.phase === "fallback") {
    return "Rendering your virtual try-on";
  }

  if (payload.phase === "generating") {
    return typeof payload.progress === "number" && payload.progress >= 40
      ? "Rendering your virtual try-on"
      : "Styling your selected look";
  }

  if (payload.phase === "preprocessing") {
    return "Preparing your look";
  }

  if (payload.phase === "validating") {
    return "Analyzing your photos";
  }

  const progress =
    typeof payload.progress === "number" ? payload.progress : undefined;

  if (progress !== undefined) {
    if (progress >= 85) {
      return "Finalizing your look";
    }

    if (progress >= 40) {
      return "Rendering your virtual try-on";
    }

    if (progress >= 25) {
      return "Styling your selected look";
    }

    if (progress >= 10) {
      return "Preparing your look";
    }
  }

  return INITIAL_TRY_ON_STREAM_STATUS;
}
