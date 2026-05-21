import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface LightboxImage {
  url: string;
  label?: string;
}

/** Prefer larger Cloudinary delivery when possible */
export function inventoryImageUrl(url: string): string {
  if (!url) return url;
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    if (url.includes('/upload/q_') || url.includes('/upload/w_')) return url;
    return url.replace('/upload/', '/upload/q_auto:good,f_auto,w_1400,c_limit/');
  }
  return url;
}

interface InventoryImageLightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  onClose: () => void;
}

/** Centered fullscreen modal (portaled) — not inside the sidebar */
export function InventoryImageLightbox({
  images,
  initialIndex = 0,
  onClose,
}: InventoryImageLightboxProps) {
  const [index, setIndex] = React.useState(initialIndex);

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose, goPrev, goNext]);

  if (!images.length) return null;

  const current = images[index];
  const src = inventoryImageUrl(current.url);

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[150] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label="Product image preview"
      onClick={onClose}
    >
      <div
        className="shrink-0 flex items-center justify-between gap-4 px-4 py-3 bg-neutral-950 border-b border-[#D4AF37]/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          {current.label && (
            <p className="text-base font-bold text-white truncate">{current.label}</p>
          )}
          {images.length > 1 && (
            <p className="text-sm text-neutral-400">
              Image {index + 1} of {images.length}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D4AF37] text-neutral-950 font-bold text-sm shadow-lg hover:bg-[#F4D03F] transition-colors border-2 border-[#B8860B]"
          aria-label="Close image and go back"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
          Back
        </button>
      </div>

      <div
        className="flex-1 flex items-center justify-center relative min-h-0 p-4 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-3 sm:left-6 z-10 p-3 rounded-full bg-neutral-800 border border-white/20 text-white hover:bg-neutral-700"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        <img
          src={src}
          alt={current.label ?? 'Product'}
          className="max-w-[92vw] max-h-[78vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
          style={{ imageRendering: 'auto' }}
          draggable={false}
        />

        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-3 sm:right-6 z-10 p-3 rounded-full bg-neutral-800 border border-white/20 text-white hover:bg-neutral-700"
            aria-label="Next image"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div
          className="shrink-0 px-4 py-3 bg-neutral-950 border-t border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-2 overflow-x-auto justify-center pb-1">
            {images.map((img, i) => (
              <button
                key={`${img.url}-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  i === index
                    ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50'
                    : 'border-white/25 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={inventoryImageUrl(img.url)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
