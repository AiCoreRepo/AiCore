import { Link } from "react-router-dom";
import {
    ArrowRight,
    BrainCircuit,
    Orbit,
    PackageCheck,
    Scissors,
    Sparkles,
    Users,
} from "lucide-react";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { cloudinaryImages } from "@/constants/cloudinaryImages";

const pillars = [
    {
        title: "Our mission",
        icon: Sparkles,
        description:
            "Build a fashion experience where heritage craft and AI work together to make discovery, confidence, and personal style easier.",
    },
    {
        title: "Help artisans",
        icon: Users,
        description:
            "Give artisans and independent creators a stronger digital stage so their work reaches more people with better visibility and value.",
    },
    {
        title: "Virtual try-on",
        icon: Orbit,
        description:
            "Let shoppers preview outfits before buying so decisions feel more informed, personal, and less risky.",
    },
    {
        title: "Less returns",
        icon: PackageCheck,
        description:
            "Reduce mismatch-driven returns by helping customers choose styles with more clarity before checkout.",
    },
];

const capabilityCards = [
    {
        title: "Recommendation model",
        icon: BrainCircuit,
        description:
            "Our recommendation layer connects visual preference, product signals, and personal style cues to surface choices that feel more relevant.",
    },
    {
        title: "Artisan-first catalog",
        icon: Scissors,
        description:
            "Collections are positioned not just as products, but as stories of craft, technique, and regional making traditions.",
    },
];

const impactPoints = [
    "Better confidence before purchase",
    "Smarter matching between shoppers and styles",
    "More visibility for skilled artisan work",
    "Lower friction across browsing, try-on, and buying",
];

