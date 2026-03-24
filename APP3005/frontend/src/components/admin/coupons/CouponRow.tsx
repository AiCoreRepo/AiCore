import React from 'react';
import type { Coupon } from '@/types/coupon.types';
import { CouponStatusEnum } from '@/constants/coupon.enums';
import { COUPON_TYPE_LABELS, COUPON_STATUS_LABELS, COUPON_STATUS_META } from '@/constants/coupon.constants';

interface CouponRowProps {
    coupon: Coupon;
}

const StatusBadge: React.FC<{ status: CouponStatusEnum }> = ({ status }) => {
    const meta = COUPON_STATUS_META[status];
    const label = COUPON_STATUS_LABELS[status];
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
            style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}
        >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: meta.dot }} />
            {label}
        </span>
    );
};

export const CouponRow: React.FC<CouponRowProps> = ({ coupon }) => {
    const discountDisplay =
        coupon.discountType === 'PERCENTAGE'
            ? `${coupon.discountValue}%`
            : coupon.discountType === 'DELIVERY'
                ? 'Free'
                : `₹${coupon.discountValue.toLocaleString('en-IN')}`;

    return (
        <tr className="border-b border-neutral-800 hover:bg-neutral-800/30 transition-colors">
            <td className="px-4 py-3.5">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold tracking-wider">
                    {coupon.code}
                </span>
            </td>
            <td className="px-4 py-3.5 text-sm text-neutral-300">
                {COUPON_TYPE_LABELS[coupon.discountType] || coupon.discountType}
            </td>
            <td className="px-4 py-3.5 text-sm text-white font-medium">
                {discountDisplay}
            </td>
            <td className="px-4 py-3.5 text-sm text-neutral-400">
                ₹{coupon.minOrderAmount.toLocaleString('en-IN')}
            </td>
            <td className="px-4 py-3.5">
                <StatusBadge status={coupon.status} />
            </td>
            <td className="px-4 py-3.5 text-sm text-neutral-400 capitalize">
                {coupon.reason || '—'}
            </td>
        </tr>
    );
};
