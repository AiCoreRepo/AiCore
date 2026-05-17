import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  parseTryOnPurchaseRedirect,
  stripTryOnPurchaseRedirectParams,
  TRY_ON_PURCHASE_PLANS,
} from '@/lib/try-on-limit';

export function useTryOnPurchaseRedirect(
  fetchUser?: () => Promise<void>,
) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const redirectState = parseTryOnPurchaseRedirect(location.search);
    if (!redirectState.status) {
      return;
    }

    let isCancelled = false;

    const handleRedirect = async () => {
      const nextSearch = stripTryOnPurchaseRedirectParams(location.search);
      const replaceTarget = {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : '',
      };

      if (redirectState.status === 'success') {
        try {
          await fetchUser?.();
        } catch {
          // Keep the success feedback even if profile refresh is transiently unavailable.
        }

        if (isCancelled) {
          return;
        }

        const matchingPlan = TRY_ON_PURCHASE_PLANS.find(
          (plan) => plan.id === redirectState.planId,
        );

        toast({
          title: 'Virtual try-ons added',
          description:
            redirectState.tryOns && redirectState.tryOns > 0
              ? `${redirectState.tryOns} try-ons credited${matchingPlan ? ` from ${matchingPlan.name}` : ''}.`
              : 'Your virtual try-on balance has been updated.',
          className: 'bg-emerald-50 border-emerald-200 text-emerald-950',
        });
      } else {
        toast({
          title: 'Payment not completed',
          description:
            redirectState.reason ||
            'The virtual try-on pack payment was not completed.',
          variant: 'destructive',
        });
      }

      navigate(replaceTarget, { replace: true });
    };

    void handleRedirect();

    return () => {
      isCancelled = true;
    };
  }, [fetchUser, location.pathname, location.search, navigate, toast]);
}
