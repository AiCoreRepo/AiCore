import React from 'react';
import { Percent, Truck, IndianRupee, Calendar, Users, MapPin, Clock, Layers, Sparkles } from 'lucide-react';
import type { Coupon } from '@/types/coupon.types';
import { CouponTypeEnum, CouponStatusEnum, CouponScopeTypeEnum } from '@/constants/coupon.enums';
import { COUPON_TYPE_LABELS, COUPON_STATUS_LABELS, COUPON_STATUS_META } from '@/constants/coupon.constants';
import { FESTIVALS } from '@/constants/festival.constants';

interface CouponCardProps {
    coupon: Coupon;
    onClick: (coupon: Coupon) => void;
}

const getDiscountIcon = (type: CouponTypeEnum) => {
    switch (type) {
        case CouponTypeEnum.PERCENTAGE:
            return <Percent className="w-5 h-5" />;
        case CouponTypeEnum.DELIVERY:
            return <Truck className="w-5 h-5" />;
        default:
            return <IndianRupee className="w-5 h-5" />;
    }
};

const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.discountType === 'PERCENTAGE') return `${coupon.discountValue}% OFF`;
    if (coupon.discountType === 'DELIVERY') return 'FREE DELIVERY';
    return `₹${coupon.discountValue.toLocaleString('en-IN')} OFF`;
};

const getDiscountGradient = (type: CouponTypeEnum) => {
    switch (type) {
        case CouponTypeEnum.PERCENTAGE:
            return 'from-violet-500/20 to-fuchsia-500/20';
        case CouponTypeEnum.DELIVERY:
            return 'from-sky-500/20 to-cyan-500/20';
        default:
            return 'from-amber-500/20 to-orange-500/20';
    }
};

const getDiscountAccent = (type: CouponTypeEnum) => {
    switch (type) {
        case CouponTypeEnum.PERCENTAGE:
            return 'text-violet-400';
        case CouponTypeEnum.DELIVERY:
            return 'text-sky-400';
        default:
            return 'text-amber-400';
    }
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

// Get scope badge content
const getScopeLabel = (coupon: Coupon): { icon: React.ReactNode; text: string; colorClass: string; bgClass: string; borderClass: string } | null => {
    const scope = coupon.scope;
    if (!scope) return null;

    switch (scope.scopeType) {
        case CouponScopeTypeEnum.PRICE_LEVEL: {
            const min = scope.minPrice ? `₹${Number(scope.minPrice).toLocaleString('en-IN')}` : '';
            const max = scope.maxPrice ? `₹${Number(scope.maxPrice).toLocaleString('en-IN')}` : '';
            const range = max ? `${min}–${max}` : `${min}+`;
            return {
                icon: <Layers className="w-3 h-3" />,
                text: `Price: ${range}`,
                colorClass: 'text-cyan-400',
                bgClass: 'bg-cyan-500/10',
                borderClass: 'border-cyan-500/20',
            };
        }
        case CouponScopeTypeEnum.FESTIVAL: {
            const festival = FESTIVALS.find(f => f.key === scope.festivalKey);
            return {
                icon: <Sparkles className="w-3 h-3" />,
                text: festival ? festival.label : (scope.festivalKey || 'Festival'),
                colorClass: 'text-pink-400',
                bgClass: 'bg-pink-500/10',
                borderClass: 'border-pink-500/20',
            };
        }
        default:
            return null;
    }
};

export const CouponCard: React.FC<CouponCardProps> = ({ coupon, onClick }) => {
    const statusMeta = COUPON_STATUS_META[coupon.status];
    const discountGradient = getDiscountGradient(coupon.discountType);
    const accentColor = getDiscountAccent(coupon.discountType);
    const isExpired = coupon.status === CouponStatusEnum.EXPIRED;
    const isDisabled = coupon.status === CouponStatusEnum.DISABLED;

    return (
        <div
            onClick={() => onClick(coupon)}
            className={`
                group relative cursor-pointer rounded-2xl border overflow-hidden
                transition-all duration-300 ease-out
                ${isExpired || isDisabled
                    ? 'border-neutral-800/60 opacity-70 hover:opacity-90'
                    : 'border-neutral-700/50 hover:border-neutral-600/70'
                }
                hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-1
                bg-neutral-900/70 backdrop-blur-sm
            `}
            style={{ willChange: 'transform' }}
        >
            {/* Top gradient strip */}
            <div className={`h-1 w-full bg-gradient-to-r ${discountGradient}`} />

            {/* Card body */}
            <div className="p-5">
                {/* Header row: Discount icon + Status badge */}
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${discountGradient} ${accentColor}`}>
                        {getDiscountIcon(coupon.discountType)}
                    </div>
                    <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
                        style={{
                            color: statusMeta.color,
                            background: statusMeta.bg,
                            borderColor: statusMeta.border,
                        }}
                    >
                        <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: statusMeta.dot }}
                        />
                        {COUPON_STATUS_LABELS[coupon.status]}
                    </span>
                </div>

                {/* Discount value */}
                <div className="mb-1">
                    <span className={`text-2xl font-bold tracking-tight ${accentColor}`}>
                        {getDiscountDisplay(coupon)}
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-medium text-neutral-300 mb-3 line-clamp-1">
                    {coupon.title}
                </h3>

                {/* Coupon code pill - dashed border style like real coupons */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 flex items-center justify-center py-2 px-3 rounded-lg border-2 border-dashed border-[#D4AF37]/40 bg-[#D4AF37]/5">
                        <span className="text-sm font-bold tracking-[0.2em] text-[#D4AF37]">
                            {coupon.code}
                        </span>
                    </div>
                </div>

                {/* Info badges row */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {/* Scope badge */}
                    {(() => {
                        const scopeInfo = getScopeLabel(coupon);
                        if (!scopeInfo) return null;
                        return (
                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${scopeInfo.bgClass} ${scopeInfo.colorClass} text-[11px] font-medium border ${scopeInfo.borderClass}`}>
                                {scopeInfo.icon}
                                <span>{scopeInfo.text}</span>
                            </div>
                        );
                    })()}

                    {/* Min order */}
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-800/60 text-neutral-400 text-[11px]">
                        <IndianRupee className="w-3 h-3" />
                        <span>Min ₹{coupon.minOrderAmount.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Usage */}
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-800/60 text-neutral-400 text-[11px]">
                        <Users className="w-3 h-3" />
                        <span>{coupon.currentUsage || 0}/{coupon.maxUsage} used</span>
                    </div>

                    {/* Location Restriction status */}
                    {!coupon.isLocationRestricted ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[11px] font-medium border border-emerald-500/20">
                            <MapPin className="w-3 h-3" />
                            <span>Pan India</span>
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 text-[11px] font-medium border border-amber-500/20">
                            <MapPin className="w-3 h-3" />
                            <span>{coupon.allowedPincodes?.length || 0} areas</span>
                        </div>
                    )}
                </div>

                {/* Validity dates */}
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(coupon.startDate)} – {formatDate(coupon.endDate)}</span>
                </div>

                {/* Reason tag */}
                {coupon.reason && (
                    <div className="mt-3 pt-3 border-t border-neutral-800/60">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800/40 text-neutral-500 text-[11px]">
                            <Clock className="w-3 h-3" />
                            <span className="capitalize">{coupon.reason}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Hover glow effect */}
            <div className={`
                absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
                bg-gradient-to-br ${discountGradient}
            `}
                style={{ mixBlendMode: 'overlay' }}
            />
        </div>
    );
};
