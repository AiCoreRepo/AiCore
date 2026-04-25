import {
    Facebook,
    Instagram,
    Mail,
    Sparkles,
    Twitter,
} from "lucide-react";
import { Link } from "react-router-dom";

const socialLinks = [
    { name: "Instagram", icon: Instagram, href: "#" },
    { name: "Twitter", icon: Twitter, href: "#" },
    { name: "Facebook", icon: Facebook, href: "#" },
    {
        name: "Email",
        icon: Mail,
        href: "mailto:support@aivestire.com",
        label: "support@aivestire.com",
    },
];

const footerLinks = [
    { label: "Contact Us", to: "/contact-us" },
    { label: "Privacy Policy", to: "/privacy-policy" },
    { label: "Terms & Conditions", to: "/terms-conditions" },
    { label: "Refund Policy", to: "/refund-policy" },
    { label: "Return Policy", to: "/return-policy" },
    { label: "Shipping Policy", to: "/shipping-policy" },
];

export const Footer = () => {
    return (
        <footer className="relative overflow-hidden bg-[#120f0c] text-[#F8F2E9]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/55 to-transparent" />
            <div data-gsap="ambient-orb" data-gsap-drift="20" className="absolute left-1/2 top-0 h-64 w-[42rem] -translate-x-1/2 bg-[radial-gradient(circle,rgba(212,175,55,0.18)_0%,rgba(212,175,55,0)_72%)] opacity-70" />

            <div className="relative mx-auto max-w-7xl px-4 pb-4 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pb-5">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
                    <div data-gsap="footer-panel" className="rounded-[26px] border border-white/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.02)_100%)] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:p-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#E7C870]">
                            <Sparkles className="h-3.5 w-3.5" />
                            Ai Fashiontech LLP
                        </div>

                        <div className="mt-4 max-w-xl">
                            <Link
                                to="/"
                                className="font-serif text-[1.85rem] font-semibold leading-none text-white transition-colors hover:text-[#E7C870] sm:text-[2.1rem]"
                            >
                                AiVestire
                            </Link>
                            <p className="mt-2.5 text-sm leading-6 text-[#F8F2E9]/68 sm:text-[15px]">
                                Where AI meets haute couture. Virtual try-ons,
                                smart styling, and fashion guidance in one
                                clean shopping experience.
                            </p>
                        </div>

                        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
                            <a
                                href="mailto:support@aivestire.com"
                                data-gsap-hover="magnetic-soft"
                                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm font-medium text-[#F8F2E9] transition-colors hover:border-[#D4AF37]/45 hover:bg-[#D4AF37]/10 hover:text-white"
                            >
                                <Mail className="h-4 w-4 text-[#E7C870]" />
                                support@aivestire.com
                            </a>
                            <p className="text-sm text-[#F8F2E9]/56 sm:max-w-xs">
                                Support for orders, returns, policies, and AI
                                styling assistance.
                            </p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2.5">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.name}
                                    href={social.href}
                                    data-gsap-hover="magnetic-soft"
                                    className={`group rounded-full border border-white/12 bg-white/[0.04] text-[#F8F2E9]/80 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/45 hover:bg-[#D4AF37]/10 hover:text-white ${social.label ? "inline-flex items-center gap-2 px-4 py-2 text-sm" : "p-2.5"}`}
                                    aria-label={social.name}
                                >
                                    <social.icon className="h-4 w-4 text-[#E7C870] transition-transform duration-300 group-hover:scale-110" />
                                    {social.label && (
                                        <span className="text-sm text-inherit">
                                            {social.label}
                                        </span>
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>

                    <div data-gsap="footer-panel" className="rounded-[26px] border border-white/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.015)_100%)] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                            <div className="max-w-md">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#E7C870]">
                                    Policies & Help
                                </p>
                                <h3 className="mt-1.5 font-serif text-[1.45rem] leading-tight text-white">
                                    Quick access to support and policy pages.
                                </h3>
                                <p className="mt-1.5 text-sm leading-6 text-[#F8F2E9]/60">
                                    All the important customer help links in one
                                    compact block.
                                </p>
                            </div>

                            <div className="inline-flex self-start rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F8F2E9]/70">
                                Quick links
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2.5">
                            {footerLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    data-gsap-hover="magnetic-soft"
                                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-[#F8F2E9]/72 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 hover:text-white"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div data-gsap="footer-bottom" className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.14)] sm:px-5">
                    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-white">
                                © 2026 AiVestire AI Fashiontech LLP. All rights
                                reserved.
                            </p>
                            <p className="mt-1 text-xs leading-5 text-[#F8F2E9]/50">
                                Designed for AI-led styling, virtual try-on,
                                and policy-first shopping support.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[#F8F2E9]/46">
                            <span>Virtual Try-On</span>
                            <span>Wallet Refunds</span>
                            <span>Customer Support</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
