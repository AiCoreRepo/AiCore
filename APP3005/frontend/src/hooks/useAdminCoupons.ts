// ============================================
// useAdminCoupons — Fetch & paginate coupons
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { adminCouponsApi } from '@/api/adminCoupons.api';
import { COUPONS_PER_PAGE } from '@/constants/coupon.constants';
import type { Coupon } from '@/types/coupon.types';

interface UseAdminCouponsReturn {
    coupons: Coupon[];
    allCoupons: Coupon[];
    isLoading: boolean;
    error: string | null;
    currentPage: number;
    totalPages: number;
    setCurrentPage: (page: number) => void;
    refetch: () => void;
    updateCoupon: (id: string, payload: Partial<Coupon>) => Promise<Coupon>;
    deleteCoupon: (id: string) => Promise<void>;
}

export const useAdminCoupons = (): UseAdminCouponsReturn => {
    const [allCoupons, setAllCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchCoupons = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await adminCouponsApi.getCoupons();
            setAllCoupons(data);
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || 'Failed to fetch coupons';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    const totalPages = Math.ceil(allCoupons.length / COUPONS_PER_PAGE);
    const coupons = allCoupons.slice(
        (currentPage - 1) * COUPONS_PER_PAGE,
        currentPage * COUPONS_PER_PAGE
    );

    const updateCoupon = async (id: string, payload: Partial<Coupon>) => {
        const updated = await adminCouponsApi.updateCoupon(id, payload);
        await fetchCoupons();
        return updated;
    };

    const deleteCoupon = async (id: string) => {
        await adminCouponsApi.deleteCoupon(id);
        await fetchCoupons();
    };

    return {
        coupons,
        allCoupons,
        isLoading,
        error,
        currentPage,
        totalPages,
        setCurrentPage,
        refetch: fetchCoupons,
        updateCoupon,
        deleteCoupon,
    };
};
