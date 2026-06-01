import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { IMG } from "@/constants/cloudinary-images";

const heroPillars = ["Artisan collections", "AI try-on", "Personal styling"];

export const Hero = () => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        videoRef.current?.play().catch(() => {});
    }, []);

    return (
        <section
            id="hero"
            className="relative flex min-h-[92svh] w-full items-end overflow-hidden bg-[#15110D] pt-28 sm:min-h-screen"
        >
            <div className="absolute inset-0">
                <video
                    data-gsap="hero-video"
                    ref={videoRef}
                    src={IMG.jaipurDevVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    className="h-full w-full object-cover"
                    style={{ filter: "brightness(0.82) saturate(0.9)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/54 via-black/26 to-[#15110D]/96" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/10" />
            </div>

            <div className="container-luxury relative z-10 pb-14 sm:pb-20 lg:pb-24">
                <div className="max-w-3xl">
                    <div data-gsap="hero-kicker" className="mb-5 flex items-center gap-3">
                        <span className="h-px w-8 bg-[#C89A45]" />
                        <span className="text-xs font-semibold uppercase text-[#E6D7BF]">
                            Jaipur craft, refined by technology
                        </span>
                    </div>

                    <h1
                        data-gsap="hero-title"
                        className="font-serif text-5xl font-medium leading-none text-[#FFF8EC] sm:text-6xl lg:text-7xl"
                    >
                        <span data-gsap="hero-title-line" className="block">
                            Aivestire
                        </span>
                    </h1>

                    <p
                        data-gsap="hero-copy"
                        className="mt-5 max-w-2xl text-lg leading-8 text-[#F7EBDD]/80 sm:text-xl sm:leading-9"
                    >
                        A cleaner way to discover artisan fashion: see the story, try the fit, and choose pieces that feel personal before you buy.
                    </p>

                    <div data-gsap="hero-actions" className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link
                            to="/collection"
                            data-gsap-hover="magnetic-strong"
                            className="inline-flex items-center justify-center rounded-full bg-[#E6D7BF] px-7 py-3 text-sm font-semibold text-[#18120D] transition-colors hover:bg-white"
                        >
                            Explore collection
                        </Link>
                        <Link
                            to="/ai-try-on"
                            data-gsap-hover="magnetic-soft"
                            className="inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
                        >
                            Try it on
                        </Link>
                    </div>

                    <div data-gsap="hero-badges" className="mt-8 flex flex-wrap gap-2">
                        {heroPillars.map((item) => (
                            <span
                                key={item}
                                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-[#F7EBDD]/80"
                            >
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div
                data-gsap="hero-scroll"
                className="absolute bottom-6 right-6 hidden text-sm text-white/40 sm:block"
            >
                Scroll
            </div>
        </section>
    );
};
