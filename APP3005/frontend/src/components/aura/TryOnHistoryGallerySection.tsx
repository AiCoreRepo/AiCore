import { Download, Images, Loader2, RefreshCw, X, ZoomIn } from "lucide-react";
import { useMemo, useState } from "react";

export interface TryOnHistoryItem {
  tryOnId: string;
  productId: string;
  productTitle: string;
  productImage: string | null;
  resultImage: string;
  provider: string;
  createdAt: string;
}

interface TryOnHistoryGallerySectionProps {
  tryOns: TryOnHistoryItem[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

function optimizeCloudinaryUrl(url: string, width = 720): string {
  if (!url || !url.includes("cloudinary.com")) {
    return url;
  }

  return url.replace(
    /\/upload\/(?:v\d+\/)?/,
    `/upload/f_webp,q_auto,w_${width},c_limit/`,
  );
}

function GalleryImage({
  src,
  alt,
  onClick,
}: {
  src: string;
  alt: string;
  onClick?: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const optimizedSrc = useMemo(() => optimizeCloudinaryUrl(src), [src]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative block h-full w-full overflow-hidden rounded-[24px] bg-[#F3EDE2] text-left"
    >
      {!loaded && !failed && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#F7F2E8] to-[#E9DEC9]">
          <Loader2 className="h-8 w-8 animate-spin text-[#B5944C]" />
        </div>
      )}

      {failed && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#EFE7DA] px-6 text-center text-sm font-medium text-[#7A6A56]">
          Failed to load image
        </div>
      )}

      <img
        src={optimizedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`h-full w-full object-contain transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/35">
        <div className="rounded-full bg-white/90 p-3 opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100">
          <ZoomIn className="h-5 w-5 text-[#2C2416]" />
        </div>
      </div>
    </button>
  );
}

function formatProviderLabel(provider: string) {
  const normalized = String(provider || "unknown").replace(/[_-]+/g, " ");
  const lower = normalized.toLowerCase();

  if (
    lower === "unknown" ||
    lower.includes("gemini") ||
    lower.includes("vertex")
  ) {
    return "Virtual Try-On";
  }

  return "Saved Look";
}

function formatTryOnDate(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "Saved recently";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function TryOnHistoryGallerySection({
  tryOns,
  loading,
  error,
  onRetry,
}: TryOnHistoryGallerySectionProps) {
  const [selectedTryOn, setSelectedTryOn] = useState<TryOnHistoryItem | null>(
    null,
  );

  const handleDownload = (imageUrl: string, label: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${label.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <section className="overflow-hidden rounded-[32px] border border-[rgba(201,165,95,0.22)] bg-[rgba(255,255,255,0.68)] shadow-[0_20px_48px_rgba(201,165,95,0.12)] backdrop-blur-xl">
        <div className="border-b border-[rgba(201,165,95,0.15)] px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8A6936]">
                Collection + AI Try-On
              </p>
              <div className="mt-2 flex items-center gap-3">
                <Images className="h-5 w-5 text-[#B5944C]" />
                <h3 className="font-serif text-2xl text-[#2C2416]">
                  Try-On Gallery
                </h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#6B5D4F]">
                Every look you generate from Collection or AI Try-On lands
                here, including extra generated angles, so your full try-on
                history stays in one place.
              </p>
            </div>

            <div className="inline-flex items-center rounded-full border border-[rgba(201,165,95,0.25)] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6936]">
              {tryOns.length} looks saved
            </div>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-7 sm:py-7">
          {loading ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-[rgba(201,165,95,0.25)] bg-[#FCFAF5] text-center">
              <Loader2 className="h-10 w-10 animate-spin text-[#B5944C]" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8A6936]">
                  Loading your gallery
                </p>
                <p className="mt-2 text-sm text-[#6B5D4F]">
                  Pulling your saved try-ons into profile.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-[rgba(176,65,62,0.25)] bg-[#FFF8F7] px-6 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B0413E]">
                Gallery unavailable
              </p>
              <p className="max-w-md text-sm leading-6 text-[#7A6A56]">{error}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,95,0.3)] bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6936] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
              )}
            </div>
          ) : tryOns.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-[rgba(201,165,95,0.25)] bg-[#FCFAF5] px-6 text-center">
              <Images className="h-10 w-10 text-[#B5944C]" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8A6936]">
                  No try-ons yet
                </p>
                <p className="mt-2 max-w-md text-sm leading-6 text-[#6B5D4F]">
                  Start from Collection or AI Try-On, and your generated looks
                  plus any additional angle generations will appear here
                  automatically.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {tryOns.map((tryOn, index) => (
                <article
                  key={tryOn.tryOnId}
                  className="overflow-hidden rounded-[28px] border border-[rgba(201,165,95,0.16)] bg-white/90 shadow-[0_14px_34px_rgba(44,36,22,0.06)]"
                >
                  <div className="relative aspect-[2/3] overflow-hidden bg-[#F7F2E8] p-3">
                    <GalleryImage
                      src={tryOn.resultImage}
                      alt={`${tryOn.productTitle} try-on`}
                      onClick={() => setSelectedTryOn(tryOn)}
                    />
                  </div>

                  <div className="space-y-4 px-4 pb-4 pt-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6936]">
                          Look #{tryOns.length - index}
                        </p>
                        <h4 className="mt-1 line-clamp-2 text-base font-semibold text-[#2C2416]">
                          {tryOn.productTitle}
                        </h4>
                      </div>
                      <span className="shrink-0 rounded-full border border-[rgba(201,165,95,0.2)] bg-[#F8F4EC] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B5944C]">
                        {formatProviderLabel(tryOn.provider)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-xs text-[#7A6A56]">
                      <span>{formatTryOnDate(tryOn.createdAt)}</span>
                      {tryOn.productImage ? (
                        <span className="rounded-full bg-[#F7F2E8] px-2.5 py-1 font-medium text-[#8A6936]">
                          Linked product
                        </span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleDownload(
                          tryOn.resultImage,
                          tryOn.productTitle || `try-on-${index + 1}`,
                        )
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedTryOn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          onClick={() => setSelectedTryOn(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-[32px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedTryOn(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-[#2C2416] shadow-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="bg-[#F6EFE2] p-4 sm:p-6">
                <div className="overflow-hidden rounded-[24px] bg-white">
                  <img
                    src={selectedTryOn.resultImage}
                    alt={selectedTryOn.productTitle}
                    className="max-h-[78vh] w-full object-contain"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between gap-6 bg-white px-5 py-6 sm:px-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A6936]">
                    Saved Try-On
                  </p>
                  <h4 className="mt-2 font-serif text-2xl text-[#2C2416]">
                    {selectedTryOn.productTitle}
                  </h4>
                  <div className="mt-4 space-y-3 text-sm text-[#6B5D4F]">
                    <p>
                      <span className="font-semibold text-[#2C2416]">Date:</span>{" "}
                      {formatTryOnDate(selectedTryOn.createdAt)}
                    </p>
                    <p>
                      <span className="font-semibold text-[#2C2416]">
                        Provider:
                      </span>{" "}
                      {formatProviderLabel(selectedTryOn.provider)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleDownload(
                      selectedTryOn.resultImage,
                      selectedTryOn.productTitle || "try-on",
                    )
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
