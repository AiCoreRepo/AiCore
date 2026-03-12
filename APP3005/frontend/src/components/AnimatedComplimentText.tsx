import { useEffect, useState } from "react";

interface AnimatedComplimentTextProps {
  text: string;
  className?: string;
  caretClassName?: string;
  speedMs?: number;
  startDelayMs?: number;
  mode?: "typing" | "fade";
}

export function AnimatedComplimentText({
  text,
  className = "",
  caretClassName = "",
  speedMs = 26,
  startDelayMs = 120,
  mode = "typing",
}: AnimatedComplimentTextProps) {
  const characters = Array.from(text);
  const [visibleChars, setVisibleChars] = useState(
    mode === "fade" ? characters.length : 0
  );
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!text) {
      setVisibleChars(0);
      setIsVisible(false);
      return;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setVisibleChars(characters.length);
      setIsVisible(true);
      return;
    }

    let startTimer: number | null = null;
    let typingTimer: number | null = null;

    setVisibleChars(0);
    setIsVisible(false);

    startTimer = window.setTimeout(() => {
      setIsVisible(true);

      if (mode === "fade") {
        setVisibleChars(characters.length);
        return;
      }

      let nextChars = 0;
      typingTimer = window.setInterval(() => {
        nextChars += 1;
        setVisibleChars(nextChars);

        if (nextChars >= characters.length && typingTimer) {
          window.clearInterval(typingTimer);
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
  }, [characters.length, mode, speedMs, startDelayMs, text]);

  const displayText =
    mode === "fade" ? text : characters.slice(0, visibleChars).join("");
  const showCaret =
    mode === "typing" && isVisible && visibleChars < characters.length;

  return (
    <div className="relative">
      <span aria-hidden="true" className={`invisible block ${className}`}>
        {text}
      </span>
      <span
        className={`absolute inset-0 block transition-all duration-500 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        } ${className}`}
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
