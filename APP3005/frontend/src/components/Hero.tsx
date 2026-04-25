import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import jaipurVideo from "@/assets/JaipurDev.mp4";

const heroHighlights = [
    "Heritage-led AI styling",
    "Virtual drape realism",
    "Creator-first luxury",
];

const heroStats = [
    { value: "240+", label: "Master Artisans" },
    { value: "18", label: "Heritage Crafts" },
    { value: "1.2M+", label: "AI Try-Ons" },
];

export const Hero = () => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(() => {});
        }
    }, []);

    return (
        <section
            id="hero"
            className="relative w-full overflow-hidden bg-black flex items-center justify-center"
            style={{ minHeight: "max(100vh, 52rem)" }}
        >
            {/* ── VIDEO BACKGROUND ── */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <video
                    data-gsap="hero-video"
                    ref={videoRef}
                    src={jaipurVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    className="h-full w-full object-cover"
                    style={{
                        objectPosition: "center center",
                        filter: "brightness(0.92) saturate(1.08) contrast(1.02)",
                    }}
                />

                {/* Global dark tint */}
                <div className="pointer-events-none absolute inset-0 bg-black/42" />

                {/* Navbar protection zone */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/88 via-black/58 to-transparent" />

                {/* Left gradient — text legibility */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/88 via-black/62 via-[42%] to-black/16 to-transparent" />

                {/* Focused vignette on hero copy */}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(circle at 21% 42%, rgba(0,0,0,0.48) 0%, rgba(0,0,0,0.2) 24%, transparent 52%)",
                    }}
                />

                {/* Top + bottom vignette */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/58 via-black/12 via-[36%] to-black/70" />

                <div
                    data-gsap="hero-orb"
                    className="pointer-events-none absolute left-[10%] top-[18%] hidden h-48 w-48 rounded-full lg:block"
                    style={{
                        background: "radial-gradient(circle, rgba(212,175,55,0.16) 0%, rgba(212,175,55,0.02) 52%, transparent 74%)",
                        filter: "blur(18px)",
                    }}
                />

                {/* Subtle gold glow at center-bottom */}
                <div
                    data-gsap="hero-glow"
                    className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2"
                    style={{
                        width: "70vw",
                        height: "30rem",
                        borderRadius: "50%",
                        background: "radial-gradient(ellipse, rgba(212,175,55,0.14) 0%, transparent 70%)",
                        filter: "blur(48px)",
                    }}
                />
            </div>

            {/* ── CONTENT ── */}
            <div
                className="relative z-10 container-luxury w-full"
                style={{ paddingTop: "clamp(9rem, 12vw, 11.5rem)", paddingBottom: "5rem" }}
            >
                <div className="flex justify-start">
                    <div
                        data-gsap="hero-panel"
                        className="relative max-w-4xl overflow-hidden rounded-[2rem] border border-white/14"
                        style={{
                            background:
                                "linear-gradient(145deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.09) 44%, rgba(212,175,55,0.08) 100%)",
                            backdropFilter: "blur(18px) saturate(135%)",
                            WebkitBackdropFilter: "blur(18px) saturate(135%)",
                            boxShadow: "0 22px 56px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.12)",
                        }}
                    >
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent" />
                        <div className="absolute -left-20 top-16 h-44 w-44 rounded-full bg-[#D4AF37]/8 blur-3xl" />

                        <div className="relative px-6 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
                            {/* Eyebrow */}
                            <div data-gsap="hero-kicker" className="flex flex-wrap items-center gap-3 mb-6">
                                <span
                                    className="block w-7 h-px"
                                    style={{ background: "hsl(40 78% 62%)" }}
                                />
                                <span
                                    className="text-[10px] uppercase tracking-[0.48em] font-medium"
                                    style={{ color: "hsl(44 78% 76%)" }}
                                >
                                    Aivestire · A New Atelier · est. Jaipur
                                </span>
                            </div>

                            <div data-gsap="hero-badges" className="mb-6 flex flex-wrap gap-2.5">
                                {heroHighlights.map((item) => (
                                    <span
                                        key={item}
                                        className="rounded-full px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em]"
                                        style={{
                                            color: "rgba(255,255,255,0.82)",
                                            border: "1px solid rgba(255,255,255,0.12)",
                                            background: "rgba(255,255,255,0.05)",
                                        }}
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>

                            {/* Headline */}
                            <div data-gsap="hero-title" className="font-serif text-white leading-[0.98]">
                                <div className="overflow-hidden">
                                    <span
                                        data-gsap="hero-title-line"
                                        className="block"
                                        style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
                                    >
                                        Where Artisans
                                    </span>
                                </div>
                                <div className="overflow-hidden mt-1">
                                    <span
                                        data-gsap="hero-title-line"
                                        className="block"
                                        style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
                                    >
                                        Meet{" "}
                                        <span
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, hsl(44 78% 74%), hsl(40 62% 56%), hsl(35 55% 42%))",
                                                WebkitBackgroundClip: "text",
                                                WebkitTextFillColor: "transparent",
                                                backgroundClip: "text",
                                            }}
                                        >
                                            Intelligence
                                        </span>
                                    </span>
                                </div>
                            </div>

                            {/* Sub-headline */}
                            <p
                                data-gsap="hero-copy"
                                className="mt-6 leading-[1.85]"
                                style={{
                                    fontSize: "clamp(1rem, 1.65vw, 1.17rem)",
                                    color: "rgba(255,255,255,0.82)",
                                    maxWidth: "38rem",
                                }}
                            >
                                A cinematic luxury storefront where Jaipur’s craft legacy is translated into
                                AI-powered styling, virtual try-on, and a more confident buying experience.
                            </p>

                            {/* CTA Row */}
                            <div data-gsap="hero-actions" className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-9">
                                <Link
                                    to="/ai-try-on"
                                    className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 font-semibold transition-all duration-300 hover:scale-[1.03]"
                                    style={{
                                        fontSize: "11px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.3em",
                                        background:
                                            "linear-gradient(135deg, hsl(44 78% 58%), hsl(40 62% 44%))",
                                        color: "hsl(30 14% 10%)",
                                        boxShadow: "0 16px 40px rgba(212,175,55,0.22)",
                                    }}
                                >
                                    Explore Experience
                                </Link>

                                <a
                                    href="#stories"
                                    className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 font-medium transition-all duration-300 hover:bg-white/10 hover:border-white/60"
                                    style={{
                                        fontSize: "11px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.3em",
                                        color: "rgba(255,255,255,0.92)",
                                        border: "1px solid rgba(255,255,255,0.24)",
                                        background: "rgba(255,255,255,0.04)",
                                    }}
                                >
                                    Discover Stories
                                </a>
                            </div>

                            {/* Stats */}
                            <div data-gsap="hero-stats" className="mt-10 grid gap-3 border-t border-white/10 pt-8 sm:grid-cols-3">
                                {heroStats.map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-[1.25rem] border border-white/10 px-4 py-4"
                                        style={{ background: "rgba(255,255,255,0.04)" }}
                                    >
                                        <div
                                            className="font-serif leading-none"
                                            style={{
                                                fontSize: "clamp(2rem, 3vw, 2.7rem)",
                                                color: "rgba(255,255,255,0.96)",
                                            }}
                                        >
                                            {item.value}
                                        </div>
                                        <div
                                            className="mt-3 uppercase tracking-[0.28em]"
                                            style={{
                                                fontSize: "10px",
                                                color: "rgba(255,255,255,0.56)",
                                            }}
                                        >
                                            {item.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Side label */}
            <div
                data-gsap="hero-side-label"
                className="absolute right-8 bottom-10 hidden lg:flex items-center gap-3 [writing-mode:vertical-rl] rotate-180"
                style={{
                    fontSize: "9px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5em",
                    color: "rgba(255,255,255,0.28)",
                }}
            >
                <span>Chapter I — The Loom Awakens</span>
            </div>

            {/* Scroll cue */}
            <div
                data-gsap="hero-scroll"
                className="absolute left-1/2 bottom-8 -translate-x-1/2 flex flex-col items-center gap-2"
                style={{ color: "rgba(255,255,255,0.32)" }}
            >
                <span style={{ fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.42em" }}>
                    Scroll
                </span>
                <div
                    data-gsap="hero-scroll-line"
                    style={{
                        width: "1px",
                        height: "2.5rem",
                        background:
                            "linear-gradient(180deg, transparent, rgba(255,255,255,0.22), transparent)",
                    }}
                />
            </div>
        </section>
    );
};
