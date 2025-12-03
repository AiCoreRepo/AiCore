import { useState, useEffect } from "react";
import { Menu, X, ShoppingBag, User } from "lucide-react";
import { Link } from "react-router-dom";

const navLinks = [
    { name: "Home", href: "#hero" },
    { name: "Collection", href: "#collection" },
    { name: "AI Try-On", href: "#ai-tryon" },
    { name: "Let AI Decide", href: "#ai-decide" },
    { name: "Lookbook", href: "#lookbook" },
    { name: "About", href: "#about" },
];

export const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
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
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="relative px-4 py-2 text-sm font-medium text-charcoal tracking-wide uppercase transition-all duration-300 group"
                                >
                                    <span className="relative z-10">{link.name}</span>
                                    {/* Hover background */}
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gold/20 via-gold/30 to-gold/20 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100" />
                                    {/* Bottom border on hover */}
                                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gold group-hover:w-3/4 transition-all duration-300 rounded-full" />
                                </a>
                            ))}
                        </div>

                        {/* Right Icons */}
                        <div className="flex items-center space-x-2 md:space-x-3">
                            <Link to="/login">
                                <button
                                    className="hidden md:inline-flex items-center px-6 py-2.5 text-sm font-medium text-charcoal bg-gradient-to-r from-gold/20 to-gold/30 rounded-full border border-gold/40 transition-all duration-300 hover:shadow-lg hover:shadow-gold/30 hover:scale-105 hover:border-gold"
                                    aria-label="Join as a Creator"
                                >
                                    Join as Creator
                                </button>
                            </Link>

                            <button
                                className="p-2.5 rounded-full bg-ivory/50 border border-gold/20 hover:bg-gold/20 hover:border-gold/40 hover:shadow-md hover:shadow-gold/20 transition-all duration-300 hover:scale-110"
                                aria-label="Shopping cart"
                            >
                                <ShoppingBag className="w-5 h-5 text-charcoal" />
                            </button>

                            <Link to="/user-login">
                                <button
                                    className="p-2.5 rounded-full bg-gradient-to-br from-gold/30 to-gold/20 border border-gold/40 hover:from-gold/40 hover:to-gold/30 hover:shadow-md hover:shadow-gold/30 transition-all duration-300 hover:scale-110"
                                    aria-label="Sign in"
                                >
                                    <User className="w-5 h-5 text-charcoal" />
                                </button>
                            </Link>

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
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="px-4 py-3 text-charcoal font-medium tracking-wide rounded-2xl hover:bg-gold/20 transition-all duration-300 border border-transparent hover:border-gold/30"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {link.name}
                                </a>
                            ))}
                            <Link
                                to="/login"
                                className="px-4 py-3 text-center text-charcoal font-medium tracking-wide rounded-2xl bg-gradient-to-r from-gold/20 to-gold/30 border border-gold/40 hover:shadow-md transition-all duration-300"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Join as Creator
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
