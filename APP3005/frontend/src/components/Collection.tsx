import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Eye } from "lucide-react";
import { usePublicProducts } from "@/hooks/usePublicProducts";

const filters = ["All", "Dresses", "Outerwear", "Accessories", "Tops", "Bottoms"];

export const Collection = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeFilter, setActiveFilter] = useState("All");

    // Fetch products from backend
    const { data, isLoading, error } = usePublicProducts(1, undefined, activeFilter);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = 400;
            scrollRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    // Format price from cents
    const formatPrice = (priceCents: number, currency: string) => {
        const price = priceCents / 100;
        if (currency === "INR") {
            return `₹${price.toLocaleString('en-IN')}`;
        }
        return `$${price.toFixed(2)}`;
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

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gold border-t-transparent"></div>
                        <p className="mt-4 text-charcoal/70">Loading collection...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="text-center py-12">
                        <div
                            className="max-w-md mx-auto p-6 rounded-2xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(232, 220, 200, 0.9) 0%, rgba(242, 234, 216, 0.85) 100%)',
                                border: '1px solid rgba(201, 165, 92, 0.3)',
                            }}
                        >
                            <p className="text-charcoal mb-4">
                                {error.message.includes('401') || error.message.includes('403')
                                    ? 'Please log in as a buyer to view our collection.'
                                    : 'Failed to load products. Please try again later.'}
                            </p>
                            {(error.message.includes('401') || error.message.includes('403')) && (
                                <a
                                    href="/user-login"
                                    className="inline-block px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 hover:scale-105"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(201, 165, 92, 0.9) 0%, rgba(201, 165, 92, 1) 100%)',
                                        color: '#212121',
                                        boxShadow: '0 4px 16px rgba(201, 165, 92, 0.4)',
                                    }}
                                >
                                    Log In
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Products Carousel */}
                {!isLoading && !error && data && (
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
                            {data.products.length === 0 ? (
                                <div className="w-full text-center py-12">
                                    <p className="text-charcoal/70">No products found in this category.</p>
                                </div>
                            ) : (
                                data.products.slice(0, 6).map((product) => (
                                    <div
                                        key={product.product_id}
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
                                                src={product.thumbnail || 'https://via.placeholder.com/300x400?text=No+Image'}
                                                alt={product.title}
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

                                            {/* Stats Badge */}
                                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                                {product.is_featured && (
                                                    <div
                                                        className="px-3 py-1 rounded-full text-xs font-medium"
                                                        style={{
                                                            background: 'linear-gradient(135deg, rgba(201, 165, 92, 0.95) 0%, rgba(201, 165, 92, 1) 100%)',
                                                            color: '#212121',
                                                        }}
                                                    >
                                                        Featured
                                                    </div>
                                                )}
                                            </div>

                                            {/* Engagement Stats */}
                                            <div className="absolute top-4 right-4 flex flex-col gap-2">
                                                <div
                                                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs backdrop-blur-xl"
                                                    style={{
                                                        background: 'rgba(232, 220, 200, 0.9)',
                                                        border: '1px solid rgba(201, 165, 92, 0.3)',
                                                    }}
                                                >
                                                    <Heart className="w-3 h-3 text-gold" fill="currentColor" />
                                                    <span className="text-charcoal font-medium">{product.likes}</span>
                                                </div>
                                                <div
                                                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs backdrop-blur-xl"
                                                    style={{
                                                        background: 'rgba(232, 220, 200, 0.9)',
                                                        border: '1px solid rgba(201, 165, 92, 0.3)',
                                                    }}
                                                >
                                                    <MessageCircle className="w-3 h-3 text-gold" />
                                                    <span className="text-charcoal font-medium">{product.reviews}</span>
                                                </div>
                                                <div
                                                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs backdrop-blur-xl"
                                                    style={{
                                                        background: 'rgba(232, 220, 200, 0.9)',
                                                        border: '1px solid rgba(201, 165, 92, 0.3)',
                                                    }}
                                                >
                                                    <Eye className="w-3 h-3 text-gold" />
                                                    <span className="text-charcoal font-medium">{product.views}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Product Info */}
                                        <div className="text-center">
                                            <h3 className="font-serif text-lg text-charcoal mb-1 group-hover:text-gold transition-colors duration-300">
                                                {product.title}
                                            </h3>
                                            <p className="text-gold font-medium text-lg mb-1">
                                                {formatPrice(product.price_cents, product.currency)}
                                            </p>
                                            <p className="text-xs text-charcoal/60">
                                                by {product.creator.store_name}
                                                {product.creator.verified && (
                                                    <span className="ml-1 text-gold">✓</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* View All Collection Button */}
                        {data.products.length > 0 && (
                            <div className="text-center mt-12">
                                <a
                                    href="/collection"
                                    className="inline-block px-10 py-4 rounded-full font-medium text-sm transition-all duration-300 hover:scale-105"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(201, 165, 92, 0.9) 0%, rgba(201, 165, 92, 1) 100%)',
                                        color: '#212121',
                                        boxShadow: '0 4px 16px rgba(201, 165, 92, 0.4)',
                                    }}
                                >
                                    View All Collection
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};
