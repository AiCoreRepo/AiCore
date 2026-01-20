import { useEffect, useRef, useState } from "react";
import { Sparkles, ScanFace, Shirt, Rotate3D, Bot } from "lucide-react";
import iconAura from "@/assets/icon-aura.png";
import iconTryon from "@/assets/icon-tryon.png";
import icon360 from "@/assets/icon-360.png";
import iconStylist from "@/assets/icon-stylist.png";

export const HowItWorks = () => {
    const [visibleItems, setVisibleItems] = useState<number[]>([]);
    const sectionRef = useRef<HTMLElement>(null);

    const steps = [
        {
            id: 1,
            title: "Create Your Aura",
            subtitle: "Digital Identity",
            description: "Upload a single photo. Our advanced AI scans your measurements and posture to create a hyper-realistic digital twin—your 'Aura'. It's not just an avatar; it's you.",
            image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop",
            icon: ScanFace,
            cartoonIcon: iconAura,
            align: "left"
        },
        {
            id: 2,
            title: "Instant Virtual Try-On",
            subtitle: "Seamless Fit",
            description: "Browse our premium collection and tap to try. Watch as fabrics drape naturally over your Aura, respecting gravity, texture, and your unique body shape.",
            image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop",
            icon: Shirt,
            cartoonIcon: iconTryon,
            align: "right"
        },
        {
            id: 3,
            title: "360° Perspective",
            subtitle: "Every Angle Matters",
            description: "Don't just guess. View your outfit from the front, side, and back. Ensure the fit is perfect from every perspective before you buy.",
            image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
            icon: Rotate3D,
            cartoonIcon: icon360,
            align: "left"
        },
        {
            id: 4,
            title: "AI Personal Stylist",
            subtitle: "Smart Recommendations",
            description: "Not sure what matches? Our AI suggests accessories, shoes, and complementary pieces to complete your look based on your Aura's style profile.",
            image: "https://images.unsplash.com/photo-1485217988980-11786ced9454?q=80&w=800&auto=format&fit=crop",
            icon: Bot,
            cartoonIcon: iconStylist,
            align: "right"
        }
    ];

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = Number(entry.target.getAttribute("data-id"));
                        if (!visibleItems.includes(id)) {
                            setVisibleItems((prev) => [...prev, id]);
                        }
                    }
                });
            },
            { threshold: 0.2 }
        );

        const elements = document.querySelectorAll(".step-card");
        elements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [visibleItems]);

    return (
        <section ref={sectionRef} className="py-20 bg-[#F8F4EC] overflow-hidden">
            <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 border border-[#D4AF37]/20 bg-[#D4AF37]/5">
                        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span className="text-xs tracking-[0.2em] uppercase font-bold text-[#D4AF37]">
                            Experience the Future
                        </span>
                    </div>
                    <h2 className="font-serif text-3xl md:text-5xl font-bold mb-6 text-[#2C2416]">
                        How It <span className="text-[#D4AF37] italic">Works</span>
                    </h2>
                    <p className="text-[#6B5D4F] max-w-2xl mx-auto text-lg leading-relaxed mb-16">
                        Embark on a personalized fashion journey where technology meets elegance.
                    </p>

                    {/* NEW: Process Flow Overview - Premium Realistic Design */}
                    <div className="hidden md:block relative max-w-6xl mx-auto mb-24 animate-fadeIn">
                        {/* Realistic Glass Card */}
                        <div className="relative px-16 py-14 bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-[0_20px_50px_rgba(212,175,55,0.15)] overflow-visible">

                            {/* Connecting Line - Gold Thread Effect */}
                            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-[#E8DCC4] -translate-y-1/2 z-0" />
                            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent -translate-y-1/2 z-0 animate-shimmer opacity-80" />

                            <div className="relative z-10 flex justify-between items-start">
                                {steps.map((step) => (
                                    <div key={step.id} className="flex flex-col items-center group cursor-pointer w-48 transition-all duration-500 hover:-translate-y-3">
                                        {/* Step Number Floating Badge */}
                                        <div className="mb-2 relative">
                                            <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B4941F] text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-[#D4AF37]/30 z-20 border-2 border-white">
                                                {step.id}
                                            </span>

                                            {/* Realistic Button/Icon Circle with Image */}
                                            <div className="relative w-28 h-28 rounded-full bg-white flex items-center justify-center transition-all duration-500 group-hover:scale-110 z-10 shadow-[0_15px_35px_rgba(0,0,0,0.1)] group-hover:shadow-[0_20px_40px_rgba(212,175,55,0.25)] ring-4 ring-white overflow-hidden">
                                                {/* Soft outer glow */}
                                                <div className="absolute inset-0 rounded-full bg-[#D4AF37] opacity-0 blur-xl group-hover:opacity-20 transition-opacity duration-500" />

                                                {/* Button body */}
                                                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white to-[#F9F6F0]" />

                                                {/* Cartoon Icon Image - Full Fit */}
                                                <img
                                                    src={step.cartoonIcon}
                                                    alt={step.title}
                                                    className="relative z-10 w-full h-full object-cover rounded-full animate-float group-hover:scale-110 transition-transform duration-700"
                                                />

                                                {/* Gold Ring Overlay */}
                                                <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37]/20 group-hover:border-[#D4AF37] transition-colors duration-500 z-20 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Steps Zig-Zag Layout */}
                <div className="space-y-24 md:space-y-32">
                    {steps.map((step, index) => (
                        <div
                            key={step.id}
                            data-id={step.id}
                            className={`step-card flex flex-col md:flex-row items-center gap-10 md:gap-20 transition-all duration-1000 transform ${visibleItems.includes(step.id)
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 translate-y-20"
                                } ${step.align === "right" ? "md:flex-row-reverse" : ""}`}
                        >
                            {/* Image Side */}
                            <div className="w-full md:w-1/2 relative group">
                                <div className="absolute inset-0 bg-[#D4AF37] rounded-3xl transform translate-x-3 translate-y-3 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-500 ease-out opacity-20" />
                                <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl">
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
                                    <img
                                        src={step.image}
                                        alt={step.title}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                                    />

                                    {/* Floating Badge */}
                                    <div className="absolute top-6 left-6 z-20 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                                        <step.icon className="w-4 h-4 text-[#D4AF37]" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-[#2C2416]">Step 0{step.id}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Content Side */}
                            <div className="w-full md:w-1/2 text-center md:text-left">
                                <div className="mb-4 inline-block">
                                    <span className="text-[#D4AF37] font-serif italic text-xl md:text-2xl opacity-60">
                                        {step.subtitle}
                                    </span>
                                </div>
                                <h3 className="text-3xl md:text-4xl font-bold text-[#2C2416] mb-6 font-serif">
                                    {step.title}
                                </h3>
                                <p className="text-[#6B5D4F] text-lg leading-relaxed mb-8">
                                    {step.description}
                                </p>
                                <div className="flex items-center justify-center md:justify-start gap-4">
                                    <div className="h-px w-12 bg-[#D4AF37]" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                                        Aivestire Tech
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
