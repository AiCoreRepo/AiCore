import { useCallback, useEffect, useState } from "react";
import { Images, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TryOnHistoryGallerySection, type TryOnHistoryItem } from "@/components/aura/TryOnHistoryGallerySection";
import { UserDashboardLayout } from "@/components/layout/UserDashboardLayout";
import { getTryOnHistory } from "@/lib/api";

const MyGalleryPage = () => {
  const navigate = useNavigate();
  const [tryOnHistory, setTryOnHistory] = useState<TryOnHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTryOnGallery = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTryOnHistory();
      setTryOnHistory(Array.isArray(response?.tryOns) ? response.tryOns : []);
    } catch (err: any) {
      const message =
        err?.message || "Failed to load your try-on gallery.";
      setError(message);
      if (message.toLowerCase().includes("login")) {
        navigate("/user-login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchTryOnGallery();
  }, [fetchTryOnGallery]);

  return (
    <UserDashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#FAF8F3] to-[#F5F3EE]">
        <div className="border-b border-[#E0E0D8] bg-white/95 shadow-sm backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8A6936]">
              <Sparkles className="h-3.5 w-3.5" />
              Virtual Try-On Archive
            </div>

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3">
                  <Images className="h-6 w-6 text-[#B5944C]" />
                  <h1
                    className="text-3xl font-bold text-[#2C2416]"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    My Gallery
                  </h1>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#6B6B6B] md:text-[15px]">
                  All your saved try-on looks in one place, including any extra
                  generated angles created after the original try-on.
                </p>
              </div>

              <div className="inline-flex items-center rounded-full border border-[#D4AF37]/25 bg-[#FCF8EF] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6936]">
                Unified gallery
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <TryOnHistoryGallerySection
            tryOns={tryOnHistory}
            loading={loading}
            error={error}
            onRetry={fetchTryOnGallery}
          />
        </div>
      </div>
    </UserDashboardLayout>
  );
};

export default MyGalleryPage;
