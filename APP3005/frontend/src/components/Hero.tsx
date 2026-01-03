import { useEffect, useState } from "react";
import heroBg from "@/assets/hero-clean.jpg";

export const Hero = () => {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <section id="hero" className="relative h-screen flex items-end justify-center overflow-hidden pb-24">
            {/* Background Image with Parallax - positioned to show below navbar */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    transform: `translateY(${scrollY * 0.3}px)`,
                    top: '80px', // Push image down to show below navbar
                }}
            >
                <img
                    src={heroBg}
                    alt="Elegant model in black couture gown with majestic black horse"
                    className="w-full h-full object-cover object-top"
                />
                {/* Stronger vignette overlay for better text visibility */}
                <div className="absolute inset-0 bg-gradient-to-b from-charcoal/40 via-charcoal/20 to-charcoal/60" />
                <div className="absolute inset-0 bg-gradient-to-r from-charcoal/40 via-transparent to-charcoal/40" />
            </div>

            {/* Content - positioned at bottom with smaller fonts */}
            <div className="relative z-20 text-center px-4 max-w-4xl mx-auto pb-8">
                {/* Subheadline */}
                <p
                    className="animate-fade-up text-gold text-xs md:text-sm tracking-[0.3em] uppercase font-sans mb-2"
                    style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)' }}
                >
                    Designed by Vision. Worn by Imagination.
                </p>

                {/* Main Headline - Reduced font sizes */}
                <h1
                    className="animate-fade-up-delay-1 font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium text-ivory leading-tight mb-3 text-balance"
                    style={{ textShadow: '0 4px 20px rgba(0, 0, 0, 0.9), 0 2px 10px rgba(0, 0, 0, 0.8)' }}
                >
                    Where Artificial Intelligence
                    <br />
                    Meets Haute Couture.
                </h1>

                {/* Secondary text */}
                <p
                    className="animate-fade-up-delay-2 text-ivory font-sans text-base md:text-lg mb-5 tracking-wide"
                    style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)' }}
                >
                    View New Collection.
                </p>

                {/* CTA Button - Golden Theme */}
                <div className="animate-fade-up-delay-3">
                    <a
                        href="#ai-tryon"
                        className="inline-flex items-center text-sm md:text-base tracking-wide px-8 py-4 rounded-full font-medium transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                        style={{
                            background: 'linear-gradient(135deg, rgba(201, 165, 92, 0.9) 0%, rgba(201, 165, 92, 1) 100%)',
                            color: '#212121',
                            boxShadow: '0 8px 32px rgba(201, 165, 92, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)',
                            border: '1px solid rgba(201, 165, 92, 0.6)',
                        }}
                    >
                        [Try AI Styling Now]
                    </a>
                </div>
            </div>

            {/* Curved bottom transition - Golden Gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-12 z-30">
                <svg
                    viewBox="0 0 1440 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{ stopColor: '#E8DCC8', stopOpacity: 1 }} />
                            <stop offset="50%" style={{ stopColor: '#F2EAD8', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#E8DCC8', stopOpacity: 1 }} />
                        </linearGradient>
                    </defs>
                    <path
                        d="M0 120V60C240 20 480 0 720 0C960 0 1200 20 1440 60V120H0Z"
                        fill="url(#curveGradient)"
                    />
                </svg>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 animate-float">
                <div className="w-6 h-10 rounded-full border-2 border-ivory flex items-start justify-center p-2">
                    <div className="w-1 h-2 bg-ivory rounded-full animate-pulse" />
                </div>
            </div>
        </section>
    );
};
