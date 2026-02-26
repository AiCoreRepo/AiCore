// ============================================
// useCouponForm — Form state & validation
// ============================================

import { useState, useCallback } from 'react';
import { CouponTypeEnum, CouponStatusEnum } from '@/constants/coupon.enums';
import type { CouponFormState, CouponFormErrors, CreateCouponPayload } from '@/types/coupon.types';

const initialFormState: CouponFormState = {
    title: '',
    code: '',
    description: '',
    discountType: CouponTypeEnum.FLAT,
    discountValue: '',
    minOrderAmount: '',
    allowedPincodes: '',
    termsAndConditions: '',
    reason: '',
    startDate: '',
    endDate: '',
    maxUsage: '',
    status: CouponStatusEnum.ACTIVE,
};

interface UseCouponFormReturn {
    formState: CouponFormState;
    errors: CouponFormErrors;
    handleChange: (field: keyof CouponFormState, value: string) => void;
    validate: () => boolean;
    resetForm: () => void;
    getPayload: () => CreateCouponPayload;
}

export const useCouponForm = (): UseCouponFormReturn => {
    const [formState, setFormState] = useState<CouponFormState>(initialFormState);
    const [errors, setErrors] = useState<CouponFormErrors>({});

    const handleChange = useCallback((field: keyof CouponFormState, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
        // Clear error on change
        setErrors(prev => ({ ...prev, [field]: undefined }));
    }, []);

    const validate = useCallback((): boolean => {
        const newErrors: CouponFormErrors = {};

        if (!formState.title.trim()) newErrors.title = 'Title is required';
        if (!formState.code.trim()) newErrors.code = 'Code is required';
        if (!formState.discountValue || Number(formState.discountValue) <= 0) {
            newErrors.discountValue = 'Discount value must be greater than 0';
        }
        if (formState.discountType === CouponTypeEnum.PERCENTAGE && Number(formState.discountValue) > 100) {
            newErrors.discountValue = 'Percentage cannot exceed 100';
        }
        if (!formState.minOrderAmount || Number(formState.minOrderAmount) < 0) {
            newErrors.minOrderAmount = 'Min order amount is required';
        }
        if (!formState.reason.trim()) newErrors.reason = 'Reason is required';
        if (!formState.startDate) newErrors.startDate = 'Start date is required';
        if (!formState.endDate) newErrors.endDate = 'End date is required';
        if (formState.startDate && formState.endDate && formState.startDate > formState.endDate) {
            newErrors.endDate = 'End date must be after start date';
        }
        if (!formState.maxUsage || Number(formState.maxUsage) <= 0) {
            newErrors.maxUsage = 'Max usage must be greater than 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formState]);

    const resetForm = useCallback(() => {
        setFormState(initialFormState);
        setErrors({});
    }, []);

    const getPayload = useCallback((): CreateCouponPayload => {
        return {
            title: formState.title.trim(),
            code: formState.code.trim().toUpperCase(),
            description: formState.description.trim(),
            discountType: formState.discountType as CouponTypeEnum,
            discountValue: Number(formState.discountValue),
            minOrderAmount: Number(formState.minOrderAmount),
            allowedPincodes: formState.allowedPincodes
                ? formState.allowedPincodes.split(',').map(p => p.trim()).filter(Boolean)
                : [],
            termsAndConditions: formState.termsAndConditions.trim(),
            reason: formState.reason.trim(),
            startDate: formState.startDate,
            endDate: formState.endDate,
            maxUsage: Number(formState.maxUsage),
            status: formState.status as CouponStatusEnum,
        };
    }, [formState]);

    return {
        formState,
        errors,
        handleChange,
        validate,
        resetForm,
        getPayload,
    };
};
