import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Package, LogOut, Sparkles } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface MenuItem {
    id: string;
    label: string;
    icon: any;
    href: string;
}

export const UserProfileSidebar: React.FC = () => {
    const location = useLocation();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [auraImageUrl, setAuraImageUrl] = useState<string | null>(null);
    const [auraLoading, setAuraLoading] = useState(true);
    const [imgError, setImgError] = useState(false);

    const userEmail = localStorage.getItem('user_email') || 'user@example.com';
    const userName = localStorage.getItem('user_name') || userEmail.split('@')[0];

    // ── Fetch aura photo on mount ────────────────────────────────────────────
    useEffect(() => {
        const fetchAura = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) return;

                const res = await fetch(`${API_BASE}/aura`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    const data = await res.json();
                    // Only use the image if aura is ready
                    if (data?.status === 'READY' && (data?.model_url || data?.image_url)) {
                        setAuraImageUrl(data.model_url || data.image_url);
                    }
                }
            } catch {
                // silently ignore — fallback to default avatar
            } finally {
                setAuraLoading(false);
            }
        };

        fetchAura();
    }, []);

    const menuItems: MenuItem[] = [
        { id: 'aura-profile', label: 'View Aura Profile', icon: User, href: '/aura-profile' },
        { id: 'ai-try-on', label: 'AI Try-On', icon: ShoppingBag, href: '/ai-try-on' },
        { id: 'my-orders', label: 'My Orders', icon: Package, href: '/my-orders' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        window.location.href = '/';
    };

    // ── Avatar content ───────────────────────────────────────────────────────
    const hasAuraPhoto = auraImageUrl && !imgError;

    return (
        <>
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-screen w-[240px] bg-[#F5F5F0] border-r border-[#E0E0D8] z-40 flex flex-col">

                {/* User Profile Header */}
                <div className="p-6 text-center border-b border-[#E0E0D8]">

                    {/* Avatar ring — golden glow when aura photo present */}
                    <div className="relative w-20 h-20 mx-auto mb-3">
                        <div
                            className={`
                                w-20 h-20 rounded-full flex items-center justify-center overflow-hidden
                                transition-all duration-500
                                ${hasAuraPhoto
                                    ? 'ring-4 ring-[#C9A55C] ring-offset-2 ring-offset-[#F5F5F0] shadow-lg shadow-[#C9A55C]/30'
                                    : 'bg-gradient-to-br from-[#C9A55C] to-[#B8944F]'
                                }
                            `}
                        >
                            {auraLoading ? (
                                // Shimmer while loading
                                <div className="w-full h-full bg-gradient-to-br from-[#D4BD7A] to-[#C9A55C] animate-pulse" />
                            ) : hasAuraPhoto ? (
                                <img
                                    src={auraImageUrl!}
                                    alt="Aura profile"
                                    className="w-full h-full object-cover"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <User className="w-10 h-10 text-white" />
                            )}
                        </div>

                        {/* Sparkle badge if aura is active */}
                        {hasAuraPhoto && (
                            <span
                                title="Aura active"
                                className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#C9A55C] border-2 border-[#F5F5F0] flex items-center justify-center"
                            >
                                <Sparkles className="w-2.5 h-2.5 text-white" />
                            </span>
                        )}

                        {/* Green online dot (no aura) */}
                        {!hasAuraPhoto && !auraLoading && (
                            <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-[#F5F5F0]" />
                        )}
                    </div>

                    <h2 className="text-base font-bold text-[#1F1F1F] mb-1">{userName}</h2>
                    <p className="text-xs text-[#666666] truncate px-2">{userEmail}</p>

                    {hasAuraPhoto && (
                        <p className="text-[10px] font-semibold text-[#C9A55C] mt-1 tracking-widest uppercase">
                            ✦ Aura Active
                        </p>
                    )}
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;

                        return (
                            <Link
                                key={item.id}
                                to={item.href}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                                    ${isActive
                                        ? 'bg-[#C9A55C] text-white shadow-md'
                                        : 'text-[#4A4A4A] hover:bg-[#E8E8E0]'
                                    }
                                `}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium text-sm">{item.label}</span>
                                {/* Active dot */}
                                {isActive && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-[#E0E0D8]">
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#D32F2F] hover:bg-red-50 transition-all duration-200"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium text-sm">Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowLogoutConfirm(false)}
                    />
                    <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-[#1F1F1F] mb-2">Logout Confirmation</h3>
                        <p className="text-[#666666] mb-6">Are you sure you want to logout from your account?</p>
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
