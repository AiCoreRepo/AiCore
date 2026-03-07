import React, { useEffect, useState } from 'react';
import { getMyCreatorCouponsApi, deleteCreatorCouponApi, CreatorCoupon } from '../../../api/creator-coupons.api';
import { toast } from 'sonner';
import { IndianRupee, Percent, Package, Clock, Archive, Trash2, ShieldCheck, ShieldAlert, Edit } from 'lucide-react';
import { format } from 'date-fns';

interface CreatorCouponListProps {
    onEdit?: (coupon: CreatorCoupon) => void;
}

export const CreatorCouponList: React.FC<CreatorCouponListProps> = ({ onEdit }) => {
    const [coupons, setCoupons] = useState<CreatorCoupon[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const data = await getMyCreatorCouponsApi();
            setCoupons(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch coupons');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleDelete = async (couponId: string) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;

        try {
            await deleteCreatorCouponApi(couponId);
            toast.success('Coupon deleted');
            fetchCoupons(); // refresh list
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete coupon');
        }
    };

    if (loading) {
        return <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/5 rounded-2xl w-full"></div>)}
        </div>;
    }

    if (coupons.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-white/5 rounded-2xl">
                <TicketIcon className="w-16 h-16 text-white/20 mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No Coupons Yet</h3>
                <p className="text-white/50 text-center max-w-sm">
                    Create product-specific coupons to offer discounts to your customers. All coupons require admin approval.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {coupons.map((coupon) => (
                <div key={coupon.creator_coupon_id} className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-white/20 transition-all">

                    {/* Status Badge */}
                    <div className="absolute top-5 right-5 flex items-center gap-2">
                        {coupon.approval_status === 'APPROVED' && (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                                <ShieldCheck size={14} /> Approved
                            </span>
                        )}
                        {coupon.approval_status === 'PENDING' && (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-medium border border-yellow-500/20">
                                <Clock size={14} /> Pending Approval
                            </span>
                        )}
                        {coupon.approval_status === 'REJECTED' && (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">
                                <ShieldAlert size={14} /> Rejected
                            </span>
                        )}
                        {coupon.approval_status === 'ARCHIVED' && (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-500/10 text-neutral-400 text-xs font-medium border border-neutral-500/20">
                                <Archive size={14} /> Archived
                            </span>
                        )}

                        {(coupon.approval_status === 'PENDING' || coupon.approval_status === 'REJECTED') && onEdit && (
                            <button
                                onClick={() => onEdit(coupon)}
                                className="p-1.5 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors ml-2 opacity-0 group-hover:opacity-100"
                                title="Edit Coupon"
                            >
                                <Edit size={16} />
                            </button>
                        )}

                        <button
                            onClick={() => handleDelete(coupon.creator_coupon_id)}
                            className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors ml-2 opacity-0 group-hover:opacity-100"
                            title="Delete Coupon"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div className="flex gap-4">
                        {/* Product Image Thumbnail */}
                        <div className="w-16 h-16 rounded-xl bg-white/10 overflow-hidden shrink-0 hidden sm:block">
                            {coupon.product.images[0] ? (
                                <img src={coupon.product.images[0].image_url} alt={coupon.product.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Package size={24} className="text-white/20" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-3">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span className="bg-purple-500/20 text-purple-400 px-2.5 py-1 rounded-md text-sm font-mono tracking-wider border border-purple-500/30">
                                        {coupon.code}
                                    </span>
                                    {coupon.title}
                                </h3>
                                <div className="text-sm text-white/50 flex items-center gap-2 mt-1">
                                    <Package size={14} /> For: {coupon.product.title}
                                </div>
                            </div>

                            {coupon.description && (
                                <p className="text-sm text-white/60">{coupon.description}</p>
                            )}

                            {/* Rejection Note */}
                            {coupon.approval_status === 'REJECTED' && coupon.approval_note && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-200">
                                    <span className="font-semibold text-red-400">Admin Note:</span> {coupon.approval_note}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-4 pt-2 text-sm">
                                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                                    {coupon.discount_type === 'FLAT' ? <IndianRupee size={16} /> : <Percent size={16} />}
                                    {coupon.discount_type === 'FLAT' ? coupon.discount_value : `${coupon.discount_value}% OFF`}
                                </div>

                                <div className="flex items-center gap-1.5 text-white/60">
                                    <span className="w-1 h-1 rounded-full bg-white/20 mx-1 block"></span>
                                    Min Order: ₹{coupon.min_order_amount}
                                </div>

                                <div className="flex items-center gap-1.5 text-white/60">
                                    <span className="w-1 h-1 rounded-full bg-white/20 mx-1 block"></span>
                                    Valid: {format(new Date(coupon.start_date), 'MMM dd')} - {format(new Date(coupon.end_date), 'MMM dd, yyyy')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Simple ticket icon for empty state
function TicketIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M13 5v2" />
            <path d="M13 17v2" />
            <path d="M13 11v2" />
        </svg>
    )
}