const AboutPage = () => {
    return (
        <div className="min-h-screen overflow-x-hidden bg-[#0f0a07] text-[#F8F2E9]">
            <Navbar />

            <main className="relative">
                <section className="relative overflow-hidden border-b border-white/10 pt-24 sm:pt-28 lg:pt-32">
                    <div className="absolute inset-0">
                        <img
                            src={cloudinaryImages.stories.jaipurTextileMarket}
                            alt="Textile market and heritage craft"
                            className="h-full w-full object-cover opacity-20"
                        />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.22),transparent_34%),linear-gradient(180deg,rgba(15,10,7,0.3)_0%,rgba(15,10,7,0.88)_60%,#0f0a07_100%)]" />
                    </div>

                    <div className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-10 lg:pb-24">
                        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-end lg:gap-10">
                            <div className="max-w-3xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#E7C870]">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    About AiVestire
                                </div>
                                <h1 className="mt-6 max-w-4xl font-serif text-[2.5rem] leading-[1.02] text-white sm:text-5xl lg:text-7xl">
                                    Fashion technology built to support craft,
                                    confidence, and better choices.
                                </h1>
                                <p className="mt-6 max-w-2xl text-base leading-8 text-[#E8DED0]/72 sm:text-lg">
                                    AiVestire brings together artisan-led fashion,
                                    virtual try-on, and recommendation intelligence
                                    to make online shopping feel more personal and
                                    more reliable.
                                </p>

                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <Link
                                        to="/collection"
                                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#1a120c] transition-colors hover:bg-[#E6C15A]"
                                    >
                                        Explore Collection
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    <Link
                                        to="/ai-try-on"
                                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-[#F8F2E9] transition-colors hover:border-[#D4AF37]/45 hover:bg-[#D4AF37]/10"
                                    >
                                        Try Virtual Try-On
                                    </Link>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {pillars.map((pillar) => {
                                    const Icon = pillar.icon;

                                    return (
                                        <article
                                            key={pillar.title}
                                            className="rounded-[24px] border border-white/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.03)_100%)] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-sm sm:rounded-[28px]"
                                        >
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#E7C870]">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <h2 className="mt-4 font-serif text-[1.55rem] text-white sm:text-2xl">
                                                {pillar.title}
                                            </h2>
                                            <p className="mt-3 text-sm leading-7 text-[#E8DED0]/68">
                                                {pillar.description}
                                            </p>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.88fr)] lg:px-10 lg:py-20">
                    <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[#18120d] shadow-[0_24px_64px_rgba(0,0,0,0.28)] sm:rounded-[30px]">
                        <img
                            src={cloudinaryImages.stories.jaipurArtisansThread}
                            alt="Artisans working with textile threads"
                            className="h-[280px] w-full object-cover sm:h-[360px] lg:h-full lg:min-h-[320px]"
                            loading="lazy"
                        />
                    </div>

                    <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(160deg,rgba(212,175,55,0.08)_0%,rgba(255,255,255,0.02)_100%)] p-6 sm:rounded-[30px] sm:p-8">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
                            Helping artisans
                        </p>
                        <h2 className="mt-3 font-serif text-3xl leading-tight text-white sm:text-4xl">
                            A stronger digital storefront for makers and craft-led collections.
                        </h2>
                        <p className="mt-5 text-sm leading-7 text-[#E8DED0]/70 sm:text-[15px]">
                            We want handcrafted fashion to be discovered with the
                            same clarity and confidence people expect from modern
                            e-commerce. That means better product presentation,
                            better storytelling, and a better path between artisan
                            work and customer demand.
                        </p>
                        <p className="mt-4 text-sm leading-7 text-[#E8DED0]/70 sm:text-[15px]">
                            Our goal is not only to sell garments. It is to make
                            skilled work easier to find, easier to appreciate, and
                            easier to buy in a digital environment.
                        </p>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-10 lg:pb-20">
                    <div className="grid gap-6 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
                        <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(165deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_100%)] p-6 sm:rounded-[30px] sm:p-8">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
                                AI experience
                            </p>
                            <h2 className="mt-3 font-serif text-3xl leading-tight text-white sm:text-4xl">
                                Virtual try-on and recommendation intelligence in one flow.
                            </h2>
                            <p className="mt-5 text-sm leading-7 text-[#E8DED0]/70 sm:text-[15px]">
                                AiVestire is designed to move from inspiration to
                                decision-making with less guesswork. Virtual try-on
                                helps customers see outfits in a more personal
                                context, while recommendation logic helps narrow
                                choices based on what is most likely to fit their
                                taste and intent.
                            </p>

                            <div className="mt-6 grid gap-3">
                                {capabilityCards.map((card) => {
                                    const Icon = card.icon;

                                    return (
                                        <article
                                            key={card.title}
                                            className="rounded-[24px] border border-white/10 bg-black/15 p-5"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#E7C870]">
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <h3 className="font-serif text-[1.45rem] text-white sm:text-2xl">
                                                    {card.title}
                                                </h3>
                                            </div>
                                            <p className="mt-3 text-sm leading-7 text-[#E8DED0]/68">
                                                {card.description}
                                            </p>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[#17110d] shadow-[0_24px_64px_rgba(0,0,0,0.26)] sm:rounded-[30px]">
                            <img
                                src={cloudinaryImages.stories.aiBridge}
                                alt="AI and fashion bridge concept"
                                className="h-[300px] w-full object-cover sm:h-[380px] lg:h-full lg:min-h-[320px]"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-10 lg:pb-24">
                    <div className="overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_28%),linear-gradient(160deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_100%)] p-6 sm:p-8 lg:p-10">
                        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
                                    Why it matters
                                </p>
                                <h2 className="mt-3 font-serif text-3xl leading-tight text-white sm:text-4xl">
                                    Better recommendation and try-on can mean fewer returns.
                                </h2>
                                <p className="mt-5 text-sm leading-7 text-[#E8DED0]/72 sm:text-[15px]">
                                    One of the biggest problems in fashion commerce
                                    is uncertainty. When customers cannot judge fit,
                                    styling, or relevance, return risk increases.
                                    We want to reduce that gap by helping people
                                    choose with more information and more confidence.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {impactPoints.map((point) => (
                                    <div
                                        key={point}
                                        className="rounded-[24px] border border-white/10 bg-[#120e0b] p-5 text-sm leading-7 text-[#F8F2E9]/78"
                                    >
                                        <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#D4AF37]/12 text-[#D4AF37]">
                                            <PackageCheck className="h-4 w-4" />
                                        </span>
                                        <p>{point}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row">
                            <Link
                                to="/collection"
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-[#F8F2E9] transition-colors hover:border-[#D4AF37]/45 hover:bg-[#D4AF37]/10"
                            >
                                Browse Collection
                            </Link>
                            <Link
                                to="/user-signup"
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#1a120c] transition-colors hover:bg-[#E6C15A]"
                            >
                                Start With AiVestire
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default AboutPage;
