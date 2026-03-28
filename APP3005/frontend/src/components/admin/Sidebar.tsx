import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Menu, X } from 'lucide-react';
import { menuItems, colors, typography } from '@/constants/theme';
import { cn } from '@/utils/cn';
import { LogoutConfirmDialog } from '@/components/LogoutConfirmDialog';
import { usePendingProducts } from '@/hooks/useApprovals';

/**
 * Sidebar - Admin navigation with beta feature handling
 * Implements Midnight Luxury design with active state highlighting
 */
export const Sidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { data: pendingProducts } = usePendingProducts();

    const handleMenuClick = (item: typeof menuItems[0], e: React.MouseEvent) => {
        setIsMobileOpen(false); // Close sidebar on mobile when navigating
        if (item.isBeta) {
            e.preventDefault();
            alert(`🚀 Coming Soon!\n\n"${item.label}" is currently in development and will be available in the next release.`);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        navigate('/');
    };

    return (
        <>
            {/* Mobile Header (Hamburger Bar) */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-neutral-900 border-b border-white/10 flex items-center justify-between px-4 z-[40]">
                <div className="flex items-center">
                    <h1
                        className="text-xl font-bold tracking-tight"
                        style={{ fontFamily: typography.fontSerif }}
                    >
                        <span style={{ color: colors.gold }}>Ai</span>
                        <span className="text-neutral-200">Vestire</span>
                    </h1>
                </div>
                <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="p-2 -mr-2 text-neutral-400 hover:text-white transition-colors"
                >
                    {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[45] md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar Configive Container */}
            <aside
                className={cn(
                    "fixed left-0 top-0 bottom-0 h-screen w-[280px] bg-neutral-900 border-r border-white/10 flex flex-col z-[50] transition-transform duration-300 ease-in-out md:translate-x-0",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
                style={{ fontFamily: typography.fontSans }}
            >
                {/* Logo (Desktop Only) */}
                <div className="hidden md:block p-6 border-b border-white/10 flex-shrink-0">
                    <h1
                        className="text-2xl font-bold tracking-tight"
                        style={{ fontFamily: typography.fontSerif }}
                    >
                        <span style={{ color: colors.gold }}>Ai</span>
                        <span className="text-neutral-200">Vestire</span>
                    </h1>
                    <p className="text-xs text-neutral-400 mt-1 tracking-wide uppercase">
                        Admin Console
                    </p>
                </div>

                {/* Mobile Specific Header inside Drawer Layer */}
                <div className="md:hidden p-5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: typography.fontSerif }}>
                            <span style={{ color: colors.gold }}>Ai</span>
                            <span className="text-neutral-200">Vestire</span>
                        </h1>
                        <p className="text-xs text-neutral-400 mt-0.5 tracking-wide uppercase">Admin Console</p>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;

                        return (
                            <Link
                                key={item.id}
                                to={item.href}
                                onClick={(e) => handleMenuClick(item, e)}
                                className="block"
                            >
                                <motion.div
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
                                        'group relative overflow-hidden',
                                        isActive
                                            ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30'
                                            : 'hover:bg-white/5 border border-transparent'
                                    )}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {/* Active indicator */}
                                    {isActive && (
                                        <motion.div
                                            className="absolute left-0 top-0 bottom-0 w-1 bg-[#D4AF37]"
                                            layoutId="activeIndicator"
                                        />
                                    )}

                                    {/* Icon */}
                                    <Icon
                                        className={cn(
                                            'w-5 h-5 flex-shrink-0 transition-colors',
                                            isActive ? 'text-[#D4AF37]' : 'text-neutral-400 group-hover:text-neutral-200'
                                        )}
                                    />

                                    {/* Label */}
                                    <span
                                        className={cn(
                                            'flex-1 font-medium text-sm transition-colors truncate',
                                            isActive ? 'text-[#D4AF37]' : 'text-neutral-300 group-hover:text-neutral-100'
                                        )}
                                    >
                                        {item.label}
                                    </span>

                                    {/* Beta Badge */}
                                    {item.isBeta && (
                                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] rounded-full border border-[#D4AF37]/30 flex-shrink-0">
                                            Beta
                                        </span>
                                    )}

                                    {/* Notification Badge for Products */}
                                    {item.id === 'products' && pendingProducts && pendingProducts.length > 0 && (
                                        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold bg-red-500 text-white rounded-full animate-pulse flex-shrink-0">
                                            {pendingProducts.length}
                                        </span>
                                    )}
                                </motion.div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer - Logout Button */}
                <div className="p-4 border-t border-white/10 flex-shrink-0">
                    <motion.button
                        onClick={() => setShowLogoutDialog(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 group"
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0 text-red-400 transition-colors group-hover:text-red-300" />
                        <span className="flex-1 font-medium text-sm text-neutral-300 transition-colors group-hover:text-red-300 text-left">
                            Logout
                        </span>
                    </motion.button>
                </div>
            </aside>

            {/* Logout Confirmation Dialog */}
            <LogoutConfirmDialog
                isOpen={showLogoutDialog}
                onConfirm={handleLogout}
                onCancel={() => setShowLogoutDialog(false)}
            />
        </>
    );
};
