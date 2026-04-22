import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";

/* ─── FEATURE DATA ─────────────────────────────────────── */
const features = [
    {
        id: "tryon",
        eyebrow: "AI Try-On",
        title: "See Before You Buy",
        shortDesc:
            "Upload your photo once. Try every garment in our collection instantly on your own body — no guessing, no returns.",
        icon: (
            <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
                <circle cx="24" cy="14" r="8" stroke="currentColor" strokeWidth="2.5" />
                <path d="M10 42c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M30 26l4 4m0 0l4-4m-4 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
        color: "hsl(44 78% 56%)",
        glow: "rgba(212,175,55,0.18)",
        accent: "#D4AF37",
        link: "/ai-try-on",
        benefits: [
            { icon: "✦", title: "Hyper-Realistic Draping", body: "AI physics simulate how fabric actually moves on your unique body shape and posture." },
            { icon: "◈", title: "360° View", body: "Rotate your digital twin to see the fit from every angle — front, side, and back." },
            { icon: "◉", title: "Size Confidence", body: "No more size anxiety. Know exactly how the garment will look before it arrives at your door." },
            { icon: "✧", title: "Save & Compare", body: "Build a wardrobe board and compare outfits side-by-side across sessions." },
        ],
        visual: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop",
    },
    {
        id: "aura",
        eyebrow: "Aura Identity",
        title: "Your Digital Style Soul",
        shortDesc:
            "Upload a single selfie. Our AI creates your hyper-accurate digital twin — a living Aura that evolves with your style.",
        icon: (
            <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
                <circle cx="24" cy="24" r="13" stroke="currentColor" strokeWidth="2.5" />
                <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="2" />
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 4" />
            </svg>
        ),
        color: "hsl(270 60% 60%)",
        glow: "rgba(150,100,220,0.16)",
        accent: "#9B6FE0",
        link: "/aura-dashboard",
        benefits: [
            { icon: "✦", title: "One Photo, Full Twin", body: "AI scans your proportions, posture, and skin tone to create a photorealistic avatar — your Aura." },
            { icon: "◈", title: "Style DNA Mapping", body: "We learn your aesthetic preferences and curate an evolving style identity unique to you." },
            { icon: "◉", title: "Editorial Wardrobe", body: "Your Aura stores every outfit you've tried, liked, or bought — your personal fashion archive." },
            { icon: "✧", title: "Creator Collaboration", body: "Share your Aura style profile with designers for personalized, made-to-measure pieces." },
        ],
        visual: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200&auto=format&fit=crop",
    },
    {
        id: "ai",
        eyebrow: "AI Recommendations",
        title: "Your Personal AI Stylist",
        shortDesc:
            "Our AI understands your Aura's style, occasion, and taste — then curates pieces that feel like they were made only for you.",
        icon: (
            <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
                <rect x="8" y="18" width="32" height="22" rx="4" stroke="currentColor" strokeWidth="2.5" />
                <path d="M16 18v-4a8 8 0 0116 0v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="24" cy="29" r="3" fill="currentColor" />
                <path d="M24 32v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
        color: "hsl(160 55% 45%)",
        glow: "rgba(60,180,120,0.16)",
        accent: "#3EB489",
        link: "/let-ai-decide",
        benefits: [
            { icon: "✦", title: "Taste-First Curation", body: "Not algorithmic noise — real aesthetic matching based on your Aura's visual DNA and history." },
            { icon: "◈", title: "Occasion Intelligence", body: "Tell us the event, mood, or vibe. The AI assembles a complete look from head to toe." },
            { icon: "◉", title: "Artisan Discovery", body: "Surface craft pieces from Jaipur artisans that align with your colour palette and style profile." },
            { icon: "✧", title: "Live Trend Adaptation", body: "Recommendations evolve with seasons, editorial trends, and what people with your Aura are loving." },
        ],
        visual: "https://images.unsplash.com/photo-1485217988980-11786ced9454?q=80&w=1200&auto=format&fit=crop",
    },
    {
        id: "creator",
        eyebrow: "Creator Benefits",
        title: "Built for Artisans & Designers",
        shortDesc:
            "We give India's finest creators the visibility, tools, and AI intelligence they deserve — turning craft into culture.",
        icon: (
            <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
                <path d="M24 6l4.5 9 10 1.5-7.25 7 1.75 10L24 29l-9 4.5 1.75-10L9.5 16.5l10-1.5L24 6z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
            </svg>
        ),
        color: "hsl(20 70% 52%)",
        glow: "rgba(200,100,50,0.16)",
        accent: "#D4714A",
        link: "/login",
        benefits: [
            { icon: "✦", title: "AI-Powered Storefront", body: "Your collection, presented in a stunning editorial format with AI-generated styling content." },
            { icon: "◈", title: "Smart Buyer Matching", body: "Our AI sends the right buyer to your product at the right moment — based on Aura compatibility." },
            { icon: "◉", title: "Craft Storytelling", body: "Every piece carries your artisan story — woven, dyed, printed. The heritage is visible and searchable." },
            { icon: "✧", title: "Zero Platform Noise", body: "A luxury marketplace with curated quality over quantity — your work is seen, not buried." },
        ],
        visual: "https://images.unsplash.com/photo-1558171813-2c3a17a2f760?q=80&w=1200&auto=format&fit=crop",
    },
];

/* ─── EXPANDED DETAIL PANEL ─────────────────────────────── */
const ExpandedPanel = ({
    feature,
    onClose,
}: {
    feature: typeof features[0];
    onClose: () => void;
}) => {
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-4 md:p-8"
            style={{ animation: "fadeIn 0.25s ease both" }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl md:rounded-3xl"
                style={{
                    background: "hsl(30 12% 10%)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: `0 40px 100px rgba(0,0,0,0.6), 0 0 80px ${feature.glow}`,
                    animation: "slideUp 0.4s cubic-bezier(0.22,1,0.36,1) both",
                }}
            >
                {/* Hero image strip */}
                <div className="relative w-full h-56 md:h-72 overflow-hidden rounded-t-2xl md:rounded-t-3xl">
                    <img
                        src={feature.visual}
                        alt={feature.title}
                        className="w-full h-full object-cover"
                        style={{ filter: "brightness(0.55) saturate(1.15)" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[hsl(30_12%_10%)]" />

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                        style={{
                            background: "rgba(0,0,0,0.55)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            color: "white",
                        }}
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Eyebrow + title overlay */}
                    <div className="absolute bottom-6 left-8">
                        <span
                            className="text-[9px] uppercase tracking-[0.42em] font-semibold mb-2 block"
                            style={{ color: feature.color }}
                        >
                            {feature.eyebrow}
                        </span>
                        <h3
                            className="font-serif text-white leading-tight"
                            style={{ fontSize: "clamp(1.6rem, 3vw, 2.5rem)" }}
                        >
                            {feature.title}
                        </h3>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 md:p-12">
                    <p
                        className="leading-relaxed mb-10"
                        style={{
                            fontSize: "1rem",
                            color: "rgba(255,255,255,0.58)",
                            maxWidth: "56rem",
                        }}
                    >
                        {feature.shortDesc}
                    </p>

                    {/* Benefits grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        {feature.benefits.map((b, i) => (
                            <div
                                key={i}
                                className="rounded-xl p-6"
                                style={{
                                    background: "hsl(30 10% 14%)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    animation: `fade-up 0.5s ease ${i * 0.08}s both`,
                                }}
                            >
                                <span
                                    className="text-lg mb-3 block"
                                    style={{ color: feature.accent }}
                                >
                                    {b.icon}
                                </span>
                                <h4
                                    className="font-serif mb-2"
                                    style={{
                                        fontSize: "1.05rem",
                                        color: "hsl(40 30% 90%)",
                                    }}
                                >
                                    {b.title}
                                </h4>
                                <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.48)", lineHeight: 1.7 }}>
                                    {b.body}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <Link
                        to={feature.link}
                        onClick={onClose}
                        className="inline-flex items-center gap-3 px-8 py-3.5 font-semibold transition-all duration-300 hover:scale-[1.03] hover:shadow-xl"
                        style={{
                            background: `linear-gradient(135deg, ${feature.accent}, ${feature.accent}cc)`,
                            color: feature.id === "aura" ? "white" : "hsl(30 14% 10%)",
                            fontSize: "11px",
                            textTransform: "uppercase",
                            letterSpacing: "0.28em",
                        }}
                    >
                        Explore {feature.eyebrow}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

/* ─── FEATURE CARD ──────────────────────────────────────── */
const FeatureCard = ({
    feature,
    index,
    onClick,
}: {
    feature: typeof features[0];
    index: number;
    onClick: () => void;
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.15 }
        );
        if (cardRef.current) observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={cardRef}
            onClick={onClick}
            className="group cursor-pointer relative overflow-hidden rounded-2xl transition-all duration-500 hover:-translate-y-2"
            style={{
                background: "rgba(255,255,255,0.035)",
                border: "1px solid rgba(255,255,255,0.09)",
                backdropFilter: "blur(16px)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(30px)",
                transition: `opacity 0.7s ease ${index * 0.12}s, transform 0.7s ease ${index * 0.12}s, box-shadow 0.4s ease`,
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                    `0 20px 60px rgba(0,0,0,0.45), 0 0 40px ${feature.glow}`;
                (e.currentTarget as HTMLDivElement).style.borderColor = `${feature.accent}44`;
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 40px rgba(0,0,0,0.3)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.09)";
            }}
        >
            {/* Card image */}
            <div className="relative w-full overflow-hidden" style={{ height: 220 }}>
                <img
                    src={feature.visual}
                    alt={feature.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    style={{ filter: "brightness(0.5) saturate(1.1)" }}
                />
                <div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(180deg, transparent 30%, hsl(30 12% 10%) 100%)`,
                    }}
                />
                {/* Accent glow on hover */}
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                        background: `radial-gradient(ellipse at 50% 80%, ${feature.glow} 0%, transparent 70%)`,
                    }}
                />
            </div>

            {/* Card content */}
            <div className="p-7">
                {/* Icon + eyebrow */}
                <div className="flex items-center gap-3 mb-4">
                    <span style={{ color: feature.accent }}>{feature.icon}</span>
                    <span
                        className="text-[9px] uppercase tracking-[0.42em] font-semibold"
                        style={{ color: feature.accent }}
                    >
                        {feature.eyebrow}
                    </span>
                </div>

                <h3
                    className="font-serif mb-3 leading-tight"
                    style={{
                        fontSize: "clamp(1.2rem, 2vw, 1.55rem)",
                        color: "hsl(40 30% 92%)",
                    }}
                >
                    {feature.title}
                </h3>

                <p
                    className="leading-relaxed mb-6"
                    style={{ fontSize: "0.87rem", color: "rgba(255,255,255,0.48)", lineHeight: 1.75 }}
                >
                    {feature.shortDesc}
                </p>

                {/* Expand prompt */}
                <div
                    className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] font-semibold transition-all duration-300 group-hover:gap-3"
                    style={{ color: feature.accent }}
                >
                    <span>Learn More</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </div>

                {/* Gold bottom accent line */}
                <div
                    className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500"
                    style={{
                        background: `linear-gradient(90deg, ${feature.accent}, transparent)`,
                    }}
                />
            </div>
        </div>
    );
};

/* ─── MAIN COMPONENT ────────────────────────────────────── */
export const EcosystemSection = () => {
    const [activeFeature, setActiveFeature] = useState<typeof features[0] | null>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const [headerVisible, setHeaderVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setHeaderVisible(true); },
            { threshold: 0.2 }
        );
        if (headerRef.current) observer.observe(headerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <>
            <section
                id="ecosystem"
                style={{
                    background: "hsl(30 14% 9%)",
                    padding: "7rem 0 8rem",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Background texture glow */}
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        top: "-20rem",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "90vw",
                        height: "60rem",
                        borderRadius: "50%",
                        background:
                            "radial-gradient(ellipse, rgba(212,175,55,0.06) 0%, transparent 65%)",
                        filter: "blur(60px)",
                        pointerEvents: "none",
                    }}
                />

                <div className="container-luxury">
                    {/* Section header */}
                    <div
                        ref={headerRef}
                        className="text-center mb-16"
                        style={{
                            opacity: headerVisible ? 1 : 0,
                            transform: headerVisible ? "translateY(0)" : "translateY(24px)",
                            transition: "opacity 0.8s ease, transform 0.8s ease",
                        }}
                    >
                        <div className="inline-flex items-center gap-3 mb-5">
                            <span
                                className="block h-px"
                                style={{ width: "2rem", background: "hsl(44 78% 58%)" }}
                            />
                            <span
                                className="text-[10px] uppercase tracking-[0.48em] font-semibold"
                                style={{ color: "hsl(44 78% 58%)" }}
                            >
                                The Aivestire Ecosystem
                            </span>
                            <span
                                className="block h-px"
                                style={{ width: "2rem", background: "hsl(44 78% 58%)" }}
                            />
                        </div>

                        <h2
                            className="font-serif leading-[1.12]"
                            style={{
                                fontSize: "clamp(1.9rem, 3.5vw, 3.2rem)",
                                color: "hsl(40 38% 92%)",
                            }}
                        >
                            Intelligence for every{" "}
                            <em
                                className="italic font-normal"
                                style={{
                                    background:
                                        "linear-gradient(135deg, hsl(44 78% 68%), hsl(40 62% 52%), hsl(35 55% 40%))",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                }}
                            >
                                touchpoint
                            </em>
                        </h2>

                        <p
                            className="mt-4 mx-auto"
                            style={{
                                fontSize: "0.95rem",
                                color: "rgba(255,255,255,0.42)",
                                maxWidth: "38rem",
                                lineHeight: 1.75,
                            }}
                        >
                            From creator studio to your wardrobe — our AI features connect
                            every layer of the fashion experience.
                        </p>
                        <p className="mt-3 text-[11px] uppercase tracking-[0.3em]" style={{ color: "rgba(255,255,255,0.25)" }}>
                            Click any card to explore
                        </p>
                    </div>

                    {/* Cards grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {features.map((f, i) => (
                            <FeatureCard
                                key={f.id}
                                feature={f}
                                index={i}
                                onClick={() => setActiveFeature(f)}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Expanded panel portal */}
            {activeFeature && (
                <ExpandedPanel
                    feature={activeFeature}
                    onClose={() => setActiveFeature(null)}
                />
            )}

            {/* Add slide-up animation to global css via style tag */}
            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(40px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)    scale(1);    }
                }
            `}</style>
        </>
    );
};
