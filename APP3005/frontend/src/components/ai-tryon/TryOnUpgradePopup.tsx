import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ShoppingBag, Sparkles, X } from 'lucide-react';
import {
  buildTryOnPackPurchaseUrl,
  TRY_ON_PURCHASE_PLANS,
} from '@/lib/try-on-limit';

interface TryOnUpgradePopupProps {
  isOpen: boolean;
  onClose: () => void;
  tryOnsUsed: number;
  maxTryOns: number;
}

export function TryOnUpgradePopup({
  isOpen,
  onClose,
  tryOnsUsed,
  maxTryOns,
}: TryOnUpgradePopupProps) {
  const remainingTryOns = Math.max(maxTryOns - tryOnsUsed, 0);

  const handlePlanSelect = (planId: string) => {
    const plan = TRY_ON_PURCHASE_PLANS.find((item) => item.id === planId);
    if (!plan) {
      return;
    }

    window.location.href = buildTryOnPackPurchaseUrl(plan);
    onClose();
  };

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
                className="absolute right-4 top-4 z-10 rounded-full bg-white/85 p-2 text-[#6B5D4F] transition hover:bg-white"
                aria-label="Close premium popup"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.32),transparent_72%)]" />

              <div className="relative p-8 md:p-10">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D4AF37] text-white shadow-[0_12px_28px_rgba(212,175,55,0.35)]">
                    <ShoppingBag className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-[#9B7B1E]">
                      Try-On Packs
                    </p>
                    <h2 className="text-2xl font-serif text-[#2C2416] md:text-3xl">
                      Buy More Virtual Try-Ons
                    </h2>
                  </div>
                </div>

                <div className="mb-6 rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_10px_30px_rgba(44,36,22,0.08)]">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <span className="text-xs uppercase tracking-[0.24em] text-[#8B7355]">
                      Current Balance
                    </span>
                    <span className="rounded-full bg-[#F4E7C5] px-3 py-1 text-xs font-semibold text-[#7A5C13]">
                      {remainingTryOns} / {maxTryOns} left
                    </span>
                  </div>
                  <p className="text-sm leading-7 text-[#4F4334] md:text-[15px]">
                    Your complimentary plan includes {maxTryOns} free try-ons. Choose a pack below
                    whenever you want more looks and more angle generations.
                  </p>
                </div>

                <div className="mb-6 grid gap-3 text-sm text-[#3E3428]">
                  <div className="flex items-center gap-3 rounded-2xl bg-white/65 px-4 py-3">
                    <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                    <span>Top up instantly once your complimentary balance is over</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-white/65 px-4 py-3">
                    <CheckCircle2 className="h-4 w-4 text-[#D4AF37]" />
                    <span>Use the same packs for additional angle generations too</span>
                  </div>
                </div>

                <div className="mb-8 grid gap-4">
                  {TRY_ON_PURCHASE_PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      className="rounded-[26px] border border-[#D4AF37]/20 bg-white/80 p-5 shadow-[0_12px_28px_rgba(44,36,22,0.08)]"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-serif text-[#2C2416]">
                              {plan.name}
                            </h3>
                            {plan.badge && (
                              <span className="rounded-full bg-[#F4E7C5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A6936]">
                                {plan.badge}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[#5C4C38]">
                            {plan.description}
                          </p>
                        </div>

                        <div className="flex flex-col gap-3 md:items-end">
                          <div className="text-left md:text-right">
                            <p className="text-3xl font-serif text-[#2C2416]">
                              ₹{plan.priceInr}
                            </p>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B7355]">
                              {plan.tryOns} Virtual Try-Ons
                            </p>
                          </div>
                          <button
                            onClick={() => handlePlanSelect(plan.id)}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2C2416] px-5 py-3 text-sm font-semibold tracking-[0.08em] text-white transition hover:bg-[#1F1A11]"
                          >
                            Buy Pack
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={onClose}
                    className="w-full rounded-2xl border border-[#D4C5A9] bg-white/80 px-5 py-4 text-sm font-medium text-[#5C4C38] transition hover:bg-white"
                  >
                    Close
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
