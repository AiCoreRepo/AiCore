type AuraStreamMode = "creation" | "recreation";

interface AuraStreamStatusPayload {
  progress?: number;
  status?: string;
  error?: string;
  message?: string;
}

export function getInitialAuraStreamStatusMessage(mode: AuraStreamMode): string {
  return mode === "creation"
    ? "Uploading and validating your photo"
    : "Uploading and validating your avatar input";
}

export function getCompletedAuraStreamStatusMessage(
  mode: AuraStreamMode,
): string {
  return mode === "creation"
    ? "Aura generation completed"
    : "Aura recreation completed";
}

export function getAuraStreamStatusMessage(
  mode: AuraStreamMode,
  eventName: string,
  payload: AuraStreamStatusPayload,
): string | null {
  const failureMessage =
    payload.error ||
    (mode === "creation"
      ? "Aura generation failed"
      : "Aura recreation failed");

  if (eventName === "error") {
    return failureMessage;
  }

  if (payload.status === "failed" || payload.status === "not_found") {
    return failureMessage;
  }

  if (
    payload.status === "waiting" ||
    payload.status === "paused" ||
    payload.status === "delayed"
  ) {
    return mode === "creation"
      ? "Queued for avatar generation"
      : "Queued for Aura recreation";
  }

  if (
    payload.status === "completed" ||
    (typeof payload.progress === "number" && payload.progress >= 100)
  ) {
    return getCompletedAuraStreamStatusMessage(mode);
  }

  const progress =
    typeof payload.progress === "number" ? payload.progress : undefined;

  if (progress !== undefined) {
    if (progress >= 85) {
      return mode === "creation"
        ? "Finalizing your Aura"
        : "Finalizing your Aura recreation";
    }

    if (progress >= 35) {
      return mode === "creation"
        ? "Generating your Aura"
        : "Recreating your Aura";
    }

    if (progress >= 15) {
      return mode === "creation"
        ? "Sending your photo to AI"
        : "Sending your avatar input to AI";
    }
  }

  if (payload.status === "active") {
    return mode === "creation"
      ? "Generating your Aura"
      : "Recreating your Aura";
  }

  if (eventName === "accepted") {
    return mode === "creation"
      ? "Queued for avatar generation"
      : "Queued for Aura recreation";
  }

  return getInitialAuraStreamStatusMessage(mode);
}
