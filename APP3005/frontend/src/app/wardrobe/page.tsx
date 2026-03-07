import React from "react";
import { LuxeColors } from "../../lib/luxe-theme";
import LuxeSidebar from "../../components/common/LuxeSidebar";
import WardrobeContent from "../../components/wardrobe/WardrobeContent";
import { useAuth } from "../../context/AuthContext";
import { LayoutDashboard, Shirt, BarChart3, Settings, Ticket, Upload } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";

const WardrobePage: React.FC = () => {
    const { user } = useAuth();
    const { sidebarWidth } = useSidebar();

    const navLinks = [
        { label: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/creator-dashboard" },
        { label: "My Wardrobe", icon: <Shirt size={20} />, href: "/wardrobe" },
        { label: "Bulk Upload", icon: <Upload size={20} />, href: "/bulk-upload" },
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
                <div className="min-h-screen dashboard-gradient p-8">
                    <WardrobeContent />
                </div>
            </div>
        </div>
    );
};

export default WardrobePage;
