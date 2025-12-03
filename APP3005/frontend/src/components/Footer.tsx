import { Instagram, Twitter, Facebook, Youtube } from "lucide-react";

const footerLinks = {
    about: [
        { name: "Our Story", href: "#" },
        { name: "Sustainability", href: "#" },
        { name: "Careers", href: "#" },
        { name: "Press", href: "#" },
    ],
    shop: [
        { name: "New Arrivals", href: "#" },
        { name: "Best Sellers", href: "#" },
        { name: "Collections", href: "#" },
        { name: "Sale", href: "#" },
    ],
    aiTools: [
        { name: "AI Try-On", href: "#" },
        { name: "Let AI Decide", href: "#" },
        { name: "Style Quiz", href: "#" },
        { name: "Virtual Showroom", href: "#" },
    ],
    creators: [
        { name: "Join as Creator", href: "#" },
        { name: "Creator Dashboard", href: "#" },
        { name: "Design Guidelines", href: "#" },
        { name: "Success Stories", href: "#" },
    ],
    support: [
        { name: "Help Center", href: "#" },
        { name: "Shipping & Returns", href: "#" },
        { name: "Size Guide", href: "#" },
        { name: "Contact Us", href: "#" },
    ],
};

const socialLinks = [
    { name: "Instagram", icon: Instagram, href: "#" },
    { name: "Twitter", icon: Twitter, href: "#" },
    { name: "Facebook", icon: Facebook, href: "#" },
    { name: "YouTube", icon: Youtube, href: "#" },
];

export const Footer = () => {
    return (
        <footer className="bg-charcoal text-ivory">
            {/* Newsletter Section */}
            <div className="border-b border-ivory/10">
                <div className="container-luxury py-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <h3 className="font-serif text-2xl md:text-3xl mb-2">Stay in Style</h3>
                            <p className="text-ivory/60">Subscribe for exclusive previews and AI styling tips.</p>
                        </div>
                        <div className="flex w-full md:w-auto gap-3">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 md:w-64 px-4 py-3 bg-ivory/10 border border-ivory/20 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-gold"
                            />
                            <button className="px-6 py-3 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light transition-colors">
                                Subscribe
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Footer */}
            <div className="container-luxury py-16">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                    {/* Logo & Description */}
                    <div className="col-span-2 md:col-span-3 lg:col-span-1">
                        <a href="#hero" className="font-serif text-2xl font-semibold mb-4 inline-block">
                            <span className="text-gold">Ai</span>Vestire
                        </a>
                        <p className="text-ivory/60 text-sm leading-relaxed mb-6">
                            Where artificial intelligence meets haute couture. Redefining luxury fashion for the modern era.
                        </p>
                        {/* Social Icons */}
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
                    </div>

                    {/* Link Columns */}
                    <div>
                        <h4 className="font-serif text-sm uppercase tracking-wider mb-4 text-gold">About</h4>
                        <ul className="space-y-3">
                            {footerLinks.about.map((link) => (
                                <li key={link.name}>
                                    <a href={link.href} className="text-ivory/60 hover:text-gold text-sm transition-colors">
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-serif text-sm uppercase tracking-wider mb-4 text-gold">Shop</h4>
                        <ul className="space-y-3">
                            {footerLinks.shop.map((link) => (
                                <li key={link.name}>
                                    <a href={link.href} className="text-ivory/60 hover:text-gold text-sm transition-colors">
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-serif text-sm uppercase tracking-wider mb-4 text-gold">AI Tools</h4>
                        <ul className="space-y-3">
                            {footerLinks.aiTools.map((link) => (
                                <li key={link.name}>
                                    <a href={link.href} className="text-ivory/60 hover:text-gold text-sm transition-colors">
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-serif text-sm uppercase tracking-wider mb-4 text-gold">Creators</h4>
                        <ul className="space-y-3">
                            {footerLinks.creators.map((link) => (
                                <li key={link.name}>
                                    <a href={link.href} className="text-ivory/60 hover:text-gold text-sm transition-colors">
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-serif text-sm uppercase tracking-wider mb-4 text-gold">Support</h4>
                        <ul className="space-y-3">
                            {footerLinks.support.map((link) => (
                                <li key={link.name}>
                                    <a href={link.href} className="text-ivory/60 hover:text-gold text-sm transition-colors">
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-ivory/10">
                <div className="container-luxury py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-ivory/40">
                        <p>© 2024 AiVestire. All rights reserved.</p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-gold transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-gold transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-gold transition-colors">Cookie Policy</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
