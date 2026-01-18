import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/collection/SearchBar";
import { Breadcrumb } from "@/components/collection/Breadcrumb";
import { ActiveFilterChips } from "@/components/collection/ActiveFilterChips";
import { ViewToggle } from "@/components/collection/ViewToggle";
import { FilterAccordionSection } from "@/components/collection/FilterAccordionSection";
import { ProductCard } from "@/components/collection/ProductCard";
import { useInfinitePublicProducts } from "@/hooks/useInfinitePublicProducts";
import { useAuth } from "@/context/AuthContext";
import { auraGate } from "@/utils/auraGate";
import { colors, typography } from "@/utils/designSystem";
import {
    Grid3x3,
    Ruler,
    Palette,
    DollarSign,
    Star,
    Package,
    ChevronDown
} from "lucide-react";

const categories = ["All", "Dresses", "Outerwear", "Accessories", "Tops", "Bottoms"];
const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const colorOptions = ["Black", "White", "Beige", "Gold", "Navy", "Red", "Brown", "Gray"];
const brands = ["AiVestire", "Luxury Brand", "Premium Label", "Designer Co"];
const materials = ["Cotton", "Silk", "Wool", "Linen", "Polyester", "Cashmere"];
const sortOptions = ["Best Match", "Price: Low to High", "Price: High to Low", "Newest", "Most Popular"];

const CollectionPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000]);
    const [minRating, setMinRating] = useState(0);
    const [inStockOnly, setInStockOnly] = useState(false);
    const [sortBy, setSortBy] = useState("Best Match");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // UI States
    const [expandedSections, setExpandedSections] = useState({
        category: true,
        price: true,
        color: true,
        size: true,
        brand: false,
        rating: false,
        material: false,
        availability: false,
    });

    // Fetch products with infinite scroll
    const {
        data,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfinitePublicProducts(
        undefined,
        activeCategory === "All" ? undefined : activeCategory
    );

    // Intersection Observer for infinite scroll
    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(loadMoreRef.current);

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Flatten paginated products
    const allProducts = data?.pages.flatMap(page => page.products) ?? [];

    // Helper functions
    const extractSizes = (product: any): string[] => {
        const text = `${product.title} ${product.description || ''}`.toUpperCase();
        return sizes.filter(size => text.includes(size));
    };

    const extractColors = (product: any): string[] => {
        const text = `${product.title} ${product.description || ''}`.toLowerCase();
        return colorOptions.map(c => c.toLowerCase()).filter(color => text.includes(color));
    };

    // Filter and sort products
    const getFilteredProducts = () => {
        if (!allProducts.length) return [];
        let filtered = [...allProducts];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(product =>
                product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Size filter
        if (selectedSizes.length > 0) {
            filtered = filtered.filter(product => {
                const productSizes = extractSizes(product);
                return selectedSizes.some(size => productSizes.includes(size));
            });
        }

        // Color filter
        if (selectedColors.length > 0) {
            filtered = filtered.filter(product => {
                const productColors = extractColors(product);
                return selectedColors.some(color =>
                    productColors.includes(color.toLowerCase())
                );
            });
        }

        // Price filter
        filtered = filtered.filter(product => {
            const price = product.price_cents / 100;
            return price >= priceRange[0] && price <= priceRange[1];
        });

        // Sort
        switch (sortBy) {
            case "Price: Low to High":
                filtered.sort((a, b) => a.price_cents - b.price_cents);
                break;
            case "Price: High to Low":
                filtered.sort((a, b) => b.price_cents - a.price_cents);
                break;
            case "Most Popular":
                filtered.sort((a, b) => b.likes - a.likes);
                break;
            case "Newest":
                filtered.sort((a, b) => b.product_id.localeCompare(a.product_id));
                break;
        }

        return filtered;
    };

    const filteredProducts = getFilteredProducts();

    // Active filter chips
    const getActiveFilterChips = () => {
        const chips: any[] = [];

        if (activeCategory !== "All") {
            chips.push({
                id: 'category',
                label: 'Category',
                value: activeCategory,
                onRemove: () => setActiveCategory("All")
            });
        }

        selectedSizes.forEach(size => {
            chips.push({
                id: `size-${size}`,
                label: 'Size',
                value: size,
                onRemove: () => setSelectedSizes(prev => prev.filter(s => s !== size))
            });
        });

        selectedColors.forEach(color => {
            chips.push({
                id: `color-${color}`,
                label: 'Color',
                value: color,
                onRemove: () => setSelectedColors(prev => prev.filter(c => c !== color))
            });
        });

        if (priceRange[0] > 0 || priceRange[1] < 20000) {
            chips.push({
                id: 'price',
                label: 'Price',
                value: `₹${priceRange[0]} - ₹${priceRange[1]}`,
                onRemove: () => setPriceRange([0, 20000])
            });
        }

        return chips;
    };

    const clearAllFilters = () => {
        setActiveCategory("All");
        setSelectedSizes([]);
        setSelectedColors([]);
        setSelectedBrands([]);
        setSelectedMaterials([]);
        setPriceRange([0, 20000]);
        setMinRating(0);
        setInStockOnly(false);
        setSearchQuery("");
    };

    const handleTryOn = async (productId: string) => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/user-login');
            return;
        }
        const hasValidAura = await auraGate(navigate, '/aura-dashboard');
        if (hasValidAura) {
            navigate(`/ai-try-on?productId=${productId}`);
        }
    };

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <div className="min-h-screen" style={{ background: colors.sand }}>
            <Navbar />

            <main className="pt-20">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Breadcrumb */}
                    <Breadcrumb
                        items={[
                            { label: "Home", href: "/" },
                            { label: "Collection", href: "/collection" },
                            { label: activeCategory !== "All" ? activeCategory : "All Products" }
                        ]}
                        className="mb-6"
                    />

                    {/* Collection Header */}
                    <div className="mb-8">
                        <h1
                            className="text-4xl md:text-5xl font-bold mb-3"
                            style={{
                                fontFamily: typography.fontSerif,
                                color: colors.charcoal
                            }}
                        >
                            {activeCategory !== "All" ? activeCategory : "Collection"}
                        </h1>
                        <p
                            className="text-base max-w-2xl"
                            style={{
                                fontFamily: typography.fontSans,
                                color: colors.textSecondary
                            }}
                        >
                            Discover our curated selection of premium fashion pieces, crafted with attention to detail and timeless elegance.
                        </p>
                    </div>

                    {/* Main Layout */}
                    <div className="flex gap-8">
                        <aside className="hidden lg:block w-80 flex-shrink-0">
                            <div
                                className="sticky top-24 rounded-xl p-6 shadow-sm overflow-y-auto"
                                style={{
                                    background: colors.bgWhite,
                                    border: `1px solid ${colors.border}`,
                                    maxHeight: 'calc(100vh - 7rem)',
                                }}
                            >
                                {/* Search */}
                                <SearchBar
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    className="mb-6"
                                />

                                {/* Filter Sections */}
                                <div className="space-y-0">
                                    {/* Category */}
                                    <FilterAccordionSection
                                        title="Category"
                                        icon={<Grid3x3 className="w-4 h-4" />}
                                        isExpanded={expandedSections.category}
                                        onToggle={() => toggleSection('category')}
                                        selectedCount={activeCategory !== "All" ? 1 : 0}
                                        accentColor={colors.accent}
                                    >
                                        <div className="space-y-1.5">
                                            {categories.map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setActiveCategory(cat)}
                                                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                                                    style={{
                                                        background: activeCategory === cat ? colors.accentLight : 'transparent',
                                                        color: activeCategory === cat ? colors.accent : colors.textSecondary,
                                                        fontFamily: typography.fontSans,
                                                    }}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </FilterAccordionSection>

                                    {/* Price Range */}
                                    <FilterAccordionSection
                                        title="Price Range"
                                        icon={<DollarSign className="w-4 h-4" />}
                                        isExpanded={expandedSections.price}
                                        onToggle={() => toggleSection('price')}
                                        accentColor={colors.gold}
                                    >
                                        <div className="space-y-4">
                                            <div className="flex gap-3">
                                                <div className="flex-1">
                                                    <label className="text-xs font-medium mb-1 block" style={{ color: colors.textSecondary }}>Min</label>
                                                    <input
                                                        type="number"
                                                        value={priceRange[0]}
                                                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                                        className="w-full px-3 py-2 rounded-lg border text-sm"
                                                        style={{ borderColor: colors.border }}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-xs font-medium mb-1 block" style={{ color: colors.textSecondary }}>Max</label>
                                                    <input
                                                        type="number"
                                                        value={priceRange[1]}
                                                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                                        className="w-full px-3 py-2 rounded-lg border text-sm"
                                                        style={{ borderColor: colors.border }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </FilterAccordionSection>

                                    {/* Color */}
                                    <FilterAccordionSection
                                        title="Color"
                                        icon={<Palette className="w-4 h-4" />}
                                        isExpanded={expandedSections.color}
                                        onToggle={() => toggleSection('color')}
                                        selectedCount={selectedColors.length}
                                        accentColor="#56CCF2"
                                    >
                                        <div className="grid grid-cols-4 gap-2">
                                            {colorOptions.map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => {
                                                        setSelectedColors(prev =>
                                                            prev.includes(color)
                                                                ? prev.filter(c => c !== color)
                                                                : [...prev, color]
                                                        );
                                                    }}
                                                    className="w-10 h-10 rounded-full border-2 transition-all duration-150"
                                                    style={{
                                                        background: color.toLowerCase(),
                                                        borderColor: selectedColors.includes(color) ? colors.accent : colors.border,
                                                        transform: selectedColors.includes(color) ? 'scale(1.1)' : 'scale(1)',
                                                    }}
                                                    title={color}
                                                />
                                            ))}
                                        </div>
                                    </FilterAccordionSection>

                                    {/* Size */}
                                    <FilterAccordionSection
                                        title="Size"
                                        icon={<Ruler className="w-4 h-4" />}
                                        isExpanded={expandedSections.size}
                                        onToggle={() => toggleSection('size')}
                                        selectedCount={selectedSizes.length}
                                        accentColor="#4ECDC4"
                                    >
                                        <div className="grid grid-cols-3 gap-2">
                                            {sizes.map(size => (
                                                <button
                                                    key={size}
                                                    onClick={() => {
                                                        setSelectedSizes(prev =>
                                                            prev.includes(size)
                                                                ? prev.filter(s => s !== size)
                                                                : [...prev, size]
                                                        );
                                                    }}
                                                    className="px-3 py-2 rounded-lg text-sm font-bold border-2 transition-all duration-150"
                                                    style={{
                                                        background: selectedSizes.includes(size) ? '#4ECDC4' : colors.bgWhite,
                                                        color: selectedSizes.includes(size) ? '#FFFFFF' : colors.textSecondary,
                                                        borderColor: selectedSizes.includes(size) ? '#4ECDC4' : colors.border,
                                                    }}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </FilterAccordionSection>
                                </div>

                                {/* Apply/Clear Buttons */}
                                <div className="mt-6 pt-6 border-t flex gap-3" style={{ borderColor: colors.border }}>
                                    <button
                                        onClick={clearAllFilters}
                                        className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150"
                                        style={{
                                            background: 'transparent',
                                            color: colors.textSecondary,
                                            border: `1px solid ${colors.border}`,
                                        }}
                                    >
                                        Clear
                                    </button>
                                    <button
                                        className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150"
                                        style={{
                                            background: colors.accent,
                                            color: '#FFFFFF',
                                        }}
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </aside>

                        {/* Right Content - Products */}
                        <div className="flex-1">
                            {/* Results Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    {!isLoading && !error && (
                                        <p className="text-sm" style={{ fontFamily: typography.fontSans, color: colors.textSecondary }}>
                                            <span className="font-semibold" style={{ color: colors.charcoal }}>
                                                {filteredProducts.length}
                                            </span> {filteredProducts.length === 1 ? 'product' : 'products'}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Sort Dropdown */}
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="px-4 py-2 rounded-lg border text-sm font-medium"
                                        style={{
                                            borderColor: colors.border,
                                            fontFamily: typography.fontSans,
                                        }}
                                    >
                                        {sortOptions.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>

                                    {/* View Toggle */}
                                    <ViewToggle view={viewMode} onChange={setViewMode} />
                                </div>
                            </div>

                            {/* Active Filter Chips */}
                            <ActiveFilterChips
                                chips={getActiveFilterChips()}
                                onClearAll={clearAllFilters}
                                className="mb-6"
                            />

                            {/* Products Grid */}
                            {isLoading ? (
                                <div className="text-center py-20">
                                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4" style={{ borderColor: colors.accent, borderTopColor: 'transparent' }}></div>
                                    <p className="mt-6" style={{ color: colors.textSecondary }}>Loading collection...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-20">
                                    <p style={{ color: colors.textSecondary }}>Failed to load products</p>
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="text-center py-20">
                                    <p className="text-lg mb-2" style={{ color: colors.charcoal }}>No products found</p>
                                    <p style={{ color: colors.textSecondary }}>Try adjusting your filters</p>
                                </div>
                            ) : (
                                <>
                                    <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                                        {filteredProducts.map(product => (
                                            <ProductCard
                                                key={product.product_id}
                                                product={product}
                                                onTryOn={() => handleTryOn(product.product_id)}
                                            />
                                        ))}
                                    </div>

                                    {/* Infinite Scroll Trigger */}
                                    <div ref={loadMoreRef} className="h-20" />

                                    {/* Loading More Indicator */}
                                    {isFetchingNextPage && (
                                        <div className="text-center py-8">
                                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4" style={{ borderColor: colors.accent, borderTopColor: 'transparent' }}></div>
                                            <p className="mt-4 text-sm" style={{ color: colors.textSecondary }}>Loading more products...</p>
                                        </div>
                                    )}

                                    {/* Load More Button (Fallback) */}
                                    {hasNextPage && !isFetchingNextPage && (
                                        <div className="text-center py-8">
                                            <button
                                                onClick={() => fetchNextPage()}
                                                className="px-8 py-3 rounded-lg font-semibold text-sm transition-all duration-300 hover:scale-105"
                                                style={{
                                                    background: colors.accent,
                                                    color: '#FFFFFF',
                                                    boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
                                                }}
                                            >
                                                Load More Products
                                            </button>
                                        </div>
                                    )}

                                    {/* End of Results */}
                                    {!hasNextPage && allProducts.length > 0 && (
                                        <div className="text-center py-8">
                                            <p className="text-sm" style={{ color: colors.textSecondary }}>
                                                You've reached the end of our collection
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            <style>{`
                /* Custom Scrollbar for Sidebar */
                .overflow-y-auto::-webkit-scrollbar {
                    width: 6px;
                }
                
                .overflow-y-auto::-webkit-scrollbar-track {
                    background: ${colors.bgLight};
                    border-radius: 10px;
                }
                
                .overflow-y-auto::-webkit-scrollbar-thumb {
                    background: ${colors.accent};
                    border-radius: 10px;
                }
                
                .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                    background: ${colors.accentHover};
                }
            `}</style>
        </div>
    );
};

export default CollectionPage;
