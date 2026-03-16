import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface ImageCompareSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export function ImageCompareSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Original Try-On",
  afterLabel = "New Angle",
  className = "",
}: ImageCompareSliderProps) {
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSplitPosition(50);
  }, [beforeImage, afterImage]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const updateFromClientX = (clientX: number) => {
      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds) {
        return;
      }

      const next = ((clientX - bounds.left) / bounds.width) * 100;
      setSplitPosition(Math.max(0, Math.min(100, next)));
    };

    const handlePointerMove = (event: PointerEvent) => {
      updateFromClientX(event.clientX);
    };

    const stopDragging = () => {
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [isDragging]);

  const updateFromPointer = (clientX: number) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) {
      return;
    }

    const next = ((clientX - bounds.left) / bounds.width) * 100;
    setSplitPosition(Math.max(0, Math.min(100, next)));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    updateFromPointer(event.clientX);
    setIsDragging(true);
  };

  return (
    <div className={`flex h-full w-full flex-col ${className}`}>
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden rounded-[26px] border border-white/70 bg-[linear-gradient(135deg,#f5f0e7_0%,#e8e1d7_100%)]"
        style={{
          boxShadow: "0 18px 40px rgba(28, 21, 14, 0.12)",
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="absolute inset-0 h-full w-full object-contain select-none"
          draggable={false}
        />

        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            clipPath: `inset(0 ${100 - splitPosition}% 0 0)`,
          }}
        >
          <img
            src={afterImage}
            alt={afterLabel}
            className="absolute inset-0 h-full w-full object-contain select-none"
            draggable={false}
          />
        </div>

        <div className="pointer-events-none absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
          <span className="rounded-full bg-[rgba(33,27,20,0.72)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur">
            {beforeLabel}
          </span>
          <span className="rounded-full bg-[rgba(212,175,55,0.92)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2f2416] shadow-[0_8px_18px_rgba(212,175,55,0.24)]">
            {afterLabel}
          </span>
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 z-10"
          style={{ left: `calc(${splitPosition}% - 1px)` }}
        >
          <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(44,36,22,0.18)]" />
          <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-[rgba(255,255,255,0.95)] shadow-[0_16px_26px_rgba(28,21,14,0.18)]">
            <MoveHorizontal className="h-5 w-5 text-[#7f6031]" />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-[rgba(138,105,54,0.12)] bg-white/90 px-4 py-4 shadow-[0_10px_24px_rgba(28,21,14,0.08)] backdrop-blur">
        <div className="mb-3 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a6936]">
          <span>{beforeLabel}</span>
          <span>{afterLabel}</span>
        </div>

        <Slider
          value={[splitPosition]}
          min={0}
          max={100}
          step={1}
          onValueChange={(values) => setSplitPosition(values[0] ?? 50)}
          aria-label="Compare try-on images"
        />

        <p className="mt-3 text-center text-xs leading-5 text-[#6e5840]">
          Slide to compare the original try-on with the newly generated angle.
        </p>
      </div>
    </div>
  );
}
