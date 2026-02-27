import React, { useEffect, useState } from 'react';
import {
    X, Percent, Truck, IndianRupee, Calendar, Users, MapPin,
    Clock, FileText, Tag, Hash, TrendingUp
} from 'lucide-react';
import type { Coupon } from '@/types/coupon.types';
import { CouponTypeEnum, CouponStatusEnum } from '@/constants/coupon.enums';
import { COUPON_TYPE_LABELS, COUPON_STATUS_LABELS, COUPON_STATUS_META } from '@/constants/coupon.constants';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface CouponDetailModalProps {
    coupon: Coupon | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (coupon: Coupon) => void;
    onDelete?: (id: string) => void;
}

const getDiscountIcon = (type: CouponTypeEnum) => {
    switch (type) {
        case CouponTypeEnum.PERCENTAGE:
            return <Percent className="w-6 h-6" />;
        case CouponTypeEnum.DELIVERY:
            return <Truck className="w-6 h-6" />;
        default:
            return <IndianRupee className="w-6 h-6" />;
    }
};

const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.discountType === 'PERCENTAGE') return `${coupon.discountValue}%`;
    if (coupon.discountType === 'DELIVERY') return 'Free';
    return `₹${coupon.discountValue.toLocaleString('en-IN')}`;
};

const getAccentColor = (type: CouponTypeEnum) => {
    switch (type) {
        case CouponTypeEnum.PERCENTAGE:
            return { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', gradient: 'from-violet-600/30 to-fuchsia-600/30' };
        case CouponTypeEnum.DELIVERY:
            return { text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', gradient: 'from-sky-600/30 to-cyan-600/30' };
        default:
            return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', gradient: 'from-amber-600/30 to-orange-600/30' };
    }
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

interface DetailRowProps {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon, label, value }) => (
    <div className="flex items-start gap-3 py-3">
        <div className="text-neutral-500 mt-0.5 flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold mb-0.5">{label}</p>
            <div className="text-sm text-neutral-200">{value}</div>
        </div>
    </div>
);

export const CouponDetailModal: React.FC<CouponDetailModalProps> = ({ coupon, isOpen, onClose, onEdit, onDelete }) => {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    if (!isOpen || !coupon) return null;

    const statusMeta = COUPON_STATUS_META[coupon.status];
    const accent = getAccentColor(coupon.discountType);
    const usagePercent = coupon.maxUsage > 0 ? Math.round(((coupon.currentUsage || 0) / coupon.maxUsage) * 100) : 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto bg-neutral-900 border border-neutral-700/60 rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-black/50 animate-[slideUp_300ms_ease-out]">
                {/* Top gradient bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${accent.gradient}`} />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-400 hover:text-neutral-200 transition-colors z-10"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Hero section */}
                <div className="p-4 sm:p-6 pb-4">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${accent.gradient} ${accent.text}`}>
                            {getDiscountIcon(coupon.discountType)}
                        </div>
                        <div className="flex-1 min-w-0 pr-8">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${accent.text}`}>
                                    {getDiscountDisplay(coupon)}
                                </span>
                                <span className="text-lg font-medium text-neutral-400">
                                    {coupon.discountType === 'DELIVERY' ? 'Delivery' : 'OFF'}
                                </span>
                            </div>
                            <h2 className="text-base font-medium text-neutral-200 mb-2">{coupon.title}</h2>
                            <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
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
                    </div>

                    {/* Coupon code */}
                    <div className="mt-5 flex items-center justify-center py-3 px-4 rounded-xl border-2 border-dashed border-[#D4AF37]/40 bg-[#D4AF37]/5">
                        <span className="text-lg font-bold tracking-[0.25em] text-[#D4AF37]">{coupon.code}</span>
                    </div>
                </div>

                {/* Divider */}
                <div className="mx-4 sm:mx-6 border-t border-neutral-800/80" />

                {/* Details section */}
                <div className="p-4 sm:p-6 pt-2 space-y-0">
                    <DetailRow
                        icon={<Tag className="w-4 h-4" />}
                        label="Discount Type"
                        value={COUPON_TYPE_LABELS[coupon.discountType]}
                    />

                    <div className="border-t border-neutral-800/50" />

                    <DetailRow
                        icon={<IndianRupee className="w-4 h-4" />}
                        label="Minimum Order Amount"
                        value={`₹${coupon.minOrderAmount.toLocaleString('en-IN')}`}
                    />

                    <div className="border-t border-neutral-800/50" />

                    {/* Usage progress */}
                    <div className="py-3">
                        <div className="flex items-center gap-3">
                            <div className="text-neutral-500 flex-shrink-0">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">Usage</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-2 rounded-full bg-neutral-800 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${usagePercent}%`,
                                                background: `linear-gradient(90deg, ${statusMeta.color}, ${statusMeta.color}88)`,
                                            }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-neutral-300 whitespace-nowrap">
                                        {coupon.currentUsage || 0} / {coupon.maxUsage}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-neutral-800/50" />

                    <DetailRow
                        icon={<Calendar className="w-4 h-4" />}
                        label="Validity Period"
                        value={
                            <span className="flex items-center gap-1.5">
                                {formatDate(coupon.startDate)}
                                <span className="text-neutral-600">→</span>
                                {formatDate(coupon.endDate)}
                            </span>
                        }
                    />

                    {coupon.reason && (
                        <>
                            <div className="border-t border-neutral-800/50" />
                            <DetailRow
                                icon={<Clock className="w-4 h-4" />}
                                label="Reason"
                                value={<span className="capitalize">{coupon.reason}</span>}
                            />
                        </>
                    )}

                    {coupon.description && (
                        <>
                            <div className="border-t border-neutral-800/50" />
                            <DetailRow
                                icon={<FileText className="w-4 h-4" />}
                                label="Description"
                                value={coupon.description}
                            />
                        </>
                    )}

                    <div className="border-t border-neutral-800/50" />
                    <DetailRow
                        icon={<MapPin className="w-4 h-4" />}
                        label="Location Restriction"
                        value={
                            !coupon.isLocationRestricted ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                                    Pan India (All Pincodes)
                                </span>
                            ) : (
                                <div className="space-y-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
                                        Restricted to {coupon.allowedPincodes?.length || 0} areas
                                    </span>
                                    {coupon.allowedPincodes && coupon.allowedPincodes.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {coupon.allowedPincodes.map((pin) => (
                                                <span
                                                    key={pin}
                                                    className="px-2 py-0.5 rounded-md bg-neutral-800/60 text-neutral-300 text-xs font-mono"
                                                >
                                                    {pin}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        }
                    />

                    {coupon.termsAndConditions && (
                        <>
                            <div className="border-t border-neutral-800/50" />
                            <DetailRow
                                icon={<Hash className="w-4 h-4" />}
                                label="Terms & Conditions"
                                value={<span className="text-neutral-400 text-xs leading-relaxed">{coupon.termsAndConditions}</span>}
                            />
                        </>
                    )}

                    {coupon.createdAt && (
                        <>
                            <div className="border-t border-neutral-800/50" />
                            <div className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[11px] text-neutral-500">
                                <span>Created: {formatDateTime(coupon.createdAt)}</span>
                                {coupon.updatedAt && <span>Updated: {formatDateTime(coupon.updatedAt)}</span>}
                            </div>
                        </>
                    )}
                    <div className="border-t border-neutral-800/50 mt-4 pt-4 flex gap-3 justify-end items-center">
                        <button
                            onClick={() => {
                                setIsDeleteModalOpen(true);
                            }}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all border border-red-500/20"
                        >
                            Delete
                        </button>
                        <button
                            onClick={() => {
                                onEdit?.(coupon);
                                onClose();
                            }}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-all border border-amber-500/20"
                        >
                            Edit Coupon
                        </button>
                    </div>
                </div>
            </div>

            {/* Keyframe styles */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(16px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => {
                    onDelete?.(coupon.id);
                    onClose();
                }}
                title="Delete Coupon"
                description={`Are you sure you want to delete the coupon "${coupon.code}"? This action cannot be undone.`}
            />
        </div>
    );
};
