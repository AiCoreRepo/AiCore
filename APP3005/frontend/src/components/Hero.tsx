import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import jaipurVideo from "@/assets/JaipurDev.mp4";

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
            style={{ minHeight: "100vh" }}
        >
            {/* ── VIDEO BACKGROUND ── */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <video
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
                        filter: "brightness(1.12) saturate(1.15) contrast(1.03)",
                    }}
                />

                {/* Global dark tint */}
                <div className="pointer-events-none absolute inset-0 bg-black/28" />

                {/* Left gradient — text legibility */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/72 via-black/30 via-[40%] to-transparent" />

                {/* Top + bottom vignette */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent via-[35%] to-black/50" />

                {/* Subtle gold glow at center-bottom */}
                <div
                    className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2"
                    style={{
                        width: "70vw",
                        height: "30rem",
                        borderRadius: "50%",
                        background: "radial-gradient(ellipse, rgba(212,175,55,0.08) 0%, transparent 70%)",
                        filter: "blur(40px)",
                    }}
                />
            </div>

            {/* ── CONTENT ── */}
            <div
                className="relative z-10 container-luxury flex flex-col justify-center text-left w-full h-full"
                style={{ paddingTop: "8rem", paddingBottom: "5rem" }}
            >
                <div
                    className="max-w-3xl flex flex-col items-start animate-fade-up"
                >
                    {/* Eyebrow */}
                    <div className="flex items-center gap-3 mb-8">
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

                    {/* Headline */}
                    <h1
                        className="font-serif text-white leading-[1.08]"
                        style={{ fontSize: "clamp(2.4rem, 5.5vw, 4.5rem)" }}
                    >
                        Where Artisans{" "}
                        <br />
                        Meet{" "}
                        <span
                            style={{
                                background:
                                    "linear-gradient(135deg, hsl(44 78% 70%), hsl(40 62% 52%), hsl(35 55% 40%))",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                            }}
                        >
                            Intelligence
                        </span>
                    </h1>

                    {/* Sub-headline */}
                    <p
                        className="mt-6 leading-[1.8]"
                        style={{
                            fontSize: "clamp(1rem, 1.6vw, 1.15rem)",
                            color: "rgba(255,255,255,0.7)",
                            maxWidth: "36rem",
                        }}
                    >
                        From Jaipur's streets to AI-powered fashion experiences.
                    </p>

                    {/* CTA Row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-10">
                        <Link
                            to="/ai-try-on"
                            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 font-semibold transition-all duration-300 hover:scale-[1.03]"
                            style={{
                                fontSize: "11px",
                                textTransform: "uppercase",
                                letterSpacing: "0.3em",
                                background:
                                    "linear-gradient(135deg, hsl(44 78% 56%), hsl(40 62% 44%))",
                                color: "hsl(30 14% 10%)",
                            }}
                        >
                            Explore Experience
                        </Link>

                        <a
                            href="#stories"
                            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 font-medium transition-all duration-300 hover:bg-white/10 hover:border-white/60"
                            style={{
                                fontSize: "11px",
                                textTransform: "uppercase",
                                letterSpacing: "0.3em",
                                color: "rgba(255,255,255,0.85)",
                                border: "1px solid rgba(255,255,255,0.28)",
                            }}
                        >
                            Discover Stories
                        </a>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap justify-start gap-8 sm:gap-14 mt-16 border-t border-white/10 pt-10 w-full">
                        {[
                            ["240+", "Master Artisans"],
                            ["18", "Heritage Crafts"],
                            ["1.2M+", "AI Try-Ons"],
                        ].map(([num, label]) => (
                            <div key={label} className="flex flex-col items-start">
                                <span
                                    className="font-serif leading-none"
                                    style={{
                                        fontSize: "2.5rem",
                                        color: "rgba(255,255,255,0.95)",
                                    }}
                                >
                                    {num}
                                </span>
                                <span
                                    className="uppercase tracking-[0.32em] mt-2"
                                    style={{
                                        fontSize: "10px",
                                        color: "rgba(255,255,255,0.5)",
                                    }}
                                >
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Side label */}
            <div
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
                className="absolute left-1/2 bottom-8 -translate-x-1/2 flex flex-col items-center gap-2"
                style={{ color: "rgba(255,255,255,0.32)" }}
            >
                <span style={{ fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.42em" }}>
                    Scroll
                </span>
                <div
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
