import React, { useState, useEffect } from "react";
import LuxeSidebar from "../../components/common/LuxeSidebar";
import { creatorNavLinks } from "@/components/creator/creatorNavLinks";
import { Menu } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { getProfile } from "../../lib/api";
import BulkUploadContent from "./page";

const BulkUploadDashboard: React.FC = () => {
    const { sidebarWidth, toggleSidebar, isMobile } = useSidebar();

    const [user, setUser] = useState({
        name: "Loading...",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
        role: "Creator",
        subtitle: "",
    });

    useEffect(() => {
        const fetchProfile = async () => {
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

        fetchProfile();
    }, []);

    return (
        <div>
            <div className="min-h-screen flex overflow-x-hidden" style={{ background: 'linear-gradient(135deg, #FFF9E6 0%, #FFF4D6 25%, #FFE8B3 50%, #FFF4D6 75%, #FFF9E6 100%)', backgroundSize: '400% 400%', animation: 'gradientShift 15s ease infinite' }}>
                <style>{`@keyframes gradientShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }`}</style>
                <LuxeSidebar user={user} navLinks={creatorNavLinks} />
                <div
                    className="flex-1 dashboard-theme min-w-0 transition-all duration-300 ease-in-out"
                    style={{ marginLeft: isMobile ? "0px" : sidebarWidth }}
                >
                    <div className="min-h-screen dashboard-gradient px-4 py-5 sm:px-6 sm:py-6 lg:p-8">
                        {isMobile && (
                            <button
                                onClick={toggleSidebar}
                                className="mb-6 p-2 text-foreground hover:bg-white/10 rounded-lg transition-colors"
                                aria-label="Open menu"
                            >
                                <Menu size={24} />
                            </button>
                        )}
                        <div className="max-w-7xl mx-auto">
                            <BulkUploadContent />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkUploadDashboard;
