import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, ShoppingBag, LogOut } from 'lucide-react';

interface ProfileDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLElement>;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ isOpen, onClose, triggerRef }) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, triggerRef]);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        window.location.href = '/';
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                ref={dropdownRef}
                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-[#E0E0D8] overflow-hidden z-50"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
                {/* Dropdown Items */}
                <Link
                    to="/profile"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F8F5] transition-colors border-b border-[#E0E0D8]"
                >
                    <User className="w-5 h-5 text-[#C9A55C]" />
                    <span className="text-[#1F1F1F] font-medium">View Aura Profile</span>
                </Link>

                <Link
                    to="/my-orders"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F8F5] transition-colors border-b border-[#E0E0D8]"
                >
                    <ShoppingBag className="w-5 h-5 text-[#C9A55C]" />
                    <span className="text-[#1F1F1F] font-medium">My Orders</span>
                </Link>

                <button
                    onClick={() => {
                        onClose();
                        setShowLogoutConfirm(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left"
                >
                    <LogOut className="w-5 h-5 text-[#D32F2F]" />
                    <span className="text-[#D32F2F] font-medium">Logout</span>
                </button>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40"
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
