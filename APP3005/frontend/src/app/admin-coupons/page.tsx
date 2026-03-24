import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Ticket, AlertCircle, Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/admin/Sidebar';
import { AdminPageHeader } from '@/components/admin/coupons/AdminPageHeader';
import { useToast } from '@/hooks/use-toast';
import { CouponTable } from '@/components/admin/coupons/CouponTable';
import { Pagination } from '@/components/common/Pagination';
import { useAdminCoupons } from '@/hooks/useAdminCoupons';
import { ADMIN_COUPON_ROUTES } from '@/constants/coupon.constants';
import { useAdminCreatorCoupons } from '@/hooks/useAdminCreatorCoupons';

const AdminCouponsPage: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();
    const { coupons, allCoupons, isLoading, error, currentPage, totalPages, setCurrentPage, deleteCoupon } = useAdminCoupons();
    const {
        coupons: creatorCoupons,
        isLoading: isLoadingCreatorCoupons,
        error: creatorCouponsError,
        isMutating: isMutatingCreatorCoupons,
        approve: approveCreatorCoupon,
        reject: rejectCreatorCoupon,
        archive: archiveCreatorCoupon,
    } = useAdminCreatorCoupons();

    const handleEdit = (coupon: any) => {
        navigate(`/admin-coupons/edit/${coupon.id}`);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCoupon(id);
            toast({
                title: "Coupon Deleted",
                description: "The coupon has been successfully removed.",
            });
        } catch (error: any) {
            console.error('Failed to delete coupon:', error);
            toast({
                title: "Deletion Failed",
                description: error?.message || "Something went wrong while deleting the coupon.",
                variant: "destructive",
            });
        }
    };

    const handleApproveCreatorCoupon = async (id: string) => {
        try {
            await approveCreatorCoupon(id);
            toast({
                title: "Creator Coupon Approved",
                description: "The coupon has been approved and is now active.",
            });
        } catch (error: any) {
            console.error('Failed to approve creator coupon:', error);
            toast({
                title: "Approval Failed",
                description: error?.message || "Something went wrong while approving the coupon.",
                variant: "destructive",
            });
        }
    };

    const handleRejectCreatorCoupon = async (id: string) => {
        try {
            await rejectCreatorCoupon(id);
            toast({
                title: "Creator Coupon Rejected",
                description: "The coupon has been rejected.",
            });
        } catch (error: any) {
            console.error('Failed to reject creator coupon:', error);
            toast({
                title: "Rejection Failed",
                description: error?.message || "Something went wrong while rejecting the coupon.",
                variant: "destructive",
            });
        }
    };

    const handleArchiveCreatorCoupon = async (id: string) => {
        try {
            await archiveCreatorCoupon(id);
            toast({
                title: "Creator Coupon Archived",
                description: "The coupon has been archived.",
            });
        } catch (error: any) {
            console.error('Failed to archive creator coupon:', error);
            toast({
                title: "Archiving Failed",
                description: error?.message || "Something went wrong while archiving the coupon.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="flex min-h-screen bg-neutral-950 font-sans">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/70 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Desktop sidebar spacer */}
            <div className="flex-shrink-0 hidden lg:block" style={{ width: 280 }}>
                <Sidebar />
            </div>

            {/* Mobile sidebar slide-in */}
            <div
                className={`
                    fixed top-0 left-0 h-full z-50 lg:hidden w-[280px]
                    transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <Sidebar />
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0 flex flex-col min-h-screen overflow-x-hidden">
                {/* Top Bar */}
                <div className="bg-neutral-900/95 border-b border-neutral-800 sticky top-0 z-30 backdrop-blur-xl">
                    <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
                        <div className="flex items-center gap-3">
                            {/* Mobile hamburger */}
                            <button
                                className="lg:hidden p-2 rounded-lg bg-neutral-800 text-neutral-300 flex-shrink-0"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <AdminPageHeader
                                title="Coupons & Referrals"
                                count={allCoupons.length}
                                actionLabel="+ Create Coupon"
                                actionHref={ADMIN_COUPON_ROUTES.ADMIN_CREATE_COUPON}
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-3 sm:p-5 lg:p-8 space-y-5">
                    <CouponTable
                        coupons={coupons}
                        isLoading={isLoading}
                        error={error}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />

                    {/* Pagination */}
                    {!isLoading && !error && totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    )}

                    {/* Creator Coupons Section */}
                    <div className="mt-8 space-y-4">
                        <div>
                            <h2 className="text-lg sm:text-xl font-semibold text-neutral-50 flex items-center gap-2">
                                <Ticket className="w-5 h-5 text-[#D4AF37]" />
                                Creator Coupons
                            </h2>
                            <p className="text-sm text-neutral-500 mt-1">
                                Coupons created by creators and waiting for your approval.
                            </p>
                        </div>

                        {creatorCouponsError && (
                            <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-red-500/30 bg-red-500/5">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
                                    <AlertCircle className="w-7 h-7 text-red-400" />
                                </div>
                                <h3 className="text-sm font-semibold text-neutral-200 mb-1">Failed to load creator coupons</h3>
                                <p className="text-xs text-neutral-400 max-w-sm text-center">{creatorCouponsError}</p>
                            </div>
                        )}

                        {!creatorCouponsError && (
                            <div className="rounded-2xl border border-neutral-800/60 bg-neutral-900/70 p-4 sm:p-5">
                                {isLoadingCreatorCoupons ? (
                                    <div className="flex items-center justify-center py-10 gap-3 text-neutral-400 text-sm">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Loading creator coupons...</span>
                                    </div>
                                ) : creatorCoupons.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-3">
                                            <Ticket className="w-6 h-6 text-neutral-600" />
                                        </div>
                                        <h3 className="text-sm font-semibold text-neutral-300 mb-1">No creator coupons yet</h3>
                                        <p className="text-xs text-neutral-500 max-w-xs">
                                            Once creators start creating coupons, they will appear here for your review.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {creatorCoupons.map((coupon) => (
                                            <div
                                                key={coupon.creator_coupon_id}
                                                className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-3 sm:p-4 rounded-xl border border-neutral-800 bg-neutral-900/80"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                                                                {coupon.code}
                                                            </span>
                                                            <span className="text-xs text-neutral-400">
                                                                {coupon.discount_type === 'PERCENTAGE'
                                                                    ? `${coupon.discount_value}% off`
                                                                    : `₹${coupon.discount_value} off`}
                                                            </span>
                                                        </div>
                                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 uppercase tracking-wide">
                                                            Pending
                                                        </span>
                                                    </div>

                                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-neutral-400">
                                                        <span>
                                                            Creator: <span className="text-neutral-200">{coupon.creator.store_name}</span>
                                                        </span>
                                                        <span className="hidden xs:inline">•</span>
                                                        <span>
                                                            Product: <span className="text-neutral-200">{coupon.product?.title ?? 'N/A'}</span>
                                                        </span>
                                                        <span className="hidden md:inline">•</span>
                                                        <span>
                                                            Valid: {new Date(coupon.start_date).toLocaleDateString()} – {new Date(coupon.end_date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 md:flex-col md:items-end md:justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApproveCreatorCoupon(coupon.creator_coupon_id)}
                                                        disabled={isMutatingCreatorCoupons}
                                                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wide bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
                                                    >
                                                        {isMutatingCreatorCoupons ? 'Working...' : 'Approve'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRejectCreatorCoupon(coupon.creator_coupon_id)}
                                                        disabled={isMutatingCreatorCoupons}
                                                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wide bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleArchiveCreatorCoupon(coupon.creator_coupon_id)}
                                                        disabled={isMutatingCreatorCoupons}
                                                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wide bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                                    >
                                                        Archive
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminCouponsPage;
