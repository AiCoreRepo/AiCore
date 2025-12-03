import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";

const products = [
    { id: 1, name: "Gold Silk Evening Gown", price: "$125.00", image: product1 },
    { id: 2, name: "Timeless Cashmere Coat", price: "$55.00", image: product2 },
    { id: 3, name: "Sculptural Black Top", price: "$25.00", image: product3 },
    { id: 4, name: "Tailored Trousers", price: "$125.00", image: product4 },
    { id: 5, name: "Statement Necklace", price: "$78.00", image: product5 },
    { id: 6, name: "Clutch Bag", price: "$78.00", image: product6 },
];

const filters = ["All", "Dresses", "Outerwear", "Accessories"];

export const Collection = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeFilter, setActiveFilter] = useState("All");

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = 400;
            scrollRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    return (
        <section
            id="collection"
            className="py-12 md:py-16 relative"
            style={{
                background: 'linear-gradient(180deg, rgba(242, 234, 216, 0.7) 0%, rgba(232, 220, 200, 0.8) 50%, rgba(242, 234, 216, 0.7) 100%)',
            }}
        >
            <div className="container-luxury">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="font-serif text-3xl md:text-4xl text-charcoal mb-4">
                        Curated Collection
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Explore our handpicked selection of timeless pieces, each designed to elevate your wardrobe.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex justify-center gap-3 mb-8 flex-wrap">
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${activeFilter === filter
                                    ? "text-charcoal shadow-md"
                                    : "text-charcoal/70 hover:text-charcoal"
                                }`}
                            style={{
                                background: activeFilter === filter
                                    ? 'linear-gradient(135deg, rgba(201, 165, 92, 0.3) 0%, rgba(201, 165, 92, 0.4) 100%)'
                                    : 'linear-gradient(135deg, rgba(232, 220, 200, 0.8) 0%, rgba(242, 234, 216, 0.7) 100%)',
                                border: activeFilter === filter
                                    ? '1.5px solid rgba(201, 165, 92, 0.5)'
                                    : '1px solid rgba(201, 165, 92, 0.2)',
                                boxShadow: activeFilter === filter
                                    ? '0 4px 12px rgba(201, 165, 92, 0.25)'
                                    : '0 2px 6px rgba(201, 165, 92, 0.1)',
                            }}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                {/* Products Carousel */}
                <div className="relative">
                    {/* Navigation Arrows */}
                    <button
                        onClick={() => scroll("left")}
                        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 items-center justify-center rounded-full backdrop-blur-xl transition-all duration-300 hover:scale-110"
                        style={{
                            background: 'linear-gradient(135deg, rgba(232, 220, 200, 0.95) 0%, rgba(242, 234, 216, 0.9) 100%)',
                            boxShadow: '0 4px 16px rgba(201, 165, 92, 0.2)',
                            border: '1px solid rgba(201, 165, 92, 0.3)',
                        }}
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="w-6 h-6 text-gold" />
                    </button>

                    <button
                        onClick={() => scroll("right")}
                        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 items-center justify-center rounded-full backdrop-blur-xl transition-all duration-300 hover:scale-110"
                        style={{
                            background: 'linear-gradient(135deg, rgba(232, 220, 200, 0.95) 0%, rgba(242, 234, 216, 0.9) 100%)',
                            boxShadow: '0 4px 16px rgba(201, 165, 92, 0.2)',
                            border: '1px solid rgba(201, 165, 92, 0.3)',
                        }}
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="w-6 h-6 text-gold" />
                    </button>

                    {/* Products Grid */}
                    <div
                        ref={scrollRef}
                        className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
                        style={{ scrollbarWidth: "none" }}
                    >
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="flex-shrink-0 w-72 group cursor-pointer"
                            >
                                <div
                                    className="relative overflow-hidden rounded-3xl mb-4 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(232, 220, 200, 0.9) 0%, rgba(242, 234, 216, 0.85) 100%)',
                                        boxShadow: '0 4px 20px rgba(201, 165, 92, 0.15)',
                                        border: '1px solid rgba(201, 165, 92, 0.25)',
                                    }}
                                >
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-6">
                                        <button
                                            className="px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 hover:scale-105"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(201, 165, 92, 0.9) 0%, rgba(201, 165, 92, 1) 100%)',
                                                color: '#212121',
                                                boxShadow: '0 4px 16px rgba(201, 165, 92, 0.4)',
                                            }}
                                        >
                                            Try on with AI
                                        </button>
                                    </div>
                                    {/* Quick View Icon */}
                                    <button
                                        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(232, 220, 200, 0.95) 0%, rgba(242, 234, 216, 0.9) 100%)',
                                            boxShadow: '0 4px 12px rgba(201, 165, 92, 0.3)',
                                            border: '1px solid rgba(201, 165, 92, 0.4)',
                                        }}
                                        aria-label="Add to cart"
                                    >
                                        <ShoppingCart className="w-5 h-5 text-gold" />
                                    </button>
                                </div>
                                {/* Product Info */}
                                <div className="text-center">
                                    <h3 className="font-serif text-lg text-charcoal mb-1 group-hover:text-gold transition-colors duration-300">
                                        {product.name}
                                    </h3>
                                    <p className="text-gold font-medium">{product.price}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
