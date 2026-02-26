import React from 'react';
import { Ticket, AlertCircle } from 'lucide-react';
import type { Coupon } from '@/types/coupon.types';
import { CouponRow } from './CouponRow';

interface CouponTableProps {
    coupons: Coupon[];
    isLoading: boolean;
    error: string | null;
}

// Skeleton row for loading state
const SkeletonRow: React.FC = () => (
    <tr className="border-b border-neutral-800 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
            <td key={i} className="px-4 py-3.5">
                <div className="h-5 bg-neutral-800 rounded w-20" />
            </td>
        ))}
    </tr>
);

const TABLE_HEADERS = ['Code', 'Type', 'Discount', 'Min Order', 'Status', 'Reason'];

export const CouponTable: React.FC<CouponTableProps> = ({ coupons, isLoading, error }) => {
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
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                    <thead>
                        <tr className="border-b border-neutral-800 bg-neutral-900/80">
                            {TABLE_HEADERS.map((header) => (
                                <th
                                    key={header}
                                    className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading
                            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                            : coupons.map((coupon) => (
                                <CouponRow key={coupon.id} coupon={coupon} />
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </div>
    );
};
