import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/collection/ProductCard";
import { useInfinitePublicProducts } from "@/hooks/useInfinitePublicProducts";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/context/AuthContext";
import { auraGate } from "@/utils/auraGate";
import { ChevronDown, Heart, Search, X, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { TryOnInterstitialModal } from "@/components/TryOnInterstitialModal";
import { TryOnResultModal } from '@/components/ai-tryon/TryOnResultModal';
import { AuraPromptDialog } from '@/components/aura/AuraPromptDialog';
import { tryOnWithVertex, generateMoreAngles, getAura } from '@/lib/api';
import collectionHeaderImage from "@/assets/collectionHeader.jpeg";

const categories = ["All", "Dresses", "Outerwear", "Accessories", "Tops", "Bottoms"];
const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const colorOptions = ["Black", "White", "Beige", "Gold", "Navy", "Red", "Brown", "Gray"];
const sortOptions = ["Price: Low to High", "Price: High to Low", "Newest", "Most Popular"];

const CollectionPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // Aura Welcome Modal State
    const [showAuraWelcomeModal, setShowAuraWelcomeModal] = useState(false);

    // Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
    const [sortBy, setSortBy] = useState("Price: Low to High");
    const [showFilters, setShowFilters] = useState(false);

    const [selectedTryOnProduct, setSelectedTryOnProduct] = useState<string | null>(null);
    const [isTryOnModalOpen, setIsTryOnModalOpen] = useState(false);

    // AI Try-On State
    const [aura, setAura] = useState<any>(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [tryOnLoading, setTryOnLoading] = useState(false);
    const [tryOnError, setTryOnError] = useState<string | null>(null);
    const [generatingAngles, setGeneratingAngles] = useState(false);
    const [originalTryOnImage, setOriginalTryOnImage] = useState<string | null>(null);

    // Fetch Aura for user photo in modal
    useEffect(() => {
        if (user) {
            getAura().then(setAura).catch(() => { });
        }
    }, [user]);

    // Show Aura Welcome Modal if coming from signup
    useEffect(() => {
        const state = location.state as { fromSignup?: boolean; showAuraModal?: boolean };
        if (state?.fromSignup && state?.showAuraModal) {
            setShowAuraWelcomeModal(true);
            // Clear the state so modal doesn't show again on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    // Debounce search
    const debouncedSearch = useDebounce(searchQuery, 500);

    // Fetch products with infinite scroll
    const {
        data,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfinitePublicProducts(
        debouncedSearch,
        activeCategory === "All" ? undefined : activeCategory,
        priceRange[0] === 0 ? undefined : priceRange[0],
        priceRange[1] === 5000 ? undefined : priceRange[1],
        sortBy,
        selectedSizes,
        selectedColors
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

    // Helper functions
    // ... kept for potential usage or removed if unused. 
    // Since local filtering is removed, we just use the data directly.

    // Sort products: prioritize younger models (age <= 40) at the top, older (> 40) at bottom
    // This runs client-side on the fetched pages
    const rawProducts = data?.pages.flatMap(page => page.products) ?? [];
    const filteredProducts = [...rawProducts].sort((a, b) => {
        const ageA = a.metadata?.model_age ? parseInt(a.metadata.model_age) : 0;
        const ageB = b.metadata?.model_age ? parseInt(b.metadata.model_age) : 0;

        // Check if models are "older" (> 40)
        const isOldA = ageA > 40;
        const isOldB = ageB > 40;

        if (isOldA && !isOldB) return 1; // A is old, put it after B
        if (!isOldA && isOldB) return -1; // B is old, put it after A
        return 0; // Both same category, keep original sort order (from backend)
    });

    // Count active filters for badge
    const activeFilterCount =
        (activeCategory !== 'All' ? 1 : 0) +
        selectedSizes.length +
        selectedColors.length +
        (priceRange[0] !== 0 || priceRange[1] !== 5000 ? 1 : 0);

    const handleTryOn = async (productId: string) => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/user-login');
            return;
        }

        // Check permissions - BYPASSED: Allow all users
        if (false && user?.role !== 'ADMIN' && user?.try_on_permission !== 'APPROVED') {
            navigate('/ai-try-on');
            return;
        }

        // OPTIMIZATION: Check local aura state first for instant response
        if (aura) {
            setSelectedTryOnProduct(productId);
            setIsTryOnModalOpen(true);
            return;
        }

        // Fallback to network check if local state isn't ready
        const hasValidAura = await auraGate(navigate, '/aura-dashboard');
        if (hasValidAura) {
            setSelectedTryOnProduct(productId);
            setIsTryOnModalOpen(true);
        }
    };

    const handleConfirmTryOn = () => {
        if (selectedTryOnProduct) {
            setIsTryOnModalOpen(false);
            executeTryOn(selectedTryOnProduct);
        }
    };

    const executeTryOn = async (productId: string) => {
        if (!user) return; // Aura check handled by gate, but need user context

        try {
            setTryOnLoading(true);
            setTryOnError(null);
            setShowResultModal(true);

            // Use aura.user_id if available, otherwise fallback to user.user_id (though aura is preferred)
            const userId = aura?.user_id || user.user_id;

            const result = await tryOnWithVertex({
                userId: userId,
                clothingItemId: productId,
            });

            if (result.success && result.resultImage) {
                const imageData = result.resultImage.startsWith('data:')
                    ? result.resultImage
                    : `data:image/jpeg;base64,${result.resultImage}`;
                setResultImage(imageData);
                setOriginalTryOnImage(imageData);
            } else {
                throw new Error(result.message || 'Try-on failed');
            }
        } catch (error: any) {
            console.error('Try-on error:', error);
            setTryOnError(error.message || 'Failed to process try-on. Please try again.');
        } finally {
            setTryOnLoading(false);
        }
    };

    const handleGenerateMoreAngles = async () => {
        if (!user || !resultImage || !selectedTryOnProduct) return;

        try {
            setGeneratingAngles(true);
            const result = await generateMoreAngles({
                userId: aura?.user_id || user.user_id,
                productId: selectedTryOnProduct,
                previousImageUrl: originalTryOnImage || resultImage,
            });

            if (result.success && result.resultImage) {
                const imageData = result.resultImage.startsWith('data:')
                    ? result.resultImage
                    : `data:image/jpeg;base64,${result.resultImage}`;
                setResultImage(imageData);
            }
        } catch (error: any) {
            setTryOnError(error.message || 'Failed to generate angles');
        } finally {
            setGeneratingAngles(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F0E6]">
            <Navbar />

            {/* Hero Header Image - Includes both hero and quote */}
            <section className="relative w-full bg-white pt-16 md:pt-20">
                <img
                    src={collectionHeaderImage}
                    alt="Crafted for the Confident"
                    className="w-full h-auto object-contain"
                />
            </section>

            {/* Elegant Search Bar Section */}
            <section className="bg-[#F8F4EC] border-b border-[#E8DCC4]">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="max-w-3xl mx-auto">
                        {/* Compact Search Title */}
                        <h2 className="text-center text-xs uppercase tracking-[0.25em] text-[#6B5D4F] mb-4 font-light">
                            Discover Your Style
                        </h2>


                        {/* Compact Search Input */}
                        <div className="relative group">
                            <div className="relative">
                                {/* Search Icon - Compact */}
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-[#9B8B7E] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                                </div>

                                {/* Input - Smaller, Elegant */}
                                <input
                                    type="text"
                                    placeholder="Search by designer, style, or occasion..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3 bg-white border border-[#D4C5A9] rounded-full text-[#2C2416] placeholder-[#9B8B7E]/60 focus:outline-none focus:border-[#D4AF37] focus:shadow-[0_4px_12px_rgba(212,175,55,0.15)] transition-all duration-300 text-sm font-light"
                                />

                                {/* Clear Button - Compact */}
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#9B8B7E] hover:text-[#D4AF37] transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Active Search Indicator - Compact */}
                        {searchQuery && (
                            <div className="mt-3 text-center animate-fadeIn">
                                <p className="text-xs text-[#6B5D4F] font-light">
                                    <span className="opacity-60">Searching for</span>
                                    <span className="mx-2 text-[#D4AF37] font-normal">"{searchQuery}"</span>
                                    <span className="opacity-60">• {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Premium Filter Bar */}
            {/* Premium Filter Bar */}
            <section className="bg-[#F8F4EC] border-b border-[#E8DCC4] shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        {/* Filter Toggle Button - Left */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-[#D4C5A9] hover:border-[#D4AF37] hover:bg-[#FDFBF7] transition-all group shadow-sm"
                        >
                            <SlidersHorizontal className="w-4 h-4 text-[#6B5D4F] group-hover:text-[#D4AF37] transition-colors" />
                            <span className="text-sm font-medium text-[#2C2416]">Filters</span>
                            {activeFilterCount > 0 && (
                                <span className="ml-1 px-2 py-0.5 bg-[#D4AF37] text-white text-xs rounded-full font-medium">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {/* Active Filters Pills - Center */}
                        <div className="flex-1 flex items-center gap-2 overflow-x-auto hide-scrollbar">
                            {activeCategory !== 'All' && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D4C5A9] rounded-full text-sm whitespace-nowrap shadow-sm">
                                    <span className="text-[#2C2416]">{activeCategory}</span>
                                    <button
                                        onClick={() => setActiveCategory('All')}
                                        className="text-[#9B8B7E] hover:text-[#D4AF37] transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                            {selectedSizes.map(size => (
                                <div key={size} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D4C5A9] rounded-full text-sm whitespace-nowrap shadow-sm">
                                    <span className="text-[#2C2416]">Size: {size}</span>
                                    <button
                                        onClick={() => setSelectedSizes(selectedSizes.filter(s => s !== size))}
                                        className="text-[#9B8B7E] hover:text-[#D4AF37] transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                            {selectedColors.map(color => (
                                <div key={color} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D4C5A9] rounded-full text-sm whitespace-nowrap shadow-sm">
                                    <span className="text-[#2C2416]">{color}</span>
                                    <button
                                        onClick={() => setSelectedColors(selectedColors.filter(c => c !== color))}
                                        className="text-[#9B8B7E] hover:text-[#D4AF37] transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                            {(priceRange[0] !== 0 || priceRange[1] !== 5000) && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D4C5A9] rounded-full text-sm whitespace-nowrap shadow-sm">
                                    <span className="text-[#2C2416]">₹{priceRange[0]} - ₹{priceRange[1]}</span>
                                    <button
                                        onClick={() => setPriceRange([0, 5000])}
                                        className="text-[#9B8B7E] hover:text-[#D4AF37] transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Sort Dropdown - Right */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="flex items-center gap-2 px-4 py-2 pr-10 rounded-full border border-[#D4C5A9] hover:border-[#D4AF37] transition-all text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:border-[#D4AF37] shadow-sm text-[#2C2416]"
                            >
                                {sortOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B8B7E] pointer-events-none" />
                        </div>
                    </div>

                    {/* Expandable Filter Panel */}
                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-[#E8DCC4] animate-slideDown">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Category */}
                                <div>
                                    <label className="block text-xs font-medium text-[#6B5D4F] mb-2 uppercase tracking-wide">Category</label>
                                    <div className="relative">
                                        <select
                                            value={activeCategory}
                                            onChange={(e) => setActiveCategory(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-[#E8DCC4] rounded-lg text-sm text-[#2C2416] focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 appearance-none cursor-pointer transition-all"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5D4F] pointer-events-none" />
                                    </div>
                                </div>

                                {/* Size */}
                                <div>
                                    <label className="block text-xs font-medium text-[#6B5D4F] mb-2 uppercase tracking-wide">Size</label>
                                    <div className="relative">
                                        <select
                                            value={selectedSizes[0] || ""}
                                            onChange={(e) => setSelectedSizes(e.target.value ? [e.target.value] : [])}
                                            className="w-full px-4 py-2.5 bg-white border border-[#E8DCC4] rounded-lg text-sm text-[#2C2416] focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 appearance-none cursor-pointer transition-all"
                                        >
                                            <option value="">All Sizes</option>
                                            {sizes.map(size => (
                                                <option key={size} value={size}>{size}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5D4F] pointer-events-none" />
                                    </div>
                                </div>

                                {/* Color */}
                                <div>
                                    <label className="block text-xs font-medium text-[#6B5D4F] mb-2 uppercase tracking-wide">Color</label>
                                    <div className="relative">
                                        <select
                                            value={selectedColors[0] || ""}
                                            onChange={(e) => setSelectedColors(e.target.value ? [e.target.value] : [])}
                                            className="w-full px-4 py-2.5 bg-white border border-[#E8DCC4] rounded-lg text-sm text-[#2C2416] focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 appearance-none cursor-pointer transition-all"
                                        >
                                            <option value="">All Colors</option>
                                            {colorOptions.map(color => (
                                                <option key={color} value={color}>{color}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5D4F] pointer-events-none" />
                                    </div>
                                </div>

                                {/* Price Range */}
                                <div>
                                    <label className="block text-xs font-medium text-[#6B5D4F] mb-2 uppercase tracking-wide">Price Range</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={priceRange[0]}
                                            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                            className="w-full px-3 py-2.5 bg-white border border-[#E8DCC4] rounded-lg text-sm text-[#2C2416] focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={priceRange[1]}
                                            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                            className="w-full px-3 py-2.5 bg-white border border-[#E8DCC4] rounded-lg text-sm text-[#2C2416] focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Products Section */}
            <main className="py-12">
                <div className="max-w-7xl mx-auto px-4">
                    {/* Products Grid */}
                    {isLoading ? (
                        <div className="text-center py-20">
                            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#D4AF37] border-t-transparent"></div>
                            <p className="mt-6 text-[#6B5D4F]">Loading collection...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <p className="text-[#6B5D4F]">Failed to load products</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-lg mb-2 text-[#2C2416]">No products found</p>
                            <p className="text-[#6B5D4F]">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#D4AF37] border-t-transparent"></div>
                                    <p className="mt-4 text-sm text-[#6B5D4F]">Loading more products...</p>
                                </div>
                            )}

                            {/* End of Results */}
                            {!hasNextPage && filteredProducts.length > 0 && (
                                <div className="text-center py-8">
                                    <p className="text-sm text-[#6B5D4F]">
                                        You've reached the end of our collection
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <Footer />

            <AuraPromptDialog
                isOpen={showAuraWelcomeModal}
                onAccept={() => {
                    setShowAuraWelcomeModal(false);
                    navigate('/aura-dashboard');
                }}
                onDecline={() => setShowAuraWelcomeModal(false)}
            />

            <TryOnInterstitialModal
                isOpen={isTryOnModalOpen}
                onClose={() => setIsTryOnModalOpen(false)}
                onConfirm={handleConfirmTryOn}
            />

            <TryOnResultModal
                isOpen={showResultModal}
                onClose={() => setShowResultModal(false)}
                resultImage={resultImage}
                loading={tryOnLoading}
                error={tryOnError}
                onGenerateMoreAngles={handleGenerateMoreAngles}
                generatingAngles={generatingAngles}
                userPhoto={aura?.image_url}
                garmentId={selectedTryOnProduct || undefined}
            />
        </div>
    );
};

export default CollectionPage;
