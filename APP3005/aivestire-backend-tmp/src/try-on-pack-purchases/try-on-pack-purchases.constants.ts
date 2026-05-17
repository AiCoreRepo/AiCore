export const TRY_ON_PACKS = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    tryOns: 3,
    priceInr: 49,
  },
  style: {
    id: 'style',
    name: 'Style Pack',
    tryOns: 7,
    priceInr: 99,
  },
  studio: {
    id: 'studio',
    name: 'Studio Pack',
    tryOns: 12,
    priceInr: 149,
  },
} as const;

export type TryOnPackId = keyof typeof TRY_ON_PACKS;

export const TRY_ON_PACK_IDS = Object.keys(TRY_ON_PACKS) as TryOnPackId[];
export const TRY_ON_PACK_TXN_PREFIX = 'TOV_';
export const DEFAULT_TRY_ON_PACK_RETURN_PATH = '/ai-try-on';
export const TRY_ON_PURCHASE_RESULT_PARAM = 'tryOnPurchase';
export const TRY_ON_PURCHASE_TRY_ONS_PARAM = 'tryOnPurchaseTryOns';
export const TRY_ON_PURCHASE_PLAN_PARAM = 'tryOnPurchasePlan';
export const TRY_ON_PURCHASE_REASON_PARAM = 'tryOnPurchaseReason';
