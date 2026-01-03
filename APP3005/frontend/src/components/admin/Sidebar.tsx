import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
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
    const { data: pendingProducts } = usePendingProducts();

    const handleMenuClick = (item: typeof menuItems[0], e: React.MouseEvent) => {
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
            <aside
                className="fixed left-0 top-0 h-screen w-[280px] bg-neutral-900 border-r border-white/10 flex flex-col"
                style={{ fontFamily: typography.fontSans }}
            >
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
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

                {/* Navigation Menu */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
                                            'w-5 h-5 transition-colors',
                                            isActive ? 'text-[#D4AF37]' : 'text-neutral-400 group-hover:text-neutral-200'
                                        )}
                                    />

                                    {/* Label */}
                                    <span
                                        className={cn(
                                            'flex-1 font-medium text-sm transition-colors',
                                            isActive ? 'text-[#D4AF37]' : 'text-neutral-300 group-hover:text-neutral-100'
                                        )}
                                    >
                                        {item.label}
                                    </span>

                                    {/* Beta Badge */}
                                    {item.isBeta && (
                                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] rounded-full border border-[#D4AF37]/30">
                                            Beta
                                        </span>
                                    )}

                                    {/* Notification Badge for Settings */}
                                    {item.id === 'settings' && pendingProducts && pendingProducts.length > 0 && (
                                        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold bg-red-500 text-white rounded-full animate-pulse">
                                            {pendingProducts.length}
                                        </span>
                                    )}
                                </motion.div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer - Logout Button */}
                <div className="p-4 border-t border-white/10">
                    <motion.button
                        onClick={() => setShowLogoutDialog(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 group"
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <LogOut className="w-5 h-5 text-red-400 transition-colors group-hover:text-red-300" />
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
