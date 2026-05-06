import { Facebook, Instagram, Mail, Sparkles, Twitter } from "lucide-react";
import { Link } from "react-router-dom";
import { LEGAL_ENTITY_NAME } from "@/constants/legal.constants";

const exploreLinks = [
    { label: "About", to: "/about" },
    { label: "Collection", to: "/collection" },
    { label: "AI Try-On", to: "/ai-try-on" },
    { label: "Upcoming", to: "/upcoming" },
];

const supportLinks = [
    { label: "Contact Us", to: "/contact-us" },
    { label: "Privacy Policy", to: "/privacy-policy" },
    { label: "Terms & Conditions", to: "/terms-conditions" },
    { label: "Return Policy", to: "/return-policy" },
    { label: "Refund Policy", to: "/refund-policy" },
    { label: "Shipping Policy", to: "/shipping-policy" },
];

const socialLinks = [
    { name: "Instagram", icon: Instagram, href: "#" },
    { name: "Twitter", icon: Twitter, href: "#" },
    { name: "Facebook", icon: Facebook, href: "#" },
];

export const Footer = () => {
    return (
        <footer className="relative overflow-hidden border-t border-white/10 bg-[#120f0c] text-[#F8F2E9]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/45 to-transparent" />
            <div className="absolute left-1/2 top-0 h-64 w-[42rem] -translate-x-1/2 bg-[radial-gradient(circle,rgba(212,175,55,0.14)_0%,rgba(212,175,55,0)_72%)] opacity-70" />

            <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-10">
                <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(200px,0.7fr)_minmax(220px,0.8fr)]">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#E7C870]">
                            <Sparkles className="h-3.5 w-3.5" />
                            AiVestire
                        </div>

                        <Link
                            to="/"
                            className="mt-5 block font-serif text-[1.9rem] leading-none text-white transition-colors hover:text-[#E7C870] sm:text-[2.35rem]"
                        >
                            AiVestire
                        </Link>

                        <p className="mt-4 max-w-lg text-sm leading-7 text-[#F8F2E9]/66 sm:text-[15px]">
                            AI-led fashion discovery, virtual try-on, and a more
                            confident path from browsing to buying.
                        </p>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                            <a
                                href="mailto:support@aivestire.com"
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-[#F8F2E9] transition-colors hover:border-[#D4AF37]/45 hover:bg-[#D4AF37]/10 hover:text-white sm:justify-start"
                            >
                                <Mail className="h-4 w-4 text-[#E7C870]" />
                                support@aivestire.com
                            </a>

                            <div className="flex gap-2">
                                {socialLinks.map((social) => (
                                    <a
                                        key={social.name}
                                        href={social.href}
                                        aria-label={social.name}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-[#E7C870] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/45 hover:bg-[#D4AF37]/10 hover:text-white"
                                    >
                                        <social.icon className="h-4 w-4" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#E7C870]">
                            Explore
                        </p>
                        <div className="mt-4 grid gap-3">
                            {exploreLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className="text-sm text-[#F8F2E9]/68 transition-colors hover:text-white"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#E7C870]">
                            Support
                        </p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            {supportLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className="text-sm text-[#F8F2E9]/68 transition-colors hover:text-white"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-[#F8F2E9]/50 sm:flex-row sm:items-center sm:justify-between">
                    <p>© 2026 {LEGAL_ENTITY_NAME}. All rights reserved.</p>
                    <p>Virtual try-on, recommendations, and artisan-led fashion.</p>
                </div>
            </div>
        </footer>
    );
};
