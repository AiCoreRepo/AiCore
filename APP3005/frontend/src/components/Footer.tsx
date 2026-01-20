import { Instagram, Twitter, Facebook, Youtube } from "lucide-react";

const socialLinks = [
    { name: "Instagram", icon: Instagram, href: "#" },
    { name: "Twitter", icon: Twitter, href: "#" },
    { name: "Facebook", icon: Facebook, href: "#" },
    { name: "YouTube", icon: Youtube, href: "#" },
];

export const Footer = () => {
    return (
        <footer className="bg-charcoal text-ivory">
            {/* Compact Footer */}
            <div className="container mx-auto px-6 md:px-12 max-w-7xl py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Logo & Tagline */}
                    <div className="text-center md:text-left">
                        <a href="#hero" className="font-serif text-xl font-semibold inline-block mb-2">
                            <span className="text-gold">Ai</span>Vestire
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
                                className="p-2 rounded-full border border-ivory/20 hover:border-gold hover:bg-gold/10 transition-colors"
                                aria-label={social.name}
                            >
                                <social.icon className="w-4 h-4" />
                            </a>
                        ))}
                    </div>

                    {/* Quick Links */}
                    <div className="flex gap-4 text-sm text-ivory/60">
                        <a href="#" className="hover:text-gold transition-colors">Privacy</a>
                        <a href="#" className="hover:text-gold transition-colors">Terms</a>
                        <a href="#" className="hover:text-gold transition-colors">Contact</a>
                    </div>
                </div>

                {/* Copyright */}
                <div className="text-center mt-6 pt-6 border-t border-ivory/10">
                    <p className="text-sm text-ivory/40">
                        © 2024 AiVestire. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};
