import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { IMG } from "@/constants/cloudinary-images";

const heroHighlights = [
    "Heritage-led AI styling",
    "Virtual drape realism",
    "Creator-first luxury",
];

const heroStats = [
    { value: "240+", label: "Master Artisans", countTo: 240, suffix: "+" },
    { value: "18", label: "Heritage Crafts", countTo: 18, suffix: "" },
    { value: "1.2M+", label: "AI Try-Ons", countTo: 1.2, suffix: "M+", decimals: 1 },
];

export const Hero = () => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(() => { });
        }
    }, []);

    return (
        <section
            id="hero"
            className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-black md:min-h-[48rem] lg:min-h-[100vh]"
        >
            {/* ── VIDEO BACKGROUND ── */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <video
                    data-gsap="hero-video"
                    ref={videoRef}
                    src={IMG.jaipurDevVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    className="h-full w-full object-cover object-[58%_center] xs:object-[54%_center] sm:object-center"
                    style={{
                        filter: "brightness(0.92) saturate(1.08) contrast(1.02)",
                    }}
                />

                {/* Global dark tint */}
                <div className="pointer-events-none absolute inset-0 bg-black/26 sm:bg-black/42" />

                {/* Navbar protection zone */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 via-black/32 to-transparent sm:h-44 sm:from-black/88 sm:via-black/58" />

                {/* Left gradient — text legibility */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/52 via-black/28 via-[42%] to-black/8 to-transparent sm:from-black/88 sm:via-black/62 sm:to-black/16" />

                {/* Focused vignette on hero copy */}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(circle at 21% 42%, rgba(0,0,0,0.48) 0%, rgba(0,0,0,0.2) 24%, transparent 52%)",
                    }}
                />

                {/* Top + bottom vignette */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/34 via-black/6 via-[36%] to-black/48 sm:from-black/58 sm:via-black/12 sm:to-black/70" />

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
                style={{
                    paddingTop: "clamp(6.5rem, 14vw, 11.5rem)",
                    paddingBottom: "clamp(2.75rem, 7vw, 5rem)",
                }}
            >
                <div className="flex justify-start">
                    <div
                        data-gsap="hero-panel"
                        className="hero-panel-glass relative mx-auto w-full max-w-[94vw] overflow-hidden rounded-[1.65rem] border border-white/12 sm:mx-0 sm:max-w-4xl sm:rounded-[2rem] sm:border-white/14"
                    >
                        <div
                            data-gsap="hero-panel-shimmer"
                            className="pointer-events-none absolute inset-y-[-12%] -left-[36%] w-[32%] opacity-0"
                            style={{
                                background:
                                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 22%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.06) 78%, transparent 100%)",
                                filter: "blur(10px)",
                                transform: "skewX(-22deg)",
                            }}
                        />
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent" />
                        <div className="absolute -left-20 top-16 h-44 w-44 rounded-full bg-[#D4AF37]/8 blur-3xl" />

                        <div className="relative px-4 py-4 xs:px-5 xs:py-5 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
                            {/* Eyebrow */}
                            <div data-gsap="hero-kicker" className="mb-4 flex flex-wrap items-center gap-2 sm:mb-6 sm:gap-3">
                                <span
                                    className="block h-px w-6 sm:w-7"
                                    style={{ background: "hsl(40 78% 62%)" }}
                                />
                                <span
                                    className="text-[9px] font-medium uppercase tracking-[0.28em] xs:text-[10px] xs:tracking-[0.36em] sm:tracking-[0.48em]"
                                    style={{ color: "hsl(44 78% 76%)" }}
                                >
                                    Aivestire · A New Atelier · est. Jaipur
                                </span>
                            </div>

                            <div data-gsap="hero-badges" className="mb-4 flex flex-wrap gap-1.5 sm:mb-6 sm:gap-2">
                                {heroHighlights.map((item) => (
                                    <span
                                        key={item}
                                        className="rounded-full px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] xs:px-3.5 xs:text-[10px] xs:tracking-[0.22em] sm:tracking-[0.24em]"
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
                                        style={{ fontSize: "clamp(1.75rem, 8.5vw, 5rem)" }}
                                    >
                                        Where Artisans
                                    </span>
                                </div>
                                <div className="overflow-hidden mt-1">
                                    <span
                                        data-gsap="hero-title-line"
                                        className="block"
                                        style={{ fontSize: "clamp(1.75rem, 8.5vw, 5rem)" }}
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
                                className="mt-4 leading-[1.7] sm:mt-6 sm:leading-[1.85]"
                                style={{
                                    fontSize: "clamp(0.98rem, 4vw, 1.17rem)",
                                    color: "rgba(255,255,255,0.82)",
                                    maxWidth: "34rem",
                                }}
                            >
                                A cinematic luxury storefront where Jaipur’s craft legacy is translated into
                                AI-powered styling, virtual try-on, and a more confident buying experience.
                            </p>

                            {/* CTA Row */}
                            <div data-gsap="hero-actions" className="mt-6 flex flex-col items-stretch gap-3 sm:mt-9 sm:flex-row sm:items-center sm:gap-4">
                                <Link
                                    to="/ai-try-on"
                                    data-gsap-hover="magnetic-strong"
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-center font-semibold transition-all duration-300 hover:scale-[1.03] sm:w-auto sm:px-8"
                                    style={{
                                        fontSize: "11px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.22em",
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
                                    data-gsap-hover="magnetic-soft"
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-center font-medium transition-all duration-300 hover:bg-white/10 hover:border-white/60 sm:w-auto sm:px-8"
                                    style={{
                                        fontSize: "11px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.22em",
                                        color: "rgba(255,255,255,0.92)",
                                        border: "1px solid rgba(255,255,255,0.24)",
                                        background: "rgba(255,255,255,0.04)",
                                    }}
                                >
                                    Discover Stories
                                </a>
                            </div>

                            {/* Stats */}
                            <div data-gsap="hero-stats" className="mt-6 grid grid-cols-3 gap-1.5 border-t border-white/10 pt-4 sm:mt-10 sm:gap-3 sm:pt-8">
                                {heroStats.map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-[0.75rem] border border-white/10 px-2 py-2.5 text-center sm:rounded-[1.25rem] sm:px-4 sm:py-4"
                                        style={{ background: "rgba(255,255,255,0.04)" }}
                                    >
                                        <div
                                            data-gsap="count-up"
                                            data-count-to={item.countTo}
                                            data-count-suffix={item.suffix}
                                            data-count-decimals={item.decimals ?? 0}
                                            className="font-serif leading-none"
                                            style={{
                                                fontSize: "clamp(1.1rem, 4vw, 2.7rem)",
                                                color: "rgba(255,255,255,0.96)",
                                            }}
                                        >
                                            {item.value}
                                        </div>
                                        <div
                                            className="mt-1 text-[7.5px] uppercase tracking-[0.1em] xs:tracking-[0.15em] sm:mt-3 sm:text-[10px] sm:tracking-[0.28em] leading-tight"
                                            style={{
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
                className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 sm:flex"
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
