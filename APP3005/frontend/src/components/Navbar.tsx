import { useState, useEffect, useRef } from "react";
import { Menu, X, ShoppingBag, User, LogOut } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getAuraStatus } from "@/lib/api";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";
import { useToast } from "@/hooks/use-toast";

const navLinks = [
    { name: "Home", href: "/", isRoute: true },
    { name: "Collection", href: "/collection", isRoute: true },
    { name: "AI Try-On", href: "/#ai-tryon", isRoute: true },
    { name: "Let AI Decide", href: "/#ai-decide", isRoute: true },
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
    const navigate = useNavigate();
    const location = useLocation();
    const menuRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

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

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('aura-updated', handleAuraUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('aura-updated', handleAuraUpdate);
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
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? "py-2" : "py-4"
                    }`}
                style={{
                    background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 70%, transparent 100%)',
                    pointerEvents: 'none'
                }}
            >
                <div className="w-full px-4 md:px-6" style={{ pointerEvents: 'auto' }}>
                    <div
                        className="relative backdrop-blur-xl rounded-full px-8 md:px-12 py-3 md:py-4 transition-all duration-500 w-full"
                        style={{
                            background: 'linear-gradient(135deg, rgba(232, 220, 200, 0.95) 0%, rgba(242, 234, 216, 0.92) 50%, rgba(232, 220, 200, 0.95) 100%)',
                            boxShadow: isScrolled
                                ? '0 8px 32px rgba(201, 165, 92, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)'
                                : '0 4px 20px rgba(201, 165, 92, 0.15), 0 1px 4px rgba(0, 0, 0, 0.05)',
                            border: '1px solid rgba(201, 165, 92, 0.3)',
                        }}
                    >
                        <div className="flex items-center justify-between">
                            {/* Logo */}
                            <a
                                href="#hero"
                                className="font-serif text-2xl md:text-3xl font-semibold text-charcoal tracking-tight transition-all duration-300 hover:scale-105"
                            >
                                <span className="text-gold">Ai</span>Vestire
                            </a>

                            {/* Desktop Navigation */}
                            <div className="hidden lg:flex items-center space-x-1">
                                {navLinks.map((link) => {
                                    const linkContent = (
                                        <>
                                            <span className="relative z-10">{link.name}</span>
                                            {/* Hover background */}
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gold/20 via-gold/30 to-gold/20 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100" />
                                            {/* Bottom border on hover */}
                                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gold group-hover:w-3/4 transition-all duration-300 rounded-full" />
                                        </>
                                    );

                                    return link.isRoute ? (
                                        <Link
                                            key={link.name}
                                            to={link.href}
                                            className="relative px-4 py-2 text-sm font-medium text-charcoal tracking-wide uppercase transition-all duration-300 group"
                                        >
                                            {linkContent}
                                        </Link>
                                    ) : (
                                        <a
                                            key={link.name}
                                            href={link.href}
                                            className="relative px-4 py-2 text-sm font-medium text-charcoal tracking-wide uppercase transition-all duration-300 group"
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
                                            className="hidden md:inline-flex items-center px-6 py-2.5 text-sm font-medium text-charcoal bg-gradient-to-r from-gold/20 to-gold/30 rounded-full border border-gold/40 transition-all duration-300 hover:shadow-lg hover:shadow-gold/30 hover:scale-105 hover:border-gold"
                                            aria-label="Join as a Creator"
                                        >
                                            Join as Creator
                                        </button>
                                    </Link>
                                )}

                                <button
                                    className="p-2.5 rounded-full bg-ivory/50 border border-gold/20 hover:bg-gold/20 hover:border-gold/40 hover:shadow-md hover:shadow-gold/20 transition-all duration-300 hover:scale-110"
                                    aria-label="Shopping cart"
                                >
                                    <ShoppingBag className="w-5 h-5 text-charcoal" />
                                </button>

                                {isLoggedIn ? (
                                    <div className="relative" ref={menuRef}>
                                        <button
                                            onClick={() => setShowUserMenu(!showUserMenu)}
                                            className="p-2.5 rounded-full bg-gradient-to-br from-gold/30 to-gold/20 border border-gold/40 hover:from-gold/40 hover:to-gold/30 hover:shadow-md hover:shadow-gold/30 transition-all duration-300 hover:scale-110"
                                            aria-label="User menu"
                                        >
                                            {hasAura && aura?.image_url ? (
                                                <img
                                                    src={aura.image_url}
                                                    alt="Aura avatar"
                                                    className="w-5 h-5 rounded-full object-cover"
                                                />
                                            ) : (
                                                <User className="w-5 h-5 text-charcoal" />
                                            )}
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
                                                            to="#ai-tryon"
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
                                            className="p-2.5 rounded-full bg-gradient-to-br from-gold/30 to-gold/20 border border-gold/40 hover:from-gold/40 hover:to-gold/30 hover:shadow-md hover:shadow-gold/30 transition-all duration-300 hover:scale-110"
                                            aria-label="Sign in"
                                        >
                                            <User className="w-5 h-5 text-charcoal" />
                                        </button>
                                    </Link>
                                )}

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
                            className={`lg:hidden overflow-hidden transition-all duration-500 ${isMobileMenuOpen ? "max-h-96 mt-4" : "max-h-0"
                                }`}
                        >
                            <div className="flex flex-col space-y-2 pt-4 border-t border-gold/20">
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
            </div>

            {/* Logout Confirmation Dialog */}
            <LogoutConfirmDialog
                isOpen={showLogoutDialog}
                onConfirm={() => {
                    localStorage.removeItem('access_token');
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
