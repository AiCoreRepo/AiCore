"use client";

import React, { useState, useEffect } from "react";
import LuxeSidebar from "@/components/common/LuxeSidebar";
import { creatorNavLinks } from "@/components/creator/creatorNavLinks";
import CategoryProductsContent from "@/components/product-groups/CategoryProductsContent";
import { useAuth } from "@/context/AuthContext";
import { Menu } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useParams } from "react-router-dom";

const CategoryProductsPage: React.FC = () => {
    const { user } = useAuth();
    const { sidebarWidth, toggleSidebar, isMobile } = useSidebar();
    const params = useParams();
    const groupId = params.id as string;

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
        <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #FFFDF5 0%, #FFFBEB 100%)' }}>
            <LuxeSidebar user={sidebarUser} navLinks={creatorNavLinks} />
            <div className="flex-1 transition-all duration-300 ease-in-out" style={{ marginLeft: sidebarWidth }}>
                <div className="min-h-screen p-4 md:p-10">
                    {isMobile && (
                        <button
                            onClick={toggleSidebar}
                            className="mb-6 p-3 text-luxury-charcoal bg-white/80 backdrop-blur-md border border-luxury-gold/20 rounded-2xl shadow-sm transition-all active:scale-95"
                            aria-label="Open menu"
                        >
                            <Menu size={24} />
                        </button>
                    )}
                    
                    <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                        {groupId && <CategoryProductsContent groupId={groupId} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryProductsPage;
