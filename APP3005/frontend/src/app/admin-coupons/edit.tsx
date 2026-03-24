import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from '@/components/admin/Sidebar';
import { AdminPageHeader } from '@/components/admin/coupons/AdminPageHeader';
import { CouponForm } from '@/components/admin/coupons/CouponForm';
import { useCouponForm } from '@/hooks/useCouponForm';
import { useAdminCoupons } from '@/hooks/useAdminCoupons';
import { ADMIN_COUPON_ROUTES } from '@/constants/coupon.constants';
import { useToast } from '@/hooks/use-toast';
import { useParams, useNavigate } from 'react-router-dom';

const EditCouponPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { allCoupons, isLoading: couponsLoading, updateCoupon } = useAdminCoupons();
    const { formState, errors, handleChange, validate, getPayload, setForm } = useCouponForm();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!couponsLoading) {
            const coupon = allCoupons.find(c => c.id === id);
            if (coupon) {
                setForm(coupon);
            } else {
                // If not found, redirect back
                navigate(ADMIN_COUPON_ROUTES.ADMIN_COUPONS);
            }
        }
    }, [couponsLoading, allCoupons, id, setForm, navigate]);

    const handleSubmit = async () => {
        if (!validate() || !id) return;
        setIsSubmitting(true);
        try {
            const payload = getPayload();
            await updateCoupon(id, payload);
            toast({
                title: "Coupon Updated",
                description: "The coupon details have been successfully modified.",
            });
            navigate(ADMIN_COUPON_ROUTES.ADMIN_COUPONS);
        } catch (error: any) {
            console.error('Failed to update coupon', error);
            toast({
                title: "Update Failed",
                description: error?.message || "There was an error updating the coupon.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (couponsLoading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#D4AF37] border-t-transparent"></div>
            </div>
        );
    }

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
                    <div className="px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center gap-3">
                            {/* Mobile hamburger */}
                            <button
                                className="lg:hidden p-2 rounded-lg bg-neutral-800 text-neutral-300 flex-shrink-0"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <AdminPageHeader
                                title="Edit Coupon"
                                subtitle="Modify the details of the existing coupon"
                                showBack
                                backHref={ADMIN_COUPON_ROUTES.ADMIN_COUPONS}
                            />
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 p-2 xs:p-3 sm:p-6 lg:p-8 w-full max-w-4xl">
                    <CouponForm
                        formState={formState}
                        errors={errors}
                        isSubmitting={isSubmitting}
                        onChange={handleChange}
                        onSubmit={handleSubmit}
                    />
                </div>
            </div>
        </div>
    );
};

export default EditCouponPage;
