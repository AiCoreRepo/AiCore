import { useState, useEffect, useRef } from "react";
import { Menu, X, ShoppingBag, User, LogOut, Package } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getAuraStatus } from "@/lib/api";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/utils/cn";
import { CartBadge } from "@/components/cart/CartBadge";
import { WishlistBadge } from "@/components/wishlist/WishlistBadge";
import { useProfileSidebar } from "@/context/ProfileSidebarContext";
import {
    getUserProfileImageUrl,
    PROFILE_IMAGE_OBJECT_POSITION,
} from "@/lib/profile-image";

const navLinks = [
    { name: "Home", href: "/", isRoute: true },
    { name: "Collection", href: "/collection", isRoute: true },
    { name: "AI Try-On", href: "/ai-try-on", isRoute: true },
    { name: "Let AI Decide", href: "/let-ai-decide", isRoute: true },
    { name: "Lookbook", href: "/#lookbook", isRoute: true },
    { name: "About", href: "/#about", isRoute: true },
];

export const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [hasAura, setHasAura] = useState(false);
    const [aura, setAura] = useState<any>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [profileImageError, setProfileImageError] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const menuRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const { user, logout: authLogout } = useAuth();
    const { toggleSidebar } = useProfileSidebar();
    const profileImageUrl = getUserProfileImageUrl(user, aura);

    useEffect(() => {
        setProfileImageError(false);
    }, [profileImageUrl]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Handle hash scrolling when location changes
    useEffect(() => {
        if (location.hash) {
            setTimeout(() => {
                const element = document.querySelector(location.hash);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }, [location]);

    // Check if user is logged in and has Aura
    useEffect(() => {
        const checkAuraStatus = async () => {
            const token = localStorage.getItem('access_token');
            console.log('Checking auth status, token:', token ? 'exists' : 'none');
            if (token) {
                setIsLoggedIn(true);
                try {
                    const status = await getAuraStatus();
                    console.log('Aura status:', status);
                    setHasAura(status.hasAura);
                    setAura(status.aura);
                } catch (error) {
                    console.error('Error fetching Aura status:', error);
                }
            } else {
                setIsLoggedIn(false);
                setHasAura(false);
                setAura(null);
            }
        };

        checkAuraStatus();

        // Listen for storage changes (login/logout from other tabs)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'access_token') {
                checkAuraStatus();
            }
        };

        // Listen for custom aura-updated event
        const handleAuraUpdate = () => {
            checkAuraStatus();
        };

        const handleAuthRefresh = () => {
            checkAuraStatus();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('aura-updated', handleAuraUpdate);
        window.addEventListener('auth-refresh', handleAuthRefresh);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('aura-updated', handleAuraUpdate);
            window.removeEventListener('auth-refresh', handleAuthRefresh);
        };
    }, []);

    // Click outside to close menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

    return (
        <>
            <div
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? "py-1" : "py-2"}`}
                style={{ pointerEvents: 'none' }}
            >
                <div className="w-full px-4 md:px-8 max-w-[1920px] mx-auto" style={{ pointerEvents: 'auto' }}>
                    <div
                        className={`relative backdrop-blur-xl px-6 md:px-10 py-2.5 transition-all duration-500 w-full ${isMobileMenuOpen ? 'rounded-3xl' : 'rounded-2xl'}`}
                        style={{
                            background: 'rgba(255, 255, 255, 0.9)', // Crisp White Glass
                            boxShadow: '0 8px 32px rgba(212, 175, 55, 0.1), 0 2px 8px rgba(0, 0, 0, 0.02)', // Golden Glow
                            border: '1px solid rgba(212, 175, 55, 0.25)', // The Golden Touch
                        }}
                    >
                        <div className="flex items-center justify-between">
                            {/* Logo */}
                            <a
                                href="#hero"
                                className="font-serif text-2xl md:text-3xl font-bold tracking-tight transition-transform duration-300 hover:scale-105"
                            >
                                <span className="text-[#D4AF37]">Ai</span><span className="text-[#2C2416]">Vestire</span>
                            </a>

                            {/* Desktop Navigation */}
                            <div className="hidden lg:flex items-center space-x-1">
                                {navLinks.map((link) => {
                                    const isActive = location.pathname === link.href || (location.hash && location.hash === link.href.split('#')[1]);
                                    const isHashLink = link.href.startsWith('/#');
                                    const activeLink = isHashLink
                                        ? location.hash === link.href.replace('/', '')
                                        : location.pathname === link.href;

                                    const linkContent = (
                                        <>
                                            <span className={`relative z-10 transition-colors duration-300 text-xs md:text-sm font-bold tracking-[0.1em] uppercase ${activeLink ? 'text-[#2C2416]' : 'text-[#8A8A8A] group-hover:text-[#2C2416]'}`}>
                                                {link.name}
                                            </span>

                                            {/* Active Underline Highlight */}
                                            {activeLink && (
                                                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-[#2C2416] rounded-full shadow-[0_1px_2px_rgba(44,36,22,0.2)]" />
                                            )}

                                            {/* Hover Underline (Animated) - Hidden if active */}
                                            {!activeLink && (
                                                <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#2C2416] transition-all duration-300 group-hover:w-full opacity-50" />
                                            )}
                                        </>
                                    );

                                    return link.isRoute ? (
                                        <Link
                                            key={link.name}
                                            to={link.href}
                                            className="relative px-4 py-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 group"
                                        >
                                            {linkContent}
                                        </Link>
                                    ) : (
                                        <a
                                            key={link.name}
                                            href={link.href}
                                            className="relative px-4 py-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 group"
                                        >
                                            {linkContent}
                                        </a>
                                    );
                                })}
                            </div>

                            {/* Right Icons */}
                            <div className="flex items-center space-x-2 md:space-x-3">
                                {/* Only show Join as Creator button if user is NOT logged in */}
                                {!isLoggedIn && (
                                    <Link to="/login">
                                        <button
                                            className="hidden md:inline-flex items-center px-6 py-2.5 text-sm font-medium text-[#2C2416] bg-[#D4AF37]/10 rounded-full border border-[#D4AF37]/40 transition-all duration-300 hover:shadow-lg hover:shadow-[#D4AF37]/20 hover:scale-105 hover:bg-[#D4AF37]/20"
                                            aria-label="Join as a Creator"
                                        >
                                            Join as Creator
                                        </button>
                                    </Link>
                                )}

                                {/* Myntra-Style Icon Row: Profile, Wishlist, Cart */}
                                <div className="hidden md:flex items-center gap-6">
                                    {/* Profile Icon */}
                                    {isLoggedIn ? (
                                        <div className="relative" ref={menuRef}>
                                            <button
                                                onClick={() => navigate('/user-dashboard')}
                                                className="flex flex-col items-center gap-0.5 transition-all duration-300 hover:scale-105 group"
                                                aria-label="Profile"
                                            >
                                                {profileImageUrl && !profileImageError ? (
                                                    <img
                                                        src={profileImageUrl}
                                                        alt="Profile avatar"
                                                        className="w-5 h-5 rounded-full object-cover"
                                                        style={{ objectPosition: PROFILE_IMAGE_OBJECT_POSITION }}
                                                        onError={() => setProfileImageError(true)}
                                                    />
                                                ) : (
                                                    <User className="w-5 h-5 text-[#6B5D4F] group-hover:text-[#D4AF37] transition-colors" />
                                                )}
                                                <span className="text-[10px] font-medium text-[#6B5D4F] group-hover:text-[#D4AF37]">Profile</span>
                                            </button>

                                            {/* User Menu Dropdown */}
                                            {showUserMenu && (
                                                <div className="absolute right-0 mt-3 w-64 bg-gradient-to-br from-ivory via-[#f2ead8] to-ivory rounded-2xl shadow-2xl shadow-gold/30 border-2 border-gold/30 py-3 z-50 backdrop-blur-sm">
                                                    {hasAura ? (
                                                        <>
                                                            <Link
                                                                to="/aura-profile"
                                                                className="flex items-center gap-3 px-5 py-3 text-charcoal hover:bg-gradient-to-r hover:from-gold/20 hover:to-gold/10 transition-all duration-300 font-medium group"
                                                                onClick={() => setShowUserMenu(false)}
                                                            >
                                                                <User className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
                                                                <span>View Aura Profile</span>
                                                            </Link>
                                                            <Link
                                                                to="/ai-try-on"
                                                                className="flex items-center gap-3 px-5 py-3 text-charcoal hover:bg-gradient-to-r hover:from-gold/20 hover:to-gold/10 transition-all duration-300 font-medium group"
                                                                onClick={() => setShowUserMenu(false)}
                                                            >
                                                                <ShoppingBag className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
                                                                <span>AI Try-On</span>
                                                            </Link>
                                                            <div className="border-t border-gold/30 my-2 mx-3"></div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Link
                                                                to="/aura-dashboard"
                                                                className="flex items-center gap-3 px-5 py-3 text-charcoal hover:bg-gradient-to-r hover:from-gold/20 hover:to-gold/10 transition-all duration-300 font-medium group"
                                                                onClick={() => setShowUserMenu(false)}
                                                            >
                                                                <User className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
                                                                <span>Create Your Aura</span>
                                                            </Link>
                                                            <div className="border-t border-gold/30 my-2 mx-3"></div>
                                                        </>
                                                    )}
                                                    <div className="border-t border-gold/30 my-2 mx-3"></div>
                                                    <Link
                                                        to="/my-orders"
                                                        className="flex items-center gap-3 px-5 py-3 text-charcoal hover:bg-gradient-to-r hover:from-gold/20 hover:to-gold/10 transition-all duration-300 font-medium group"
                                                        onClick={() => setShowUserMenu(false)}
                                                    >
                                                        <Package className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
                                                        <span>My Orders</span>
                                                    </Link>
                                                    <div className="border-t border-gold/30 my-2 mx-3"></div>
                                                    <button
                                                        onClick={() => {
                                                            setShowUserMenu(false);
                                                            setShowLogoutDialog(true);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-5 py-3 text-charcoal hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 transition-all duration-300 font-medium group rounded-b-xl"
                                                    >
                                                        <LogOut className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
                                                        <span className="group-hover:text-red-700">Logout</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <Link to="/user-login">
                                            <button
                                                className="flex flex-col items-center gap-0.5 transition-all duration-300 hover:scale-105 group"
                                                aria-label="Sign in"
                                            >
                                                <User className="w-5 h-5 text-[#6B5D4F] group-hover:text-[#D4AF37] transition-colors" />
                                                <span className="text-[10px] font-medium text-[#6B5D4F] group-hover:text-[#D4AF37]">Profile</span>
                                            </button>
                                        </Link>
                                    )}

                                    {/* Wishlist Icon */}
                                    <WishlistBadge onClick={() => navigate('/wishlist')} showLabel />

                                    {/* Cart Icon */}
                                    <CartBadge onClick={() => navigate('/cart')} showLabel />
                                </div>

                                {/* Mobile Menu Button */}
                                <button
                                    className="lg:hidden p-2.5 rounded-full bg-ivory/50 border border-gold/20 hover:bg-gold/20 hover:border-gold/40 transition-all duration-300"
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    aria-label="Toggle menu"
                                >
                                    {isMobileMenuOpen ? (
                                        <X className="w-6 h-6 text-charcoal" />
                                    ) : (
                                        <Menu className="w-6 h-6 text-charcoal" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Mobile Menu */}
                        <div
                            className={`lg:hidden overflow-y-auto transition-all duration-500 scr ${isMobileMenuOpen ? "max-h-[85vh] mt-4 opacity-100" : "max-h-0 opacity-0 bg-transparent"
                                }`}
                        >
                            <div className="flex flex-col space-y-2 pt-4 pb-6 border-t border-gold/20">
                                {navLinks.map((link) =>
                                    link.isRoute ? (
                                        <Link
                                            key={link.name}
                                            to={link.href}
                                            className="px-4 py-3 text-charcoal font-medium tracking-wide rounded-2xl hover:bg-gold/20 transition-all duration-300 border border-transparent hover:border-gold/30"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            {link.name}
                                        </Link>
                                    ) : (
                                        <a
                                            key={link.name}
                                            href={link.href}
                                            className="px-4 py-3 text-charcoal font-medium tracking-wide rounded-2xl hover:bg-gold/20 transition-all duration-300 border border-transparent hover:border-gold/30"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            {link.name}
                                        </a>
                                    )
                                )}

                                {/* Common Mobile Links (Cart, Wishlist) */}
                                <div className="border-t border-gold/20 my-2 mx-4"></div>
                                <Link
                                    to="/cart"
                                    className="px-4 py-3 text-charcoal font-medium tracking-wide rounded-2xl hover:bg-gold/20 transition-all duration-300 border border-transparent hover:border-gold/30 block"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Cart
                                </Link>
                                <Link
                                    to="/wishlist"
                                    className="px-4 py-3 text-charcoal font-medium tracking-wide rounded-2xl hover:bg-gold/20 transition-all duration-300 border border-transparent hover:border-gold/30 block"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Wishlist
                                </Link>

                                {/* Logged In User Specific Links */}
                                {isLoggedIn && (
                                    <>
                                        <div className="border-t border-gold/20 my-2 mx-4"></div>
                                        <Link
                                            to="/my-orders"
                                            className="px-4 py-3 text-charcoal font-medium tracking-wide rounded-2xl hover:bg-gold/20 transition-all duration-300 border border-transparent hover:border-gold/30 block"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            My Orders
                                        </Link>
                                        {hasAura ? (
                                            <Link
                                                to="/aura-profile"
                                                className="px-4 py-3 text-charcoal font-medium tracking-wide rounded-2xl hover:bg-gold/20 transition-all duration-300 border border-transparent hover:border-gold/30 block"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                Aura Profile
                                            </Link>
                                        ) : (
                                            <Link
                                                to="/aura-dashboard"
                                                className="px-4 py-3 text-charcoal font-medium tracking-wide rounded-2xl hover:bg-gold/20 transition-all duration-300 border border-transparent hover:border-gold/30 block"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                Create Aura
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                setShowLogoutDialog(true);
                                            }}
                                            className="w-full text-left px-4 py-3 text-red-600 font-medium tracking-wide rounded-2xl hover:bg-red-50 transition-all duration-300 border border-transparent"
                                        >
                                            Logout
                                        </button>
                                    </>
                                )}

                                {/* Login/Signup button for non-logged-in users */}
                                {!isLoggedIn && (
                                    <Link
                                        to="/user-login"
                                        className="px-4 py-3 text-center text-white font-medium tracking-wide rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B8941F] border border-[#D4AF37] hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all duration-300"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Login / Sign Up
                                    </Link>
                                )}
                                {/* Only show Join as Creator button if user is NOT logged in */}
                                {!isLoggedIn && (
                                    <Link
                                        to="/login"
                                        className="px-4 py-3 text-center text-charcoal font-medium tracking-wide rounded-2xl bg-gradient-to-r from-gold/20 to-gold/30 border border-gold/40 hover:shadow-md transition-all duration-300"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Join as Creator
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div >

            {/* Logout Confirmation Dialog */}
            < LogoutConfirmDialog
                isOpen={showLogoutDialog}
                onConfirm={() => {
                    // Use centralized logout function from AuthContext
                    authLogout();
                    setIsLoggedIn(false);
                    setHasAura(false);
                    setAura(null);
                    setShowLogoutDialog(false);

                    // Show success toast
                    toast({
                        title: "Logged out successfully",
                        description: "You have been logged out. See you soon!",
                    });

                    navigate('/');
                }}
                onCancel={() => setShowLogoutDialog(false)}
            />
        </>
    );
};
