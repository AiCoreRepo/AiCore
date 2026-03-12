import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Crown, Sparkles, X } from 'lucide-react';

interface TryOnUpgradePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  tryOnsUsed: number;
  maxTryOns: number;
}

export function TryOnUpgradePopup({
  isOpen,
  onClose,
  onUpgrade,
  tryOnsUsed,
  maxTryOns,
}: TryOnUpgradePopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-[#2C2416]/70 backdrop-blur-sm"
          />

          <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-[#D4AF37]/25 bg-[linear-gradient(145deg,#FFFDF8_0%,#F8F1E4_55%,#F4E4BC_100%)] shadow-[0_30px_80px_rgba(44,36,22,0.28)]"
            >
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full bg-white/85 p-2 text-[#6B5D4F] transition hover:bg-white"
                aria-label="Close premium popup"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.32),transparent_72%)]" />

              <div className="relative p-8 md:p-10">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D4AF37] text-white shadow-[0_12px_28px_rgba(212,175,55,0.35)]">
                    <Crown className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-[#9B7B1E]">
                      Premium Unlock
                    </p>
                    <h2 className="text-2xl font-serif text-[#2C2416] md:text-3xl">
                      More Virtual Try-Ons
                    </h2>
                  </div>
                </div>

                <div className="mb-6 rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_10px_30px_rgba(44,36,22,0.08)]">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <span className="text-xs uppercase tracking-[0.24em] text-[#8B7355]">
                      Free Plan Usage
                    </span>
                    <span className="rounded-full bg-[#F4E7C5] px-3 py-1 text-xs font-semibold text-[#7A5C13]">
                      {tryOnsUsed} / {maxTryOns} used
                    </span>
                  </div>
                  <p className="text-sm leading-7 text-[#4F4334] md:text-[15px]">
                    You have used all {maxTryOns} included try-ons. Upgrade to Premium to unlock
                    more virtual try-ons and extra angle generations.
                  </p>
                </div>

                <div className="mb-8 grid gap-3 text-sm text-[#3E3428]">
                  <div className="flex items-center gap-3 rounded-2xl bg-white/65 px-4 py-3">
                    <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                    <span>Continue trying more outfits without the free cap</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-white/65 px-4 py-3">
                    <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                    <span>Unlock more angle generations from the same flow</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={onUpgrade}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#2C2416] px-5 py-4 text-sm font-semibold tracking-[0.08em] text-white transition hover:bg-[#1F1A11]"
                  >
                    Upgrade to Premium
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={onClose}
                    className="rounded-2xl border border-[#D4C5A9] bg-white/80 px-5 py-4 text-sm font-medium text-[#5C4C38] transition hover:bg-white"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
