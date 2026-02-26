import React from 'react';
import { CouponTypeEnum, CouponStatusEnum } from '@/constants/coupon.enums';
import { COUPON_TYPE_LABELS, COUPON_STATUS_LABELS } from '@/constants/coupon.constants';
import { FormInput } from './FormInput';
import { FormSelect } from './FormSelect';
import { FormTextarea } from './FormTextarea';
import { SubmitButton } from './SubmitButton';
import type { CouponFormState, CouponFormErrors } from '@/types/coupon.types';

interface CouponFormProps {
    formState: CouponFormState;
    errors: CouponFormErrors;
    isSubmitting: boolean;
    onChange: (field: keyof CouponFormState, value: string) => void;
    onSubmit: () => void;
}

// Build select options from enums
const discountTypeOptions = Object.values(CouponTypeEnum).map((val) => ({
    value: val,
    label: COUPON_TYPE_LABELS[val],
}));

const statusOptions = Object.values(CouponStatusEnum).map((val) => ({
    value: val,
    label: COUPON_STATUS_LABELS[val],
}));

export const CouponForm: React.FC<CouponFormProps> = ({
    formState,
    errors,
    isSubmitting,
    onChange,
    onSubmit,
}) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <form onSubmit={handleSubmit} className="admin-dark-form space-y-8">
            {/* Card */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-3 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
                {/* Section: Basic Info */}
                <div>
                    <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider mb-4">
                        Basic Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormInput
                            id="title"
                            label="Title"
                            value={formState.title}
                            onChange={(v) => onChange('title', v)}
                            placeholder="e.g., Summer Sale 2026"
                            error={errors.title}
                            disabled={isSubmitting}
                            required
                        />
                        <FormInput
                            id="code"
                            label="Coupon Code"
                            value={formState.code}
                            onChange={(v) => onChange('code', v.toUpperCase())}
                            placeholder="e.g., SUMMER20"
                            error={errors.code}
                            disabled={isSubmitting}
                            required
                        />
                    </div>
                    <div className="mt-4">
                        <FormTextarea
                            id="description"
                            label="Description"
                            value={formState.description}
                            onChange={(v) => onChange('description', v)}
                            placeholder="Brief description of the coupon..."
                            error={errors.description}
                            disabled={isSubmitting}
                            rows={2}
                        />
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-neutral-800" />

                {/* Section: Discount Details */}
                <div>
                    <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider mb-4">
                        Discount Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <FormSelect
                            id="discountType"
                            label="Discount Type"
                            value={formState.discountType}
                            onChange={(v) => onChange('discountType', v)}
                            options={discountTypeOptions}
                            error={errors.discountType}
                            disabled={isSubmitting}
                            required
                        />
                        <FormInput
                            id="discountValue"
                            label="Discount Value"
                            type="number"
                            value={formState.discountValue}
                            onChange={(v) => onChange('discountValue', v)}
                            placeholder={formState.discountType === CouponTypeEnum.PERCENTAGE ? '0-100' : '₹ Amount'}
                            error={errors.discountValue}
                            disabled={isSubmitting}
                            required
                        />
                        <FormInput
                            id="minOrderAmount"
                            label="Min Order Amount (₹)"
                            type="number"
                            value={formState.minOrderAmount}
                            onChange={(v) => onChange('minOrderAmount', v)}
                            placeholder="e.g., 500"
                            error={errors.minOrderAmount}
                            disabled={isSubmitting}
                            required
                        />
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-neutral-800" />

                {/* Section: Configuration */}
                <div>
                    <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider mb-4">
                        Configuration
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormInput
                            id="reason"
                            label="Reason"
                            value={formState.reason}
                            onChange={(v) => onChange('reason', v)}
                            placeholder="e.g., Festival, Event, Offer"
                            error={errors.reason}
                            disabled={isSubmitting}
                            required
                        />
                        <FormInput
                            id="maxUsage"
                            label="Max Usage"
                            type="number"
                            value={formState.maxUsage}
                            onChange={(v) => onChange('maxUsage', v)}
                            placeholder="e.g., 100"
                            error={errors.maxUsage}
                            disabled={isSubmitting}
                            required
                        />
                        <FormInput
                            id="startDate"
                            label="Start Date"
                            type="date"
                            value={formState.startDate}
                            onChange={(v) => onChange('startDate', v)}
                            error={errors.startDate}
                            disabled={isSubmitting}
                            required
                        />
                        <FormInput
                            id="endDate"
                            label="End Date"
                            type="date"
                            value={formState.endDate}
                            onChange={(v) => onChange('endDate', v)}
                            error={errors.endDate}
                            disabled={isSubmitting}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <FormSelect
                            id="status"
                            label="Status"
                            value={formState.status}
                            onChange={(v) => onChange('status', v)}
                            options={statusOptions}
                            error={errors.status}
                            disabled={isSubmitting}
                            required
                        />
                        <FormInput
                            id="allowedPincodes"
                            label="Allowed Pincodes"
                            value={formState.allowedPincodes}
                            onChange={(v) => onChange('allowedPincodes', v)}
                            placeholder="e.g., 110001, 400001 (comma separated)"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-neutral-800" />

                {/* Section: Terms */}
                <div>
                    <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider mb-4">
                        Terms & Conditions
                    </h3>
                    <FormTextarea
                        id="termsAndConditions"
                        label="Terms & Conditions"
                        value={formState.termsAndConditions}
                        onChange={(v) => onChange('termsAndConditions', v)}
                        placeholder="Enter terms and conditions for this coupon..."
                        error={errors.termsAndConditions}
                        disabled={isSubmitting}
                        rows={4}
                    />
                </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end">
                <SubmitButton
                    label="Create Coupon"
                    isSubmitting={isSubmitting}
                    loadingLabel="Creating Coupon..."
                />
            </div>
        </form>
    );
};
