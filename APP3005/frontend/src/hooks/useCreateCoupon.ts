// ============================================
// useCreateCoupon — Submit new coupon
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminCouponsApi } from '@/api/adminCoupons.api';
import { ADMIN_COUPON_ROUTES } from '@/constants/coupon.constants';
import type { CreateCouponPayload } from '@/types/coupon.types';
import { useToast } from '@/hooks/use-toast';

interface UseCreateCouponReturn {
    isSubmitting: boolean;
    error: string | null;
    isSuccess: boolean;
    submitCoupon: (payload: CreateCouponPayload) => Promise<void>;
}

export const useCreateCoupon = (): UseCreateCouponReturn => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const submitCoupon = async (payload: CreateCouponPayload) => {
        setIsSubmitting(true);
        setError(null);
        setIsSuccess(false);
        try {
            await adminCouponsApi.createCoupon(payload);
            setIsSuccess(true);
            toast({
                title: '✓ Coupon Created',
                description: `Coupon "${payload.code}" has been created successfully.`,
            });
            // Navigate back to coupons list after short delay
            setTimeout(() => {
                navigate(ADMIN_COUPON_ROUTES.ADMIN_COUPONS);
            }, 1000);
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || 'Failed to create coupon';
            setError(message);
            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        isSubmitting,
        error,
        isSuccess,
        submitCoupon,
    };
};
