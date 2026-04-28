import React, { useState, useEffect } from "react";
import { LuxeColors } from "../../lib/luxe-theme";
import LuxeSidebar from "../../components/common/LuxeSidebar";
import { getProfile } from "../../lib/api";
import { useSidebar } from "@/context/SidebarContext";
import { LayoutDashboard, Shirt, BarChart3, Settings, Menu, Upload, Ticket, FolderTree } from "lucide-react";

import { CreatorCouponList } from "../../components/creator/coupons/CreatorCouponList";
import { CreatorCouponForm } from "../../components/creator/coupons/CreatorCouponForm";

const CreatorCouponsPage: React.FC = () => {
    const { sidebarWidth, toggleSidebar, isMobile } = useSidebar();
    const [view, setView] = useState<'LIST' | 'CREATE'>('LIST');
    const [editingCoupon, setEditingCoupon] = useState<any>(null);

    const [user, setUser] = useState({
        name: "Loading...",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
        role: "Creator",
        subtitle: "",
    });

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const profile = await getProfile();
                setUser({
                    name: profile.name || profile.store_name || "Creator",
                    avatar: profile.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
                    role: profile.role || "Creator",
                    subtitle: profile.subtitle || "",
                });
            } catch (err) {
                console.error("Failed to fetch profile", err);
            }
        };
        fetchProfileData();
    }, []);

    const navLinks = [
        { label: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/creator-dashboard" },
        { label: "My Wardrobe", icon: <Shirt size={20} />, href: "/wardrobe" },
        { label: "My Coupons", icon: <Ticket size={20} />, href: "/creator-coupons", active: true },
        { label: "Analytics", icon: <BarChart3 size={20} />, href: "/analytics" },
        { label: "Settings", icon: <Settings size={20} />, href: "/settings" },
    ];

    return (
        <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #FFF9E6 0%, #FFF4D6 25%, #FFE8B3 50%, #FFF4D6 75%, #FFF9E6 100%)', backgroundSize: '400% 400%', animation: 'gradientShift 15s ease infinite' }}>
            <LuxeSidebar user={user} navLinks={navLinks} />
            <div className="flex-1 dashboard-theme transition-all duration-300 ease-in-out" style={{ marginLeft: sidebarWidth }}>
                <div className="min-h-screen dashboard-gradient p-4 md:p-8">
                    {isMobile && (
                        <button
                            onClick={toggleSidebar}
                            className="mb-6 p-2 text-foreground hover:bg-white/10 rounded-lg transition-colors"
                            aria-label="Open menu"
                        >
                            <Menu size={24} />
                        </button>
                    )}
                    <div className="max-w-5xl mx-auto space-y-8">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#212121] text-white p-6 md:p-8 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mx-20 -my-20 pointer-events-none" />
                            <div className="relative z-10 space-y-2">
                                <h1 className="text-3xl md:text-3xl font-bold tracking-tight">
                                    Creator <span className="text-emerald-400">Coupons</span>
                                </h1>
                                <p className="text-white/60 max-w-xl text-sm leading-relaxed">
                                    Drive sales by offering exclusive discounts on your products. Create coupons, track their approval status, and manage active promotions.
                                </p>
                            </div>
                            <div className="relative z-10 flex w-full md:w-auto mt-4 md:mt-0 gap-3">
                                {view === 'LIST' ? (
                                    <button
                                        onClick={() => {
                                            setEditingCoupon(null);
                                            setView('CREATE');
                                        }}
                                        className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                                    >
                                        + Create Coupon
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setView('LIST')}
                                        className="w-full md:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium border border-white/5 transition-all whitespace-nowrap"
                                    >
                                        Back to List
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="bg-[#262626] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative">
                            {view === 'LIST' ? (
                                <CreatorCouponList onEdit={(coupon) => {
                                    setEditingCoupon(coupon);
                                    setView('CREATE');
                                }} />
                            ) : (
                                <div className="max-w-3xl mx-auto">
                                    <div className="mb-6 pb-6 border-b border-white/10">
                                        <h2 className="text-xl font-bold text-white mb-1">
                                            {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                                        </h2>
                                        <p className="text-white/50 text-sm">Configure your discount and submit it for admin approval.</p>
                                    </div>
                                    <CreatorCouponForm
                                        initialData={editingCoupon}
                                        onSuccess={() => {
                                            setEditingCoupon(null);
                                            setView('LIST');
                                        }}
                                        onCancel={() => {
                                            setEditingCoupon(null);
                                            setView('LIST');
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatorCouponsPage;
