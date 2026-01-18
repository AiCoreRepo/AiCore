import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const Collection = () => {
    const navigate = useNavigate();

    const collections = [
        {
            id: 1,
            title: "Summer Elegance",
            image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=300&h=400&fit=crop",
            itemCount: 24,
        },
        {
            id: 2,
            title: "Winter Couture",
            image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&h=400&fit=crop",
            itemCount: 18,
        },
        {
            id: 3,
            title: "Evening Glamour",
            image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&h=400&fit=crop",
            itemCount: 32,
        },
        {
            id: 4,
            title: "Casual Chic",
            image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&h=400&fit=crop",
            itemCount: 28,
        },
    ];

    return (
        <section className="py-20 bg-[#F8F4EC]">
            <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                {/* Minimal Header */}
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#2C2416]">
                            Trending <span className="text-[#D4AF37]">Collections</span>
                        </h2>
                    </div>
                </div>

                {/* Compact Grid - Clean and Elegant */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                    {collections.map((collection) => (
                        <div
                            key={collection.id}
                            onClick={() => navigate('/collection')}
                            className="group cursor-pointer"
                        >
                            <div className="relative overflow-hidden rounded-lg aspect-[3/4] mb-3">
                                <img
                                    src={collection.image}
                                    alt={collection.title}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors duration-300" />

                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <span className="px-4 py-1.5 bg-white/90 backdrop-blur text-[#2C2C2C] text-xs font-bold uppercase tracking-wider rounded-full">
                                        View
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-serif text-base text-[#2C2416] group-hover:text-[#D4AF37] transition-colors">
                                    {collection.title}
                                </h3>
                                <p className="text-xs text-[#6B5D4F]">
                                    {collection.itemCount} Items
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* View All */}
                <div className="text-center mt-8">
                    <button
                        onClick={() => navigate('/collection')}
                        className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2C2416] hover:text-[#D4AF37] transition-colors flex items-center justify-center gap-2"
                    >
                        View All Collections
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </section>
    );
};
