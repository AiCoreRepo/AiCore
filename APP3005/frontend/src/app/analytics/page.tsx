import React from "react";
import { LuxeColors } from "../../lib/luxe-theme";
import LuxeSidebar from "../../components/common/LuxeSidebar";
import { useAuth } from "../../context/AuthContext";
import { BarChart3, Sparkles } from "lucide-react";
import { LayoutDashboard, Shirt, Settings, Upload, Ticket, FolderTree } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";

const AnalyticsPage: React.FC = () => {
    const { user } = useAuth();
    const { sidebarWidth } = useSidebar();

    const navLinks = [
        { label: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/creator-dashboard" },
        { label: "My Wardrobe", icon: <Shirt size={20} />, href: "/wardrobe" },
        { label: "My Coupons", icon: <Ticket size={20} />, href: "/creator-coupons" },
        { label: "Analytics", icon: <BarChart3 size={20} />, href: "/analytics" },
        { label: "Settings", icon: <Settings size={20} />, href: "/settings" },
    ];

    // Fallback user data
    const sidebarUser = user ? {
        name: user.store_name || "Creator",
        avatar: (user as any).avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
        role: user.role || "Creator",
    } : {
        name: "Loading...",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
        role: "Creator",
    };

    return (
        <div className="min-h-screen flex" style={{ background: LuxeColors.background }}>
            <LuxeSidebar user={sidebarUser} navLinks={navLinks} />
            <div className="flex-1 dashboard-theme transition-all duration-300 ease-in-out" style={{ marginLeft: sidebarWidth }}>
                <div className="min-h-screen dashboard-gradient flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">

                    {/* Decorative Background Elements */}
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-luxury-gold/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-luxury-gold/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 max-w-lg mx-auto">
                        <div className="mb-8 flex justify-center">
                            <div className="p-6 bg-stone-900/50 rounded-full border border-luxury-gold/20 shadow-[0_0_30px_-5px_rgba(212,175,55,0.2)]">
                                <BarChart3 size={64} className="text-luxury-gold" />
                            </div>
                        </div>

                        <h1 className="font-serif text-5xl font-bold text-luxury-black mb-4">
                            Analytics
                        </h1>

                        <div className="flex items-center justify-center gap-3 mb-8">
                            <span className="h-px w-12 bg-luxury-gold/50"></span>
                            <span className="px-4 py-1.5 bg-luxury-gold/10 border border-luxury-gold/30 rounded-full text-luxury-gold text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                                <Sparkles size={12} />
                                Coming Soon • Beta
                            </span>
                            <span className="h-px w-12 bg-luxury-gold/50"></span>
                        </div>

                        <p className="text-stone-500 text-lg leading-relaxed max-w-md mx-auto">
                            We are crafting a powerful analytics suite to help you understand your audience and optimize your collection. Stay tuned for deep insights.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
