import React, { useState, useEffect } from "react";
import { getCreatorProducts } from "@/lib/api";
import { Search, Plus, Shirt, Loader2, X } from "lucide-react";
import { LuxeButton } from "@/components/common/Buttons/LuxeButton";
import UploadCollectionModal from "@/components/dashboard/UploadCollectionModal";
import ProductDetailsModal from "@/components/dashboard/ProductDetailsModal";

const WardrobeContent: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [filter, setFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

    const fetchWardrobe = async (pageNum: number, reset: boolean = false) => {
        if (reset) {
            setLoading(true);
            setError(null);
        }

        try {
            const limit = 50;
            const response = await getCreatorProducts(pageNum, limit);
            let data = [];
            let totalPages = 1;

            if (Array.isArray(response)) {
                data = response;
            } else {
                data = response.data || [];
                totalPages = response.meta?.totalPages || 1;
            }

            const mapped = data.map((p: any) => ({
                id: p.product_id,
                title: p.name || "Unnamed Item",
                description: p.description,
                image: p.image_url || "https://placehold.co/400x600/F5F2EB/8B7355?text=No+Image",
                images: p.images || [],
                tags: p.tags?.map((t: any) => t.name) || [],
                category: p.tags?.[0]?.name || "Uncategorized",
                status: p.status === 'approved' ? 'Active' : 'Pending',
                revenue: new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: p.currency || 'INR',
                    minimumFractionDigits: 2
                }).format(p.price_cents ? p.price_cents / 100 : p.price || 0),
                stats: {
                    likes_count: p.likes_count || 0,
                    comments_count: p.comments_count || 0,
                    shares_count: p.shares_count || 0,
                    tries_count: p.tries_count || 0
                }
            }));

            if (reset) {
                setProducts(mapped);
            } else {
                setProducts(prev => [...prev, ...mapped]);
            }

            setHasMore(pageNum < totalPages);
            setPage(pageNum);
        } catch (error) {
            console.error("Failed to fetch wardrobe", error);
            setError("Failed to load your wardrobe. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWardrobe(1, true);
    }, []);

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            fetchWardrobe(page + 1);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === "All" || p.category.toLowerCase().includes(filter.toLowerCase());
        return matchesSearch && matchesFilter;
    });

    const categories = ["All", "Dress", "Top", "Bottom", "Outerwear", "Accessory"];

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <X className="text-red-500" size={32} />
                </div>
                <h3 className="font-serif text-xl text-luxury-black mb-2">Something went wrong</h3>
                <p className="text-stone-500 mb-6">{error}</p>
                <LuxeButton onClick={() => fetchWardrobe(1, true)} variant="luxury">
                    Retry
                </LuxeButton>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                <div>
                    <h1 className="font-serif text-4xl text-luxury-black mb-2">My Wardrobe</h1>
                    <p className="text-stone-500">Manage your digital collection and curated looks.</p>
                </div>
                <LuxeButton onClick={() => setIsUploadModalOpen(true)} variant="luxury" className="flex items-center gap-2">
                    <Plus size={18} />
                    Add New Item
                </LuxeButton>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white/50 p-4 rounded-xl border border-stone-100 backdrop-blur-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search your collection..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-luxury-gold/50 transition-colors"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filter === cat
                                ? "bg-luxury-gold text-white shadow-md"
                                : "bg-white text-stone-500 border border-stone-200 hover:border-luxury-gold/30"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {loading && products.length === 0 ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-luxury-gold" size={40} />
                </div>
            ) : filteredProducts.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="group relative bg-white rounded-xl overflow-hidden border border-stone-100 hover:border-luxury-gold/30 hover:shadow-lg transition-all duration-500">
                                <div className="aspect-[3/4] overflow-hidden bg-stone-50 relative">
                                    <img
                                        src={product.image}
                                        alt={product.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                                    {/* Hover Actions */}
                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                        <button
                                            onClick={() => setSelectedProduct(product)}
                                            className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-wider hover:bg-luxury-gold hover:text-white transition-colors shadow-lg"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 text-center">
                                    <h3 className="font-serif text-lg text-luxury-black truncate">{product.title}</h3>
                                    <p className={`text-xs uppercase tracking-wider mt-1 font-medium ${product.category === "Uncategorized" ? "text-amber-600" : "text-stone-500"
                                        }`}>
                                        {product.category === "Uncategorized" ? product.status : product.category}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Load More Button */}
                    {hasMore && !searchQuery && filter === "All" && (
                        <div className="flex justify-center mt-12">
                            <LuxeButton
                                onClick={handleLoadMore}
                                variant="luxury-outline"
                                disabled={loading}
                                className="min-w-[200px]"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin mr-2" size={18} />
                                ) : (
                                    "Load More"
                                )}
                            </LuxeButton>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-20 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                    <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shirt className="text-stone-300" size={32} />
                    </div>
                    <h3 className="font-serif text-xl text-stone-400">Your wardrobe is empty</h3>
                    <p className="text-stone-400 mt-2">Start uploading your designs to build your digital closet.</p>
                </div>
            )}

            <UploadCollectionModal
                open={isUploadModalOpen}
                onOpenChange={setIsUploadModalOpen}
                onSuccess={() => fetchWardrobe(1, true)}
            />

            {/* Product Details Modal */}
            {selectedProduct && (
                <ProductDetailsModal
                    open={!!selectedProduct}
                    onOpenChange={(open) => !open && setSelectedProduct(null)}
                    product={selectedProduct}
                />
            )}
        </div>
    );
};

export default WardrobeContent;
