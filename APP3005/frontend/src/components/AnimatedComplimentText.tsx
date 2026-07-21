import { useEffect, useRef, useState } from "react";

interface AnimatedComplimentTextProps {
  text: string;
  className?: string;
  caretClassName?: string;
  speedMs?: number;
  startDelayMs?: number;
  mode?: "typing" | "fade";
  unit?: "character" | "word";
  onComplete?: () => void;
}

export function AnimatedComplimentText({
  text,
  className = "",
  caretClassName = "",
  speedMs = 26,
  startDelayMs = 120,
  mode = "typing",
  unit = "word",
  onComplete,
}: AnimatedComplimentTextProps) {
  const getSegments = (value: string) =>
    unit === "word" ? value.match(/\S+\s*/g) ?? [] : Array.from(value);

  const segments = mode === "fade" ? [text] : getSegments(text);
  const [visibleSegments, setVisibleSegments] = useState(
    mode === "fade" ? segments.length : 0
  );
  const [isVisible, setIsVisible] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const hasNotifiedCompletionRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const nextSegments = mode === "fade" ? [text] : getSegments(text);
    const notifyComplete = () => {
      if (hasNotifiedCompletionRef.current) {
        return;
      }

      hasNotifiedCompletionRef.current = true;
      onCompleteRef.current?.();
    };

    hasNotifiedCompletionRef.current = false;

    if (!text) {
      setVisibleSegments(0);
      setIsVisible(false);
      return;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setVisibleSegments(nextSegments.length);
      setIsVisible(true);
      notifyComplete();
      return;
    }

    let startTimer: number | null = null;
    let typingTimer: number | null = null;

    setVisibleSegments(0);
    setIsVisible(false);

    startTimer = window.setTimeout(() => {
      setIsVisible(true);

      if (mode === "fade") {
        setVisibleSegments(nextSegments.length);
        notifyComplete();
        return;
      }

      let nextVisibleSegments = 0;
      typingTimer = window.setInterval(() => {
        nextVisibleSegments += 1;
        setVisibleSegments(nextVisibleSegments);

        if (nextVisibleSegments >= nextSegments.length && typingTimer) {
          window.clearInterval(typingTimer);
          notifyComplete();
        }
      }, speedMs);
    }, startDelayMs);

    return () => {
      if (startTimer) {
        window.clearTimeout(startTimer);
      }
      if (typingTimer) {
        window.clearInterval(typingTimer);
      }
    };
  }, [mode, speedMs, startDelayMs, text, unit]);

  const displayText =
    mode === "fade" ? text : segments.slice(0, visibleSegments).join("");
  const showCaret =
    mode === "typing" && isVisible && visibleSegments < segments.length;

  return (
    <div className="relative min-w-0 max-w-full overflow-visible">
      <span
        aria-hidden="true"
        className={`invisible block min-w-0 max-w-full break-words whitespace-pre-wrap ${className}`}
        style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
      >
        {text}
      </span>
      <span
        className={`absolute inset-0 block min-w-0 max-w-full break-words whitespace-pre-wrap transition-all duration-500 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        } ${className}`}
        style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
      >
        {displayText}
        {showCaret ? (
          <span className={`ml-0.5 inline-block animate-pulse ${caretClassName}`}>
            |
          </span>
        ) : null}
      </span>
    </div>
  );
}
