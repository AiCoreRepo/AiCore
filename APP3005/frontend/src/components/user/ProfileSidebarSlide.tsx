import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, User, ShoppingBag, Package, LogOut } from 'lucide-react';
import { useProfileSidebar } from '@/context/ProfileSidebarContext';

interface MenuItem {
    id: string;
    label: string;
    icon: any;
    href: string;
    iconColor?: string;
}

export const ProfileSidebarSlide: React.FC = () => {
    const { isOpen, closeSidebar } = useProfileSidebar();
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const menuItems: MenuItem[] = [
        {
            id: 'aura-profile',
            label: 'View Aura Profile',
            icon: User,
            href: '/aura-profile',
            iconColor: '#C9A55C',
        },
        {
            id: 'ai-try-on',
            label: 'AI Try-On',
            icon: ShoppingBag,
            href: '/ai-try-on',
            iconColor: '#C9A55C',
        },
        {
            id: 'my-orders',
            label: 'My Orders',
            icon: Package,
            href: '/my-orders',
            iconColor: '#C9A55C',
        },
    ];

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        closeSidebar();
        navigate('/');
    };

    const handleMenuClick = (href: string) => {
        closeSidebar();
        navigate(href);
    };

    // Prevent body scroll when sidebar is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/40 z-50 transition-opacity duration-300"
                onClick={closeSidebar}
            />

            {/* Sidebar */}
            <div
                className="fixed right-0 top-0 h-full w-80 bg-[#F8F5F0] shadow-2xl z-50 transform transition-transform duration-300 ease-out"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
                {/* Close Button */}
                <button
                    onClick={closeSidebar}
                    className="absolute top-4 right-4 p-2 hover:bg-[#E8E5E0] rounded-full transition-colors"
                    aria-label="Close sidebar"
                >
                    <X className="w-5 h-5 text-[#4A4A4A]" />
                </button>

                {/* Menu Items */}
                <div className="pt-16 px-6">
                    <nav className="space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleMenuClick(item.href)}
                                    className="w-full flex items-center gap-3 px-4 py-4 text-[#1F1F1F] hover:bg-white rounded-lg transition-all duration-200 group border-b border-[#E8E5E0] last:border-0"
                                >
                                    <Icon
                                        className="w-5 h-5 transition-transform group-hover:scale-110"
                                        style={{ color: item.iconColor }}
                                    />
                                    <span className="font-medium text-[15px]">
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}

                        {/* Logout Option */}
                        <div className="pt-4 mt-4 border-t border-[#E8E5E0]">
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="w-full flex items-center gap-3 px-4 py-4 text-[#D32F2F] hover:bg-red-50 rounded-lg transition-all duration-200 group"
                            >
                                <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
                                <span className="font-medium text-[15px]">
                                    Logout
                                </span>
                            </button>
                        </div>
                    </nav>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setShowLogoutConfirm(false)}
                    />
                    <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-[#1F1F1F] mb-2">
                            Logout Confirmation
                        </h3>
                        <p className="text-[#666666] mb-6">
                            Are you sure you want to logout from your account?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleLogout}
                                className="flex-1 px-4 py-3 bg-[#D32F2F] text-white rounded-lg font-semibold hover:bg-[#C62828] transition-colors"
                            >
                                Yes, Logout
                            </button>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 px-4 py-3 bg-[#F5F5F5] text-[#4A4A4A] rounded-lg font-semibold hover:bg-[#E0E0E0] transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
