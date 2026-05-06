import { useState, useEffect, useRef } from "react";
import { Menu, X, ShoppingBag, User, LogOut, Package, Sparkles } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getAuraStatus } from "@/lib/api";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { CartBadge } from "@/components/cart/CartBadge";
import { WishlistBadge } from "@/components/wishlist/WishlistBadge";
import { useProfileSidebar } from "@/context/ProfileSidebarContext";

const navLinks = [
    { name: "Home", href: "/", isRoute: true },
    { name: "Collection", href: "/collection", isRoute: true },
    { name: "AI Try-On", href: "/ai-try-on", isRoute: true },
    { name: "Let AI Decide", href: "/let-ai-decide", isRoute: true },
    { name: "Upcoming", href: "/upcoming", isRoute: true },
    { name: "About", href: "/about", isRoute: true },
];

export const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [hasAura, setHasAura] = useState(false);
    const [aura, setAura] = useState<any>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [avatarImgError, setAvatarImgError] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const menuRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const { user, logout: authLogout } = useAuth();
    const { toggleSidebar } = useProfileSidebar();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 30);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (location.hash) {
            setTimeout(() => {
                const el = document.querySelector(location.hash);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        }
    }, [location]);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname, location.hash]);

    useEffect(() => {
        const checkAura = async () => {
            const token = localStorage.getItem("access_token");
            if (token) {
                setIsLoggedIn(true);
                try {
                    const status = await getAuraStatus();
                    setHasAura(status.hasAura);
                    setAura(status.aura);
                    setAvatarImgError(false);
                } catch {}
            } else {
                setIsLoggedIn(false);
                setHasAura(false);
                setAura(null);
            }
        };
        checkAura();
        const onStorage = (e: StorageEvent) => { if (e.key === "access_token") checkAura(); };
        const onAura = () => checkAura();
        window.addEventListener("storage", onStorage);
        window.addEventListener("aura-updated", onAura);
        return () => {
            window.removeEventListener("storage", onStorage);
            window.removeEventListener("aura-updated", onAura);
        };
    }, []);

    useEffect(() => {
        const handleOut = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
        };
        if (showUserMenu) document.addEventListener("mousedown", handleOut);
        return () => document.removeEventListener("mousedown", handleOut);
    }, [showUserMenu]);

    useEffect(() => {
        if (!isMobileMenuOpen) {
            document.body.style.overflow = "";
            return;
        }

        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isMobileMenuOpen]);

    const isActive = (href: string) =>
        href === "/" ? location.pathname === "/" : location.pathname === href;

    return (
        <>
            {/* ── NAVBAR ── */}
            <header
                data-gsap="nav-shell"
                className="fixed top-0 inset-x-0 z-50 transition-all duration-500 border-b"
                style={{
                    background: isScrolled
                        ? "rgba(0, 0, 0, 0.95)"
                        : "rgba(0, 0, 0, 0.65)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    borderColor: isScrolled ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.05)",
                }}
            >
                <div className="w-full px-4 py-4 transition-all duration-500 sm:px-6 sm:py-5 md:px-12" style={{ paddingBottom: isScrolled ? "0.95rem" : "1.1rem", paddingTop: isScrolled ? "0.95rem" : "1.1rem" }}>
                    <div className="flex items-center justify-between">
                        {/* ── LOGO ── */}
                        <Link
                            to="/"
                            data-gsap="nav-brand"
                            className="flex items-baseline group flex-shrink-0"
                        >
                            <span
                                className="font-serif font-bold tracking-[0.05em] transition-all duration-300 group-hover:opacity-90"
                                style={{
                                    fontSize: "clamp(1.2rem, 4vw, 1.45rem)",
                                    background: "linear-gradient(135deg, hsl(44 78% 68%), hsl(40 62% 52%))",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                }}
                            >
                                Ai
                            </span>
                            <span
                                className="font-serif font-bold tracking-[0.05em] transition-all duration-300"
                                style={{ fontSize: "clamp(1.2rem, 4vw, 1.45rem)", color: "rgba(255,255,255,0.92)" }}
                            >
                                Vestire
                            </span>
                        </Link>

                        {/* ── DESKTOP NAV ── */}
                        <nav data-gsap="nav-links" className="hidden lg:flex items-center gap-6">
                            {navLinks.map((link) => {
                                const active = isActive(link.href);
                                return link.isRoute ? (
                                    <Link
                                        key={link.name}
                                        to={link.href}
                                        data-gsap="nav-link"
                                        className="relative px-3 py-2 group transition-all duration-300"
                                        style={{
                                            fontSize: "12px",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.25em",
                                            fontWeight: 500,
                                            color: active
                                                ? "hsl(44 78% 68%)"
                                                : "rgba(255,255,255,0.6)",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,1)";
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)";
                                        }}
                                    >
                                        {link.name}
                                        {/* Hover/Active underline */}
                                        <span
                                            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1px] bg-[#D4AF37] transition-all duration-300"
                                            style={{
                                                width: active ? "100%" : "0%",
                                                opacity: active ? 1 : 0.5,
                                            }}
                                        />
                                        <style>{`
                                            .group:hover span {
                                                width: 100% !important;
                                                opacity: 1 !important;
                                            }
                                        `}</style>
                                    </Link>
                                ) : (
                                    <a
                                        key={link.name}
                                        href={link.href}
                                        data-gsap="nav-link"
                                        className="relative px-3 py-2 group transition-all duration-300"
                                        style={{
                                            fontSize: "12px",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.25em",
                                            fontWeight: 500,
                                            color: "rgba(255,255,255,0.6)",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,1)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
                                    >
                                        {link.name}
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1px] w-0 group-hover:w-full transition-all duration-300 bg-[#D4AF37]" />
                                    </a>
                                );
                            })}
                        </nav>

                        {/* ── RIGHT ICONS ── */}
                        <div data-gsap="nav-actions" className="flex items-center gap-2.5 sm:gap-3 md:gap-4">
                            {/* Join as Creator */}
                            {!isLoggedIn && (
                                <Link
                                    to="/login"
                                    data-gsap-hover="magnetic-soft"
                                    className="hidden md:inline-flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300 hover:bg-[#D4AF37]/10"
                                    style={{
                                        fontSize: "10px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.22em",
                                        border: "1px solid rgba(212,175,55,0.4)",
                                        color: "hsl(44 78% 68%)",
                                    }}
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Join as Creator
                                </Link>
                            )}

                            {/* Desktop icons */}
                            <div className="hidden md:flex items-center gap-5">
                                {/* Profile */}
                                {isLoggedIn ? (
                                    <div className="relative" ref={menuRef}>
                                        <button
                                            onClick={() => navigate("/user-dashboard")}
                                            className="flex flex-col items-center gap-1 group transition-all duration-300 hover:scale-105"
                                        >
                                            {hasAura && aura && (aura.model_url || aura.image_url) && !avatarImgError ? (
                                                <img
                                                    src={aura.model_url || aura.image_url}
                                                    alt="Aura"
                                                    className="w-5 h-5 rounded-full object-cover"
                                                    style={{ border: "1px solid rgba(212,175,55,0.5)" }}
                                                    onError={() => setAvatarImgError(true)}
                                                />
                                            ) : (
                                                <User className="w-[20px] h-[20px] transition-colors duration-300 group-hover:text-[#D4AF37]" style={{ color: "rgba(255,255,255,0.95)" }} />
                                            )}
                                            <span className="text-[10px] font-semibold tracking-wide transition-colors duration-300 group-hover:text-[#D4AF37]" style={{ color: "rgba(255,255,255,0.95)" }}>Profile</span>
                                        </button>

                                        {showUserMenu && (
                                            <div
                                                className="absolute right-0 mt-3 w-56 rounded-2xl py-2 z-50"
                                                style={{
                                                    background: "hsl(30 14% 10%)",
                                                    border: "1px solid rgba(212,175,55,0.2)",
                                                    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                                                }}
                                            >
                                                {hasAura ? (
                                                    <Link to="/aura-profile" onClick={() => setShowUserMenu(false)}
                                                        className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-white/5"
                                                        style={{ color: "rgba(255,255,255,0.7)" }}
                                                    >
                                                        <User className="w-4 h-4" style={{ color: "#D4AF37" }} />
                                                        View Aura Profile
                                                    </Link>
                                                ) : (
                                                    <Link to="/aura-dashboard" onClick={() => setShowUserMenu(false)}
                                                        className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-white/5"
                                                        style={{ color: "rgba(255,255,255,0.7)" }}
                                                    >
                                                        <User className="w-4 h-4" style={{ color: "#D4AF37" }} />
                                                        Create Your Aura
                                                    </Link>
                                                )}
                                                <div className="mx-4 my-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                                                <Link to="/my-orders" onClick={() => setShowUserMenu(false)}
                                                    className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-white/5"
                                                    style={{ color: "rgba(255,255,255,0.7)" }}
                                                >
                                                    <Package className="w-4 h-4" style={{ color: "#D4AF37" }} />
                                                    My Orders
                                                </Link>
                                                <div className="mx-4 my-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                                                <button
                                                    onClick={() => { setShowUserMenu(false); setShowLogoutDialog(true); }}
                                                    className="w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-red-500/10"
                                                    style={{ color: "rgba(255,100,100,0.8)" }}
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Logout
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Link 
                                        to="/user-login" 
                                        className="flex flex-col items-center gap-1 group transition-all duration-300 hover:scale-105"
                                    >
                                        <User className="w-[20px] h-[20px] transition-colors duration-300 group-hover:text-[#D4AF37]" style={{ color: "rgba(255,255,255,0.95)" }} />
                                        <span className="text-[10px] font-semibold tracking-wide transition-colors duration-300 group-hover:text-[#D4AF37]" style={{ color: "rgba(255,255,255,0.95)" }}>Profile</span>
                                    </Link>
                                )}

                                {/* Wishlist */}
                                <div className="flex flex-col items-center gap-1 group transition-all duration-300 hover:scale-105 cursor-pointer" style={{ color: "rgba(255,255,255,0.95)" }}>
                                    <WishlistBadge onClick={() => navigate("/wishlist")} showLabel />
                                </div>

                                {/* Cart */}
                                <div className="flex flex-col items-center gap-1 group transition-all duration-300 hover:scale-105 cursor-pointer" style={{ color: "rgba(255,255,255,0.95)" }}>
                                    <CartBadge onClick={() => navigate("/cart")} showLabel />
                                </div>
                            </div>

                            {/* Mobile hamburger */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 lg:hidden"
                                style={{
                                    background: "rgba(255,255,255,0.07)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    color: "rgba(255,255,255,0.8)",
                                }}
                            >
                                {isMobileMenuOpen ? <X className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} /> : <Menu style={{ width: 18, height: 18 }} />}
                            </button>
                        </div>
                    </div>

                    {/* ── MOBILE MENU ── */}
                    <div
                        className="overflow-hidden transition-all duration-500 lg:hidden"
                        style={{
                            maxHeight: isMobileMenuOpen ? "calc(100vh - 5.5rem)" : "0",
                            opacity: isMobileMenuOpen ? 1 : 0,
                        }}
                    >
                        <div
                            className="mt-2 flex max-h-[calc(100vh-7rem)] flex-col gap-1 overflow-y-auto rounded-[1.5rem] px-3.5 py-4 sm:px-4 sm:py-5"
                            style={{
                                background: "rgba(8, 6, 4, 0.92)",
                                backdropFilter: "blur(20px)",
                                border: "1px solid rgba(212,175,55,0.15)",
                            }}
                        >
                            <div className="mb-3 rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3.5">
                                <div className="text-[10px] font-semibold uppercase tracking-[0.26em]" style={{ color: "hsl(44 78% 66%)" }}>
                                    Explore Aivestire
                                </div>
                                <p className="mt-2 text-sm leading-6" style={{ color: "rgba(255,255,255,0.62)" }}>
                                    Heritage fashion, AI try-on, and curated styling designed for mobile browsing.
                                </p>
                            </div>

                            {navLinks.map((link) =>
                                link.isRoute ? (
                                    <Link
                                        key={link.name}
                                        to={link.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="rounded-xl px-4 py-3 text-sm font-medium tracking-wide transition-all duration-200"
                                        style={{
                                            color: isActive(link.href) ? "hsl(44 78% 66%)" : "rgba(255,255,255,0.62)",
                                            background: isActive(link.href) ? "rgba(212,175,55,0.1)" : "transparent",
                                        }}
                                    >
                                        {link.name}
                                    </Link>
                                ) : (
                                    <a
                                        key={link.name}
                                        href={link.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="rounded-xl px-4 py-3 text-sm font-medium tracking-wide transition-all duration-200"
                                        style={{ color: "rgba(255,255,255,0.62)" }}
                                    >
                                        {link.name}
                                    </a>
                                )
                            )}

                            <div className="mx-2 my-2 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

                            <div className="grid grid-cols-2 gap-2">
                                <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm font-medium transition-all" style={{ color: "rgba(255,255,255,0.72)" }}>Cart</Link>
                                <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm font-medium transition-all" style={{ color: "rgba(255,255,255,0.72)" }}>Wishlist</Link>
                            </div>

                            {isLoggedIn && (
                                <>
                                    <div className="mx-2 my-2 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                                    <Link to="/my-orders" onClick={() => setIsMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium transition-all" style={{ color: "rgba(255,255,255,0.62)" }}>My Orders</Link>
                                    {hasAura ? (
                                        <Link to="/aura-profile" onClick={() => setIsMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium transition-all" style={{ color: "rgba(255,255,255,0.62)" }}>Aura Profile</Link>
                                    ) : (
                                        <Link to="/aura-dashboard" onClick={() => setIsMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium transition-all" style={{ color: "rgba(255,255,255,0.62)" }}>Create Aura</Link>
                                    )}
                                    <button
                                        onClick={() => { setIsMobileMenuOpen(false); setShowLogoutDialog(true); }}
                                        className="rounded-xl px-4 py-3 text-left text-sm font-medium transition-all"
                                        style={{ color: "rgba(255,100,100,0.75)" }}
                                    >
                                        Logout
                                    </button>
                                </>
                            )}

                            {!isLoggedIn && (
                                <div className="mt-2 flex flex-col gap-2">
                                    <Link
                                        to="/user-login"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="rounded-xl px-4 py-3 text-center text-sm font-semibold transition-all"
                                        style={{
                                            background: "linear-gradient(135deg, hsl(44 78% 56%), hsl(40 62% 44%))",
                                            color: "hsl(30 14% 10%)",
                                        }}
                                    >
                                        Login / Sign Up
                                    </Link>
                                    <Link
                                        to="/login"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="rounded-xl px-4 py-3 text-center text-sm font-medium transition-all"
                                        style={{
                                            border: "1px solid rgba(212,175,55,0.3)",
                                            color: "hsl(44 78% 62%)",
                                        }}
                                    >
                                        Join as Creator
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <LogoutConfirmDialog
                isOpen={showLogoutDialog}
                onConfirm={() => {
                    authLogout();
                    setIsLoggedIn(false);
                    setHasAura(false);
                    setAura(null);
                    setShowLogoutDialog(false);
                    toast({ title: "Logged out successfully", description: "See you soon!" });
                    navigate("/");
                }}
                onCancel={() => setShowLogoutDialog(false)}
            />
        </>
    );
};
