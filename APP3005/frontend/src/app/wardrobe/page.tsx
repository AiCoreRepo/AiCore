import React from "react";
import { LuxeColors } from "../../lib/luxe-theme";
import LuxeSidebar from "../../components/common/LuxeSidebar";
import WardrobeContent from "../../components/wardrobe/WardrobeContent";
import { creatorNavLinks } from "@/components/creator/creatorNavLinks";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";

const WardrobePage: React.FC = () => {
    const { user } = useAuth();
    const { sidebarWidth, isMobile } = useSidebar();

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
        <div className="min-h-screen flex overflow-x-hidden" style={{ background: LuxeColors.background }}>
            <LuxeSidebar user={sidebarUser} navLinks={creatorNavLinks} />
            <div
                className="flex-1 dashboard-theme min-w-0 transition-all duration-300 ease-in-out"
                style={{ marginLeft: isMobile ? "0px" : sidebarWidth }}
            >
                <div className="min-h-screen dashboard-gradient px-4 py-5 sm:px-6 sm:py-6 lg:p-8">
                    <WardrobeContent />
                </div>
            </div>
        </div>
    );
};

export default WardrobePage;
