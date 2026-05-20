import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, X } from 'lucide-react';
import {
  buildTryOnPurchaseReturnPath,
  buildTryOnPackPurchaseUrl,
  TRY_ON_PURCHASE_CONTACT_EMAIL,
  TRY_ON_PURCHASE_PLANS,
} from '@/lib/try-on-limit';
import {
  getTryOnPackPurchaseHistory,
  initiateTryOnPackPurchase,
  type TryOnPackPurchaseHistoryItem,
} from '@/lib/api';
import { usePayU } from '@/hooks/usePayU';
import { useToast } from '@/hooks/use-toast';
import { isUatOrLocalTryOnHost } from '@/lib/try-on-environment';

interface TryOnUpgradePopupProps {
  isOpen: boolean;
  onClose: () => void;
  tryOnsUsed: number;
  maxTryOns: number;
}

const formatCurrency = (value: number) => `₹${value}`;

const PRIORITIZED_TRY_ON_PLANS = [
  ...TRY_ON_PURCHASE_PLANS.filter((plan) => plan.id === 'studio'),
  ...TRY_ON_PURCHASE_PLANS.filter((plan) => plan.id !== 'studio'),
];

const DEFAULT_PLAN_ID =
  PRIORITIZED_TRY_ON_PLANS[0]?.id ?? TRY_ON_PURCHASE_PLANS[0].id;

const historyDateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function formatHistoryAmount(amountPaise: number) {
  return `₹${Math.round(amountPaise / 100)}`;
}

function formatHistoryDate(value?: string | null) {
  if (!value) {
    return 'Pending';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Pending';
  }

  return historyDateFormatter.format(parsed);
}

function getHistoryStatusTone(status: TryOnPackPurchaseHistoryItem['status']) {
  switch (status) {
    case 'CAPTURED':
      return 'bg-emerald-50 text-emerald-700';
    case 'FAILED':
      return 'bg-rose-50 text-rose-700';
    case 'CANCELLED':
      return 'bg-stone-100 text-stone-700';
    default:
      return 'bg-amber-50 text-amber-700';
  }
}

