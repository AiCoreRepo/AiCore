import { useEffect, useRef, useState } from "react";
import { ScanFace, Shirt, Rotate3D, Bot } from "lucide-react";
import { cloudinaryImages } from "@/constants/cloudinaryImages";

const steps = [
    {
        id: 1,
        eyebrow: "Step One",
        title: "Create Your Aura",
        subtitle: "Digital Identity",
        description:
            "Upload a single photo. Our advanced AI scans your measurements and posture to create a hyper-realistic digital twin — your Aura. It's not just an avatar; it's you.",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=900&auto=format&fit=crop",
        icon: ScanFace,
        cartoonIcon: cloudinaryImages.icons.aura,
        align: "left",
    },
    {
        id: 2,
        eyebrow: "Step Two",
        title: "Instant Virtual Try-On",
        subtitle: "Seamless Fit",
        description:
            "Browse our premium collection and tap to try. Watch as fabrics drape naturally over your Aura, respecting gravity, texture, and your unique body shape.",
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=900&auto=format&fit=crop",
        icon: Shirt,
        cartoonIcon: cloudinaryImages.icons.tryOn,
        align: "right",
    },
    {
        id: 3,
        eyebrow: "Step Three",
        title: "360° Perspective",
        subtitle: "Every Angle Matters",
        description:
            "Don't just guess. View your outfit from the front, side, and back. Ensure the fit is perfect from every perspective before you buy.",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=900&auto=format&fit=crop",
        icon: Rotate3D,
        cartoonIcon: cloudinaryImages.icons.image360,
        align: "left",
    },
    {
        id: 4,
        eyebrow: "Step Four",
        title: "AI Personal Stylist",
        subtitle: "Smart Recommendations",
        description:
            "Not sure what matches? Our AI suggests accessories, shoes, and complementary pieces to complete your look based on your Aura's unique style profile.",
        image: "https://images.unsplash.com/photo-1485217988980-11786ced9454?q=80&w=900&auto=format&fit=crop",
        icon: Bot,
        cartoonIcon: cloudinaryImages.icons.stylist,
        align: "right",
    },
];

const StepCard = ({
    step,
    isRight,
}: {
    step: (typeof steps)[0];
    isRight: boolean;
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.18 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`flex flex-col ${isRight ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-12 lg:gap-20`}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible
                    ? "translateY(0)"
                    : `translateY(40px) translateX(${isRight ? "30px" : "-30px"})`,
                transition: "opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1)",
            }}
        >
            {/* Image side */}
            <div className="w-full lg:w-1/2 relative group">
                {/* Gold shadow offset */}
                <div
                    className="absolute inset-0 rounded-2xl transition-transform duration-500 group-hover:translate-x-1 group-hover:translate-y-1"
                    style={{
                        background: "hsl(44 62% 56%)",
                        transform: "translate(10px, 10px)",
                        opacity: 0.14,
                    }}
                />
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-2xl">
                    <img
                        src={step.image}
                        alt={step.title}
                        loading="lazy"
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />

                    {/* Step number badge */}
                    <div
                        className="absolute top-5 left-5 flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm"
                        style={{
                            background: "rgba(255,255,255,0.88)",
                            border: "1px solid rgba(212,175,55,0.3)",
                        }}
                    >
                        <step.icon className="w-4 h-4" style={{ color: "#D4AF37" }} />
                        <span
                            className="text-[10px] font-bold uppercase tracking-widest"
                            style={{ color: "#2C2416" }}
                        >
                            {step.eyebrow}
                        </span>
                    </div>

                    {/* Cartoon icon overlay */}
                    <div className="absolute bottom-4 right-4 w-14 h-14 rounded-full overflow-hidden ring-2 ring-white/40 shadow-xl">
                        <img src={step.cartoonIcon} alt="" className="w-full h-full object-cover" />
                    </div>
                </div>
            </div>

            {/* Text side */}
            <div className={`w-full lg:w-1/2 ${isRight ? "lg:text-right" : ""}`}>
                <span
                    className="font-serif italic text-xl mb-3 block"
                    style={{ color: "hsl(44 62% 52%)", opacity: 0.7 }}
                >
                    {step.subtitle}
                </span>

                <h3
                    className="font-serif leading-[1.15] mb-5"
                    style={{
                        fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
                        color: "hsl(30 14% 12%)",
                    }}
                >
                    {step.title}
                </h3>

                <p
                    className="leading-relaxed mb-8"
                    style={{
                        fontSize: "1rem",
                        color: "hsl(30 8% 40%)",
                        lineHeight: 1.82,
                        maxWidth: "34rem",
                    }}
                >
                    {step.description}
                </p>

                <div
                    className={`flex items-center gap-4 ${isRight ? "lg:justify-end" : ""}`}
                >
                    <div
                        className="h-px"
                        style={{ width: "2.5rem", background: "hsl(44 62% 52%)" }}
                    />
                    <span
                        className="text-[10px] font-bold uppercase tracking-[0.38em]"
                        style={{ color: "hsl(44 62% 46%)" }}
                    >
                        Aivestire Intelligence
                    </span>
                </div>
            </div>
        </div>
    );
};

export const HowItWorks = () => {
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
        <section
            id="how-it-works"
            style={{
                background: "hsl(40 28% 95%)",
                padding: "8rem 0 9rem",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Subtle radial */}
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    top: "0",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "80vw",
                    height: "40rem",
                    background:
                        "radial-gradient(ellipse, rgba(212,175,55,0.06) 0%, transparent 70%)",
                    filter: "blur(50px)",
                    pointerEvents: "none",
                }}
            />

            <div className="container-luxury">
                {/* Header */}
                <div
                    ref={headerRef}
                    className="text-center mb-24"
                    style={{
                        opacity: headerVisible ? 1 : 0,
                        transform: headerVisible ? "translateY(0)" : "translateY(24px)",
                        transition: "opacity 0.8s ease, transform 0.8s ease",
                    }}
                >
                    <div className="inline-flex items-center gap-3 mb-5">
                        <span className="block h-px w-8" style={{ background: "hsl(44 62% 52%)" }} />
                        <span
                            className="text-[10px] uppercase tracking-[0.48em] font-semibold"
                            style={{ color: "hsl(44 60% 46%)" }}
                        >
                            Experience the Future
                        </span>
                        <span className="block h-px w-8" style={{ background: "hsl(44 62% 52%)" }} />
                    </div>

                    <h2
                        className="font-serif leading-[1.12]"
                        style={{
                            fontSize: "clamp(2rem, 4vw, 3.4rem)",
                            color: "hsl(30 14% 12%)",
                        }}
                    >
                        How It{" "}
                        <em
                            className="italic font-normal"
                            style={{ color: "hsl(44 62% 48%)" }}
                        >
                            Works
                        </em>
                    </h2>

                    <p
                        className="mt-5 mx-auto leading-relaxed"
                        style={{
                            fontSize: "1rem",
                            color: "hsl(30 8% 44%)",
                            maxWidth: "36rem",
                            lineHeight: 1.78,
                        }}
                    >
                        Embark on a personalised fashion journey where technology meets
                        heritage elegance — step by step.
                    </p>
                </div>

                {/* Steps */}
                <div className="space-y-28 lg:space-y-36">
                    {steps.map((step) => (
                        <StepCard
                            key={step.id}
                            step={step}
                            isRight={step.align === "right"}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};
