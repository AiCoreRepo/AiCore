import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, MessageSquareText, Star, X } from "lucide-react";
import { FeedbackContextType, submitFeedback } from "@/lib/api";

interface FeedbackContext {
  type: FeedbackContextType;
  referenceId?: string;
  label?: string;
}

interface FeedbackBottomSheetProps {
  isOpen: boolean;
  context: FeedbackContext;
  onClose: () => void;
  onSubmitted?: () => void;
}

const labels: Record<FeedbackContextType, string> = {
  AVATAR_CREATION: "Avatar Creation",
  AVATAR_RECREATION: "Avatar Recreation",
  VIRTUAL_TRYON: "Virtual Try-On",
};

export const FeedbackBottomSheet = ({
  isOpen,
  context,
  onClose,
  onSubmitted,
}: FeedbackBottomSheetProps) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAvatarFeedback =
    context.type === "AVATAR_CREATION" || context.type === "AVATAR_RECREATION";
  const isLowAvatarRating = isAvatarFeedback && rating > 0 && rating <= 2;
  const requiresComment = rating > 0 && rating <= 3;
  const canSubmit = rating > 0 && (!requiresComment || comment.trim().length >= 4);

  const contextLabel = useMemo(
    () => context.label || labels[context.type],
    [context.label, context.type],
  );

  useEffect(() => {
    if (!isOpen) return;
    setRating(0);
    setComment("");
    setError("");
    setIsSubmitting(false);
    setSubmitted(false);

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const submit = async () => {
    if (!canSubmit || isSubmitting) {
      if (requiresComment && !comment.trim()) {
        setError("Please add a comment for 3 stars or below.");
      }
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await submitFeedback({
        context_type: context.type,
        context_reference_id: context.referenceId,
        context_label: contextLabel,
        rating,
        comment: comment.trim() || undefined,
      });
      onSubmitted?.();
      setSubmitted(true);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      closeTimerRef.current = setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const helperMessage = isLowAvatarRating
    ? "Sorry for that. We continuously work to improve our model."
    : "Share your experience. 3 stars or below always asks for a short note.";

  const submittedMessage = isLowAvatarRating
    ? "We are sorry."
    : "Thanks for your feedback. We are continuously improving to make your experience better.";

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-[min(92vw,380px)] rounded-2xl border border-[#D4B76E]/40 bg-white/95 p-4 shadow-2xl backdrop-blur"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,243,235,0.98))",
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-[#D4AF37]/15 p-1.5">
            <MessageSquareText className="h-4 w-4 text-[#8A6B2B]" />
          </div>
          <div>
            <p className="text-xs tracking-[0.06em] text-[#8D755B] uppercase">
              Feedback
            </p>
            <p className="text-sm font-semibold text-[#2C2416]">{contextLabel}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 text-[#9B8770] transition hover:bg-[#F2E6CF]/80"
          aria-label="Close feedback"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-3 text-xs text-[#8D755B]">{helperMessage}</p>

      {submitted && (
        <p className="mb-3 rounded-lg bg-[#ECF7E8] px-3 py-2 text-xs leading-relaxed text-[#2F6B3A]">
          {submittedMessage}
        </p>
      )}

      <div className={`mb-2 flex items-center gap-1.5 ${submitted ? "opacity-40" : ""}`}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            className={`rounded-full p-1 transition ${submitted ? "pointer-events-none" : ""} ${value <= rating ? "text-[#D4AF37]" : "text-[#CAB08A]/50"} hover:text-[#D4AF37]`}
            aria-label={`Rate ${value} stars`}
            disabled={submitted}
          >
            <Star className="h-6 w-6 fill-current" />
          </button>
        ))}
      </div>

      <label className="mb-1 block text-xs font-medium text-[#4A3F2E]">
        Comment {requiresComment ? "(required)" : "(optional)"}
      </label>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={3}
        disabled={submitted}
        className="w-full resize-none rounded-xl border border-[#D4B76E]/50 bg-white px-3 py-2 text-sm outline-none placeholder:text-[#B7A07D] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/35"
        placeholder={requiresComment ? "Tell us what can be better..." : "Anything we can improve?"}
      />

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={submitted || !canSubmit || isSubmitting}
        className="mt-3 w-full rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-[#2B2015] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit Feedback"}
      </button>
    </div>
  );
};
