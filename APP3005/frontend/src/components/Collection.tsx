import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

const collections = [
    {
        id: 1,
        title: "Summer Elegance",
        subtitle: "Handwoven Cottons",
        image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=600&h=800&auto=format&fit=crop",
        itemCount: 24,
        badge: "New",
    },
    {
        id: 2,
        title: "Winter Couture",
        subtitle: "Heritage Wool Blends",
        image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&h=800&auto=format&fit=crop",
        itemCount: 18,
        badge: "",
    },
    {
        id: 3,
        title: "Evening Glamour",
        subtitle: "Silk & Zari Weaves",
        image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=600&h=800&auto=format&fit=crop",
        itemCount: 32,
        badge: "Popular",
    },
    {
        id: 4,
        title: "Casual Chic",
        subtitle: "Block-print Daywear",
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&h=800&auto=format&fit=crop",
        itemCount: 28,
        badge: "",
    },
];

const CollectionCard = ({
    col,
    index,
    onClick,
}: {
    col: (typeof collections)[0];
    index: number;
    onClick: () => void;
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            onClick={onClick}
            className="group cursor-pointer"
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(30px)",
                transition: `opacity 0.8s ease ${index * 0.1}s, transform 0.8s ease ${index * 0.1}s`,
            }}
        >
            <div className="relative overflow-hidden rounded-xl aspect-[3/4] mb-4 shadow-lg">
                <img
                    src={col.image}
                    alt={col.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                    style={{ transition: "transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)" }}
                />

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/15 group-hover:bg-black/28 transition-colors duration-400" />

                {/* Badge */}
                {col.badge && (
                    <div
                        className="absolute top-4 left-4 px-3 py-1 text-[9px] uppercase tracking-[0.32em] font-bold rounded-full"
                        style={{
                            background: "linear-gradient(135deg, hsl(44 78% 56%), hsl(40 62% 44%))",
                            color: "hsl(30 14% 10%)",
                        }}
                    >
                        {col.badge}
                    </div>
                )}

                {/* Hover CTA */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                    <span
                        className="px-5 py-2 text-[10px] font-bold uppercase tracking-[0.28em] rounded-full backdrop-blur-sm"
                        style={{
                            background: "rgba(255,255,255,0.88)",
                            color: "#2C2416",
                            border: "1px solid rgba(212,175,55,0.3)",
                        }}
                    >
                        Explore
                    </span>
                </div>

                {/* Item count bottom */}
                <div
                    className="absolute bottom-0 left-0 right-0 px-5 py-4"
                    style={{
                        background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)",
                        opacity: 0,
                        transition: "opacity 0.4s ease",
                    }}
                >
                    <span className="text-white/70 text-[10px] uppercase tracking-wider">
                        {col.itemCount} pieces
                    </span>
                </div>
            </div>

            {/* Card text */}
            <div>
                <h3
                    className="font-serif text-base md:text-lg transition-colors duration-300 group-hover:text-[#D4AF37] mb-1"
                    style={{ color: "hsl(30 14% 12%)" }}
                >
                    {col.title}
                </h3>
                <p className="text-xs" style={{ color: "hsl(30 8% 50%)" }}>
                    {col.subtitle} · {col.itemCount} Items
                </p>
            </div>
        </div>
    );
};

export const Collection = () => {
    const navigate = useNavigate();
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
            id="collection"
            style={{
                background: "hsl(40 33% 96%)",
                padding: "7rem 0 8rem",
                position: "relative",
            }}
        >
            <div className="container-luxury">
                {/* Header */}
                <div
                    ref={headerRef}
                    className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6"
                    style={{
                        opacity: headerVisible ? 1 : 0,
                        transform: headerVisible ? "translateY(0)" : "translateY(24px)",
                        transition: "opacity 0.8s ease, transform 0.8s ease",
                    }}
                >
                    <div>
                        <div className="inline-flex items-center gap-3 mb-4">
                            <span
                                className="block h-px w-7"
                                style={{ background: "hsl(44 62% 52%)" }}
                            />
                            <span
                                className="text-[10px] uppercase tracking-[0.44em] font-semibold"
                                style={{ color: "hsl(44 60% 46%)" }}
                            >
                                Curated for you
                            </span>
                        </div>
                        <h2
                            className="font-serif leading-[1.1]"
                            style={{
                                fontSize: "clamp(1.8rem, 3.2vw, 2.8rem)",
                                color: "hsl(30 14% 12%)",
                            }}
                        >
                            Trending{" "}
                            <em
                                className="italic font-normal"
                                style={{ color: "hsl(44 62% 48%)" }}
                            >
                                Collections
                            </em>
                        </h2>
                    </div>

                    <button
                        onClick={() => navigate("/collection")}
                        className="flex items-center gap-2 group self-end md:self-auto"
                        style={{
                            fontSize: "11px",
                            textTransform: "uppercase",
                            letterSpacing: "0.28em",
                            fontWeight: 600,
                            color: "hsl(30 14% 12%)",
                        }}
                    >
                        <span>View All</span>
                        <ArrowRight
                            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                        />
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-7">
                    {collections.map((col, i) => (
                        <CollectionCard
                            key={col.id}
                            col={col}
                            index={i}
                            onClick={() => navigate("/collection")}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};