export function TryOnUpgradePopup({
  isOpen,
  onClose,
  tryOnsUsed,
  maxTryOns,
}: TryOnUpgradePopupProps) {
  const { toast } = useToast();
  const { redirectToPayU } = usePayU();
  const [selectedPlanId, setSelectedPlanId] = useState<string>(DEFAULT_PLAN_ID);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<
    TryOnPackPurchaseHistoryItem[]
  >([]);
  const isTestMode = isUatOrLocalTryOnHost();
  const remainingTryOns = Math.max(maxTryOns - tryOnsUsed, 0);

  const selectedPlan = TRY_ON_PURCHASE_PLANS.find(
    (plan) => plan.id === selectedPlanId,
  );

  useEffect(() => {
    if (isOpen) {
      return;
    }

    setShowHistory(false);
    setHistoryLoading(false);
    setHasLoadedHistory(false);
    setHistoryError(null);
    setPurchaseHistory([]);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !showHistory || hasLoadedHistory || historyLoading) {
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      try {
        setHistoryLoading(true);
        setHistoryError(null);
        const history = await getTryOnPackPurchaseHistory();

        if (!cancelled) {
          setPurchaseHistory(history);
          setHasLoadedHistory(true);
        }
      } catch (error) {
        if (!cancelled) {
          setHistoryError(
            error instanceof Error
              ? error.message
              : 'Unable to load purchase history.',
          );
          setHasLoadedHistory(true);
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [hasLoadedHistory, historyLoading, isOpen, showHistory]);

  const handleStartPayment = async () => {
    if (!selectedPlan) {
      toast({
        title: 'Select a try-on pack',
        description: 'Choose a pack before continuing.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const payload = await initiateTryOnPackPurchase({
        planId: selectedPlan.id,
        returnPath: buildTryOnPurchaseReturnPath(
          window.location.pathname,
          window.location.search,
        ),
      });

      redirectToPayU(payload);
    } catch (error) {
      setIsProcessing(false);
      toast({
        title: 'Unable to start payment',
        description:
          error instanceof Error
            ? error.message
            : 'Please try again in a moment.',
        variant: 'destructive',
      });
    }
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
            className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-sm"
          />

          <div className="fixed inset-0 z-[95] flex items-end justify-center p-3 sm:items-center sm:p-5">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="try-on-upgrade-title"
              className="relative w-full max-w-5xl overflow-hidden rounded-[28px] border border-[#E8DCC3] bg-[#FCF8F1] shadow-[0_28px_80px_rgba(28,23,16,0.22)]"
            >
              <button
                onClick={onClose}
                disabled={isProcessing}
                aria-label="Close try-on pack popup"
                className="absolute right-4 top-4 rounded-full border border-[#E8DCC3] bg-white p-2 text-[#6D5C45] transition hover:bg-[#F7F1E5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7">
                <div className="pr-10">
                  <h2
                    id="try-on-upgrade-title"
                    className="text-2xl font-serif text-[#241B12] sm:text-3xl"
                  >
                    Select a pack
                  </h2>
                  <p className="mt-2 text-sm text-[#6D5C45] sm:text-[15px]">
                    3 simple packs. Select one and pay.
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#A08352]">
                    {remainingTryOns} of {maxTryOns} try-ons left
                  </p>
                  {isTestMode && (
                    <p className="mt-3 text-xs text-[#8A6936]">
                      Test mode enabled. Payment continues on PayU.
                    </p>
                  )}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {PRIORITIZED_TRY_ON_PLANS.map((plan, index) => {
                    const isSelected = selectedPlanId === plan.id;
                    const isPriority = index === 0;

                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className="relative rounded-[24px] border p-5 text-left transition"
                        style={{
                          borderColor: isSelected ? '#B68A2D' : '#E8DCC3',
                          background: isSelected ? '#FFF6E3' : '#FFFFFF',
                          boxShadow: isSelected
                            ? '0 14px 28px rgba(182,138,45,0.16)'
                            : '0 8px 18px rgba(28,23,16,0.05)',
                        }}
                      >
                        {isPriority && (
                          <span className="absolute left-5 top-4 rounded-full bg-[#F4E2B8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A6936]">
                            Recommended
                          </span>
                        )}
                        {isSelected && (
                          <span className="absolute right-4 top-4 rounded-full bg-[#B68A2D] p-1 text-white">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )}

                        <div className={isPriority ? 'pt-8' : ''}>
                          <p className="text-lg font-semibold text-[#241B12]">
                            {plan.name}
                          </p>
                          <p className="mt-4 text-3xl font-serif text-[#241B12]">
                            {formatCurrency(plan.priceInr)}
                          </p>
                          <p className="mt-2 text-sm text-[#6D5C45]">
                            {plan.tryOns} virtual try-ons
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 border-t border-[#E8DCC3] pt-5">
                  <button
                    type="button"
                    onClick={() => setShowHistory((current) => !current)}
                    className="text-sm font-medium text-[#241B12] underline underline-offset-4"
                  >
                    {showHistory ? 'Hide purchase history' : 'Show purchase history'}
                  </button>

                  {showHistory && (
                    <div className="mt-4 rounded-[22px] border border-[#E8DCC3] bg-white p-4">
                      {historyLoading ? (
                        <p className="text-sm text-[#6D5C45]">Loading purchase history...</p>
                      ) : historyError ? (
                        <p className="text-sm text-rose-700">{historyError}</p>
                      ) : purchaseHistory.length === 0 ? (
                        <p className="text-sm text-[#6D5C45]">No try-on pack purchases yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {purchaseHistory.slice(0, 5).map((purchase) => (
                            <div
                              key={purchase.purchaseId}
                              className="flex flex-col gap-2 rounded-2xl border border-[#EFE4CF] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="text-sm font-medium text-[#241B12]">
                                  {purchase.packName}
                                </p>
                                <p className="mt-1 text-xs text-[#6D5C45]">
                                  {purchase.tryOns} try-ons • {formatHistoryAmount(purchase.amountPaise)} •{' '}
                                  {formatHistoryDate(purchase.creditedAt || purchase.createdAt)}
                                </p>
                              </div>
                              <span
                                className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getHistoryStatusTone(
                                  purchase.status,
                                )}`}
                              >
                                {purchase.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-[#E8DCC3] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#241B12]">
                      {selectedPlan?.name} selected
                    </p>
                    <p className="mt-1 text-xs text-[#6D5C45]">
                      Payment method will be chosen on PayU.
                    </p>
                    <a
                      href={
                        selectedPlan
                          ? buildTryOnPackPurchaseUrl(selectedPlan)
                          : `mailto:${TRY_ON_PURCHASE_CONTACT_EMAIL}`
                      }
                      className="mt-2 inline-flex text-xs text-[#8A6936] underline underline-offset-4"
                    >
                      Need help?
                    </a>
                  </div>

                  <button
                    onClick={handleStartPayment}
                    disabled={isProcessing || !selectedPlan}
                    className="flex min-w-[220px] items-center justify-center gap-2 rounded-2xl bg-[#241B12] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#17110B] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isProcessing
                      ? 'Redirecting...'
                      : `Pay ${formatCurrency(selectedPlan?.priceInr ?? 0)}`}
                    {!isProcessing && <ArrowRight className="h-4 w-4" />}
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
