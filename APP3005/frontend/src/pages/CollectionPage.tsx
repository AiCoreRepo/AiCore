import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LuxuryHeroSection } from "@/components/collection/LuxuryHeroSection";
import { FilterDropdown } from "@/components/collection/FilterDropdown";
import { PriceRangeSlider } from "@/components/collection/PriceRangeSlider";
import { ProductCard } from "@/components/collection/ProductCard";
import { usePublicProducts } from "@/hooks/usePublicProducts";
import { useAuth } from "@/context/AuthContext";
import { auraGate } from "@/utils/auraGate";
import { Grid3x3, Ruler, Palette, ArrowUpDown } from "lucide-react";

const categories = ["All", "Dresses", "Outerwear", "Accessories", "Tops", "Bottoms"];
const sizes = ["All Sizes", "XS", "S", "M", "L", "XL", "XXL"];
const colors = ["All Colors", "Black", "White", "Beige", "Gold", "Navy", "Red"];
const sortOptions = ["Featured", "Price: Low to High", "Price: High to Low", "Newest", "Most Popular"];

const CollectionPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeCategory, setActiveCategory] = useState("All");
    const [activeSize, setActiveSize] = useState("All Sizes");
    const [activeColor, setActiveColor] = useState("All Colors");
    const [sortBy, setSortBy] = useState("Featured");
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000]);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    // Fetch products from backend
    const { data, isLoading, error } = usePublicProducts(
        1,
        undefined,
        activeCategory === "All" ? undefined : activeCategory
    );

    // Handle try-on with authentication and aura validation
    const handleTryOn = async (productId: string) => {
        // Check if token exists (user is logged in)
        const token = localStorage.getItem('access_token');

        if (!token) {
            // No token = not logged in
            navigate('/user-login');
            return;
        }

        // Token exists, check if user has aura
        const hasValidAura = await auraGate(navigate, '/aura-dashboard');

        if (hasValidAura) {
            // User is authenticated and has a ready aura, proceed to try-on
            navigate(`/ai-try-on?productId=${productId}`);
        }
        // If aura check fails, auraGate will handle the redirect
    };

    // Handle scroll to show/hide arrows
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const scrollLeft = container.scrollLeft;
        const maxScroll = container.scrollWidth - container.clientWidth;

        setShowLeftArrow(scrollLeft > 10);
        setShowRightArrow(scrollLeft < maxScroll - 10);
    };

    // Filter and sort products based on selected filters
    const getFilteredProducts = () => {
        if (!data?.products) return [];

        let filtered = [...data.products];

        // Filter by price range
        filtered = filtered.filter(product => {
            const price = product.price_cents / 100;
            return price >= priceRange[0] && price <= priceRange[1];
        });

        // Sort products
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
                // Assuming newer products have higher IDs
                filtered.sort((a, b) => b.product_id.localeCompare(a.product_id));
                break;
            default:
                // Featured - keep original order
                break;
        }

        return filtered;
    };

    const filteredProducts = getFilteredProducts();

    return (
        <div
            className="min-h-screen overflow-x-hidden"
            style={{
                background: '#F5F0E6',
            }}
        >
            <Navbar />

            <main className="pt-20">
                {/* Hero Section */}
                <LuxuryHeroSection />

                {/* Filters Section */}
                <section className="py-8 sticky top-20 z-40"
                    style={{
                        background: 'linear-gradient(180deg, #F5F0E6 0%, #F8F4EC 100%)',
                        borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    }}
                >
                    <div className="container-luxury">
                        <div className="flex flex-wrap items-center gap-8 justify-center">
                            <FilterDropdown
                                label="Category"
                                options={categories}
                                value={activeCategory}
                                onChange={setActiveCategory}
                                icon={<Grid3x3 className="w-4 h-4" />}
                            />
                            <FilterDropdown
                                label="Size"
                                options={sizes}
                                value={activeSize}
                                onChange={setActiveSize}
                                icon={<Ruler className="w-4 h-4" />}
                            />
                            <FilterDropdown
                                label="Color"
                                options={colors}
                                value={activeColor}
                                onChange={setActiveColor}
                                icon={<Palette className="w-4 h-4" />}
                            />
                            <PriceRangeSlider
                                min={0}
                                max={20000}
                                value={priceRange}
                                onChange={setPriceRange}
                                currency="₹"
                            />
                            <FilterDropdown
                                label="Sort By"
                                options={sortOptions}
                                value={sortBy}
                                onChange={setSortBy}
                                icon={<ArrowUpDown className="w-4 h-4" />}
                            />
                        </div>
                    </div>
                </section>

                {/* Products Grid */}
                <section className="py-12 md:py-16">
                    <div className="container-luxury">
                        {/* Loading State */}
                        {isLoading && (
                            <div className="text-center py-20">
                                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gold border-t-transparent"></div>
                                <p className="mt-6 text-charcoal/70 text-lg">Loading collection...</p>
                            </div>
                        )}

                        {/* Error State */}
                        {error && (
                            <div className="text-center py-20">
                                <div
                                    className="max-w-md mx-auto p-8 rounded-3xl"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(232, 220, 200, 0.9) 0%, rgba(242, 234, 216, 0.85) 100%)',
                                        border: '1px solid rgba(201, 165, 92, 0.3)',
                                    }}
                                >
                                    <p className="text-charcoal mb-6 text-lg">
                                        {error.message.includes('401') || error.message.includes('403')
                                            ? 'Please log in as a buyer to view our collection.'
                                            : 'Failed to load products. Please try again later.'}
                                    </p>
                                    {(error.message.includes('401') || error.message.includes('403')) && (
                                        <a
                                            href="/user-login"
                                            className="inline-block px-8 py-4 rounded-full font-medium text-sm transition-all duration-300 hover:scale-105"
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

                        {/* Products Grid */}
                        {!isLoading && !error && (
                            <>
                                {filteredProducts.length === 0 ? (
                                    <div className="text-center py-20">
                                        <p className="text-charcoal/70 text-lg">No products found matching your filters.</p>
                                        <button
                                            onClick={() => {
                                                setActiveCategory("All");
                                                setActiveSize("All Sizes");
                                                setActiveColor("All Colors");
                                                setPriceRange([0, 20000]);
                                                setSortBy("Featured");
                                            }}
                                            className="mt-6 px-8 py-3 rounded-full font-medium text-sm transition-all duration-300 hover:scale-105"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(201, 165, 92, 0.9) 0%, rgba(201, 165, 92, 1) 100%)',
                                                color: '#212121',
                                                boxShadow: '0 4px 16px rgba(201, 165, 92, 0.4)',
                                            }}
                                        >
                                            Clear All Filters
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Results Count */}
                                        <div className="mb-6 text-center">
                                            <p className="text-charcoal/70 text-sm">
                                                Showing <span className="font-semibold text-gold">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'product' : 'products'}
                                            </p>
                                        </div>

                                        {/* Product Grid - Myntra Style */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4">
                                            {filteredProducts.map((product) => (
                                                <ProductCard
                                                    key={product.product_id}
                                                    product={product}
                                                    onTryOn={() => handleTryOn(product.product_id)}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default CollectionPage;
