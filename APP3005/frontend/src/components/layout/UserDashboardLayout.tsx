import React, { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, MapPin, CreditCard, Settings, LogOut, User, Home, Package, Menu, X, Wallet } from 'lucide-react';
import { LogoutConfirmDialog } from '@/components/LogoutConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
    getUserDisplayName,
    getUserInitials,
    getUserProfileImageUrl,
    PROFILE_IMAGE_OBJECT_POSITION,
} from '@/lib/profile-image';

interface UserLayoutProps {
    children: ReactNode;
    hideSidebar?: boolean; // Option to hide sidebar for certain pages
}

interface MenuItem {
    id: string;
    label: string;
    icon: any;
    href: string;
}

export const UserDashboardLayout: React.FC<UserLayoutProps> = ({ children, hideSidebar = false }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [profileImageError, setProfileImageError] = useState(false);

    // Get user info from AuthContext
    const userEmail = user?.email || 'user@example.com';
    const userName = getUserDisplayName(user);
    const profileImageUrl = getUserProfileImageUrl(user);
    const userInitials = getUserInitials(user);

    useEffect(() => {
        setProfileImageError(false);
    }, [profileImageUrl]);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const menuItems: MenuItem[] = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: Home,
            href: '/user-dashboard',
        },
        {
            id: 'aura-profile',
            label: 'View Aura Profile',
            icon: User,
            href: '/aura-profile',
        },
        {
            id: 'ai-try-on',
            label: 'AI Try-On',
            icon: ShoppingBag,
            href: '/ai-try-on',
        },
        {
            id: 'my-orders',
            label: 'My Orders',
            icon: Package,
            href: '/my-orders',
        },
        {
            id: 'wallet',
            label: 'Wallet',
            icon: Wallet,
            href: '/wallet',
        },
    ];

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_email');
        setShowLogoutDialog(false);
        window.dispatchEvent(new Event('auth-refresh'));
        window.dispatchEvent(new Event('aura-updated'));

        toast({
            title: "Logged out successfully",
            description: "You have been logged out. See you soon!",
        });

        navigate('/');
    };

    return (
        <div className="min-h-screen bg-[#F5F5F0]">
            {/* Mobile Header */}
            {!hideSidebar && (
                <div className="lg:hidden bg-white border-b border-[#E0E0D8] px-4 py-3 flex items-center justify-between sticky top-0 z-50">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 -ml-2 hover:bg-[#F5F5F0] rounded-lg"
                    >
                        <Menu className="w-6 h-6 text-[#2C2416]" />
                    </button>
                    <span className="font-bold text-lg text-[#2C2416]" style={{ fontFamily: 'Playfair Display, serif' }}>
                        My Account
                    </span>
                    <div className="w-10" /> {/* Spacer for centering */}
                </div>
            )}

            {/* Sidebar Overlay for Mobile */}
            {!hideSidebar && isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            {!hideSidebar && (
                <aside className={`
                    fixed left-0 top-0 h-screen w-[260px] bg-[#EFEDE8] border-r border-[#D8D6D1] z-50 flex flex-col transition-transform duration-300 ease-in-out
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    {/* Mobile Close Button */}
                    <div className="lg:hidden absolute top-4 right-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-2 hover:bg-[#E5E3DD] rounded-full"
                        >
                            <X className="w-5 h-5 text-[#6B6B6B]" />
                        </button>
                    </div>

                    {/* User Profile Header */}
                    <div className="p-8 text-center border-b border-[#D8D6D1]">
                        <div className="relative w-24 h-24 mx-auto mb-4">
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#9C8B6C] to-[#8A7A5D] flex items-center justify-center overflow-hidden shadow-lg border-4 border-white">
                                {profileImageUrl && !profileImageError ? (
                                    <img
                                        src={profileImageUrl}
                                        alt={userName}
                                        className="w-full h-full object-cover"
                                        style={{ objectPosition: PROFILE_IMAGE_OBJECT_POSITION }}
                                        onError={() => setProfileImageError(true)}
                                    />
                                ) : (
                                    <span className="text-3xl font-bold text-white">
                                        {userInitials}
                                    </span>
                                )}
                            </div>
                            <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <h2 className="text-lg font-bold text-[#2C2416] mb-1 truncate" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                            {userName}
                        </h2>
                        <p className="text-xs text-[#6B6B6B] truncate px-2 font-medium" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                            {userEmail}
                        </p>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.href;

                            return (
                                <Link
                                    key={item.id}
                                    to={item.href}
                                    className={`
                                        flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden
                                        ${isActive
                                            ? 'bg-[#C9A55C] text-white shadow-md'
                                            : 'text-[#4A4A4A] hover:bg-[#E5E3DD] hover:text-[#2C2416]'
                                        }
                                    `}
                                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                                >
                                    <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-[#8B7355]'}`} />
                                    <span className="font-medium text-sm tracking-wide">
                                        {item.label}
                                    </span>
                                    {isActive && (
                                        <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout Button */}
                    <div className="p-4 border-t border-[#D8D6D1] bg-[#EAE8E4]">
                        <button
                            onClick={() => setShowLogoutDialog(true)}
                            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[#8B4513] hover:bg-[#E5E3DD] hover:text-red-600 transition-all duration-200 border border-transparent hover:border-[#D8D6D1]"
                            style={{ fontFamily: 'DM Sans, sans-serif' }}
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium text-sm">Log Out</span>
                        </button>
                    </div>
                </aside>
            )}

            {/* Main Content */}
            <div className={`
                flex-1 transition-all duration-300 min-h-screen
                ${!hideSidebar ? 'lg:ml-[260px]' : ''}
            `}>
                {children}
            </div>

            {/* Logout Confirmation Dialog */}
            <LogoutConfirmDialog
                isOpen={showLogoutDialog}
                onConfirm={handleLogout}
                onCancel={() => setShowLogoutDialog(false)}
            />
        </div>
    );
};
