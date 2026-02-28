import React from 'react';
import { CouponTypeEnum, CouponStatusEnum, CouponScopeTypeEnum } from '@/constants/coupon.enums';
import { COUPON_TYPE_LABELS, COUPON_STATUS_LABELS } from '@/constants/coupon.constants';
import { FESTIVAL_OPTIONS } from '@/constants/festival.constants';
import { FormInput } from './FormInput';
import { FormSelect } from './FormSelect';
import { FormTextarea } from './FormTextarea';
import { SubmitButton } from './SubmitButton';
import type { CouponFormState, CouponFormErrors } from '@/types/coupon.types';

interface CouponFormProps {
    formState: CouponFormState;
    errors: CouponFormErrors;
    isSubmitting: boolean;
    onChange: (field: keyof CouponFormState, value: string | boolean) => void;
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

// Scope type options — currently only Price Level & Festival are active
const scopeTypeOptions = [
    // TODO: [Future Dev] Re-enable Global scope when all-products targeting is needed
    // { value: CouponScopeTypeEnum.GLOBAL, label: 'Global (All Products)' },
    { value: CouponScopeTypeEnum.PRICE_LEVEL, label: 'Price Level (Price Range)' },
    { value: CouponScopeTypeEnum.FESTIVAL, label: 'Festival' },
    // TODO: [Future Dev] Implement User Scope for user-specific coupons
    // { value: CouponScopeTypeEnum.USER, label: 'User Scope' },
    // TODO: [Future Dev] Implement Company Special for brand-specific coupons
    // { value: CouponScopeTypeEnum.COMPANY_SPECIAL, label: 'Company Special' },
    // TODO: [Future Dev] Implement Collection scope for collection-based coupons
    // { value: CouponScopeTypeEnum.COLLECTION, label: 'Collection' },
];

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
                            onChange={(v) => {
                                onChange('discountType', v);
                                if (v === CouponTypeEnum.DELIVERY) {
                                    onChange('discountValue', '0');
                                    onChange('minOrderAmount', '0');
                                }
                            }}
                            options={discountTypeOptions}
                            error={errors.discountType}
                            disabled={isSubmitting}
                            required
                        />
                        {formState.discountType !== CouponTypeEnum.DELIVERY && (
                            <>
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
                            </>
                        )}
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-neutral-800" />

                {/* Section: Coupon Scope */}
                <div>
                    <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider mb-4">
                        Coupon Scope
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormSelect
                            id="scopeType"
                            label="Scope Type"
                            value={formState.scopeType}
                            onChange={(v) => {
                                onChange('scopeType', v);
                                // Reset scope fields when switching type
                                onChange('scopeMinPrice', '');
                                onChange('scopeMaxPrice', '');
                                onChange('scopeFestivalKey', '');
                            }}
                            options={scopeTypeOptions}
                            error={errors.scopeType}
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    {/* PRICE_LEVEL scope fields */}
                    {formState.scopeType === CouponScopeTypeEnum.PRICE_LEVEL && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 animate-[fadeIn_300ms_ease-out]">
                            <FormInput
                                id="scopeMinPrice"
                                label="Min Collection Price (₹)"
                                type="number"
                                value={formState.scopeMinPrice}
                                onChange={(v) => onChange('scopeMinPrice', v)}
                                placeholder="e.g., 500"
                                error={errors.scopeMinPrice}
                                disabled={isSubmitting}
                                required
                            />
                            <FormInput
                                id="scopeMaxPrice"
                                label="Max Collection Price (₹) — Optional"
                                type="number"
                                value={formState.scopeMaxPrice}
                                onChange={(v) => onChange('scopeMaxPrice', v)}
                                placeholder="Leave empty for no upper limit"
                                error={errors.scopeMaxPrice}
                                disabled={isSubmitting}
                            />
                        </div>
                    )}

                    {/* FESTIVAL scope fields */}
                    {formState.scopeType === CouponScopeTypeEnum.FESTIVAL && (
                        <div className="mt-4 animate-[fadeIn_300ms_ease-out]">
                            <FormSelect
                                id="scopeFestivalKey"
                                label="Select Festival"
                                value={formState.scopeFestivalKey}
                                onChange={(v) => onChange('scopeFestivalKey', v)}
                                options={FESTIVAL_OPTIONS}
                                error={errors.scopeFestivalKey}
                                disabled={isSubmitting}
                                required
                            />
                        </div>
                    )}

                    {/* TODO: [Future Dev] Re-enable Global scope info text when Global scope is re-added
                    {formState.scopeType === CouponScopeTypeEnum.GLOBAL && (
                        <p className="mt-3 text-xs text-neutral-500">
                            This coupon applies to all products and collections.
                        </p>
                    )}
                    */}
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

                        {/* Location Restriction Toggle */}
                        <div className="flex flex-col gap-2 relative">
                            <label className="text-xs font-medium text-neutral-400">
                                Location Restriction
                            </label>
                            <div className="flex items-center gap-3 mt-1 pl-1">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={formState.isLocationRestricted}
                                    disabled={isSubmitting}
                                    onClick={() => onChange('isLocationRestricted', !formState.isLocationRestricted)}
                                    className={`
                                        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                                        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 focus:ring-offset-neutral-900
                                        ${formState.isLocationRestricted ? 'bg-[#D4AF37]' : 'bg-neutral-700'}
                                        ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`
                                            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                                            transition duration-200 ease-in-out
                                            ${formState.isLocationRestricted ? 'translate-x-5' : 'translate-x-0'}
                                        `}
                                    />
                                </button>
                                <span className="text-sm text-neutral-300 select-none">
                                    {formState.isLocationRestricted ? 'Restricted to Pincodes' : 'Pan India (All Pincodes)'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Allowed Pincodes Input (Only visible if restricted) */}
                    {formState.isLocationRestricted && (
                        <div className="mt-4 animate-[fadeIn_300ms_ease-out]">
                            <FormInput
                                id="allowedPincodes"
                                label="Allowed Pincodes"
                                value={formState.allowedPincodes}
                                onChange={(v) => onChange('allowedPincodes', v)}
                                placeholder="e.g., 110001, 400001 (comma separated)"
                                disabled={isSubmitting}
                                required
                            />
                            <p className="mt-1.5 text-xs text-neutral-500">
                                Enter comma-separated pincodes where this coupon is valid.
                            </p>
                        </div>
                    )}
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
