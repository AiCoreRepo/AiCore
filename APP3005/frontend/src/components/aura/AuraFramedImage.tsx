import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuraFramedImageProps {
  src: string;
  alt: string;
  className?: string;
  foregroundClassName?: string;
  backgroundClassName?: string;
  loading?: "eager" | "lazy";
  children?: ReactNode;
}

export function AuraFramedImage({
  src,
  alt,
  className,
  foregroundClassName,
  backgroundClassName,
  loading = "lazy",
  children,
}: AuraFramedImageProps) {
  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading={loading}
        decoding="async"
        className={cn(
          "pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-35",
          backgroundClassName,
        )}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.65),rgba(255,255,255,0)_38%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(245,237,221,0.28))]"
      />
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        className={cn(
          "relative z-[1] block h-full w-full object-contain object-center",
          foregroundClassName,
        )}
      />
      {children}
    </div>
  );
}
