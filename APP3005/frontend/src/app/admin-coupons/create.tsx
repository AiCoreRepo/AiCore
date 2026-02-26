import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from '@/components/admin/Sidebar';
import { AdminPageHeader } from '@/components/admin/coupons/AdminPageHeader';
import { CouponForm } from '@/components/admin/coupons/CouponForm';
import { useCouponForm } from '@/hooks/useCouponForm';
import { useCreateCoupon } from '@/hooks/useCreateCoupon';
import { ADMIN_COUPON_ROUTES } from '@/constants/coupon.constants';

const CreateCouponPage: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { formState, errors, handleChange, validate, getPayload } = useCouponForm();
    const { isSubmitting, submitCoupon } = useCreateCoupon();

    const handleSubmit = async () => {
        if (!validate()) return;
        const payload = getPayload();
        await submitCoupon(payload);
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
                    fixed top-0 left-0 h-full z-50 lg:hidden
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
                                className="lg:hidden p-2 rounded-lg bg-neutral-800 text-neutral-300"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <AdminPageHeader
                                title="Create Coupon"
                                subtitle="Fill in the details to create a new coupon"
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

export default CreateCouponPage;
