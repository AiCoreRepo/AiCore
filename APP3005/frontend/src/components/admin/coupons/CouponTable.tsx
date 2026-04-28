import React, { useState } from 'react';
import { Ticket, AlertCircle } from 'lucide-react';
import type { Coupon } from '@/types/coupon.types';
import { CouponCard } from './CouponCard';
import { CouponDetailModal } from './CouponDetailModal';

interface CouponTableProps {
    coupons: Coupon[];
    isLoading: boolean;
    error: string | null;
    onEdit?: (coupon: Coupon) => void;
    onDelete?: (id: string) => void;
}

// Skeleton card for loading state
const SkeletonCard: React.FC = () => (
    <div className="rounded-2xl border border-neutral-800/60 bg-neutral-900/70 p-5 animate-pulse">
        <div className="h-1 w-full bg-neutral-800 rounded-full mb-5" />
        <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-neutral-800" />
            <div className="w-16 h-6 rounded-full bg-neutral-800" />
        </div>
        <div className="h-8 bg-neutral-800 rounded w-32 mb-2" />
        <div className="h-4 bg-neutral-800 rounded w-48 mb-4" />
        <div className="h-10 bg-neutral-800/50 rounded-lg border-2 border-dashed border-neutral-800 mb-4" />
        <div className="flex gap-2 mb-3">
            <div className="h-6 bg-neutral-800 rounded-md w-24" />
            <div className="h-6 bg-neutral-800 rounded-md w-20" />
        </div>
        <div className="h-4 bg-neutral-800 rounded w-40" />
    </div>
);

export const CouponTable: React.FC<CouponTableProps> = ({ coupons, isLoading, error, onEdit, onDelete }) => {
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCardClick = (coupon: Coupon) => {
        setSelectedCoupon(coupon);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        // Delay clearing the coupon to avoid flash while modal animates out
        setTimeout(() => setSelectedCoupon(null), 200);
    };

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-300 mb-1">Failed to load coupons</h3>
                <p className="text-neutral-500 text-sm text-center max-w-xs">{error}</p>
            </div>
        );
    }

    // Empty state (after loading)
    if (!isLoading && coupons.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-full bg-neutral-800/50 flex items-center justify-center mb-4">
                    <Ticket className="w-8 h-8 text-neutral-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-400 mb-1">No coupons yet</h3>
                <p className="text-neutral-600 text-sm text-center max-w-xs">
                    Create your first coupon to get started with promotions
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
                {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                    : coupons.map((coupon) => (
                        <CouponCard
                            key={coupon.id}
                            coupon={coupon}
                            onClick={handleCardClick}
                        />
                    ))
                }
            </div>

            <CouponDetailModal
                coupon={selectedCoupon}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        </>
    );
};
