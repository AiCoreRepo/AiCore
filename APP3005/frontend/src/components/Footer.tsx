import { Instagram, Twitter, Facebook, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const socialLinks = [
    { name: "Instagram", icon: Instagram, href: "#" },
    { name: "Twitter", icon: Twitter, href: "#" },
    { name: "Facebook", icon: Facebook, href: "#" },
    {
        name: "Email",
        icon: Mail,
        href: "mailto:Support@aivesitire.com",
        label: "Support@aivesitire.com",
    },
];

export const Footer = () => {
    return (
        <footer className="bg-charcoal text-ivory">
            {/* Compact Footer */}
            <div className="container mx-auto px-6 md:px-12 max-w-7xl py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Logo & Tagline */}
                    <div className="text-center md:text-left">
                        <a href="/" className="font-serif text-xl font-semibold inline-block mb-2">
                            <span className="text-[#D4AF37]">Aivesitire</span> AI Fashiontech LLP
                        </a>
                        <p className="text-ivory/60 text-sm">
                            Where AI meets haute couture
                        </p>
                    </div>

                    {/* Social Links */}
                    <div className="flex gap-3">
                        {socialLinks.map((social) => (
                            <a
                                key={social.name}
                                href={social.href}
                                className={`rounded-full border border-ivory/20 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors ${social.label ? 'inline-flex items-center gap-2 px-3 py-2 text-sm' : 'p-2'}`}
                                aria-label={social.name}
                            >
                                <social.icon className="w-4 h-4" />
                                {social.label && <span className="text-ivory/80">{social.label}</span>}
                            </a>
                        ))}
                    </div>

                    {/* Quick Links */}
                    <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 text-sm text-ivory/60">
                        <Link to="/privacy-policy" className="hover:text-[#D4AF37] transition-colors duration-300">Privacy Policy</Link>
                        <Link to="/terms-conditions" className="hover:text-[#D4AF37] transition-colors duration-300">Terms & Conditions</Link>
                        <Link to="/refund-policy" className="hover:text-[#D4AF37] transition-colors duration-300">Refund Policy</Link>
                    </div>
                </div>

                {/* Copyright */}
                <div className="text-center mt-6 pt-6 border-t border-ivory/10">
                    <p className="text-sm text-ivory/40">
                        © 2026 Aivesitire AI Fashiontech LLP. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};
