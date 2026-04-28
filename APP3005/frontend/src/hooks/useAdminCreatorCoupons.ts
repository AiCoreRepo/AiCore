// ============================================
// useAdminCreatorCoupons — Creator coupons (admin side)
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { adminCouponsApi, type PendingCreatorCoupon } from '@/api/adminCoupons.api';

interface UseAdminCreatorCouponsReturn {
    coupons: PendingCreatorCoupon[];
    isLoading: boolean;
    error: string | null;
    isMutating: boolean;
    refetch: () => void;
    approve: (id: string) => Promise<void>;
    reject: (id: string) => Promise<void>;
    archive: (id: string) => Promise<void>;
}

export const useAdminCreatorCoupons = (): UseAdminCreatorCouponsReturn => {
    const [coupons, setCoupons] = useState<PendingCreatorCoupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMutating, setIsMutating] = useState(false);

    const fetchCreatorCoupons = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await adminCouponsApi.getPendingCreatorCoupons();
            setCoupons(data);
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || 'Failed to fetch creator coupons';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCreatorCoupons();
    }, [fetchCreatorCoupons]);

    const withMutation = async (fn: () => Promise<any>) => {
        setIsMutating(true);
        try {
            await fn();
            await fetchCreatorCoupons();
        } finally {
            setIsMutating(false);
        }
    };

    const approve = async (id: string) => {
        await withMutation(() => adminCouponsApi.approveCreatorCoupon(id));
    };

    const reject = async (id: string) => {
        // For now we do not capture a reason; can be extended later
        await withMutation(() => adminCouponsApi.rejectCreatorCoupon(id));
    };

    const archive = async (id: string) => {
        await withMutation(() => adminCouponsApi.archiveCreatorCoupon(id));
    };

    return {
        coupons,
        isLoading,
        error,
        isMutating,
        refetch: fetchCreatorCoupons,
        approve,
        reject,
        archive,
    };
};
