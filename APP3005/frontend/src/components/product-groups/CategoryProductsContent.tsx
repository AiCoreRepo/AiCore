import React, { useState, useEffect } from "react";
import { getCreatorProducts } from "@/lib/api";
import { Search, Loader2, X, PackageOpen, ArrowLeft } from "lucide-react";
import { LuxeButton } from "@/components/common/Buttons/LuxeButton";
import ProductDetailsModal from "@/components/dashboard/ProductDetailsModal";
import { Link, useParams } from "react-router-dom";

interface CategoryProductsContentProps {
    groupId: string;
}

const CategoryProductsContent: React.FC<CategoryProductsContentProps> = ({ groupId }) => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

    const fetchProducts = async (pageNum: number, reset: boolean = false) => {
        if (reset) {
            setLoading(true);
            setError(null);
        }

        try {
            const limit = 50;
            // The getCreatorProducts handles the groupId filter now
            const response = await getCreatorProducts(pageNum, limit, groupId);
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
                status: p.status,
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
            console.error("Failed to fetch products for group", error);
            setError("Failed to load products. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (groupId) {
            fetchProducts(1, true);
        }
    }, [groupId]);

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            fetchProducts(page + 1);
        }
    };

    const filteredProducts = products.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <X className="text-red-500" size={32} />
                </div>
                <h3 className="font-serif text-xl text-luxury-charcoal mb-2">Something went wrong</h3>
                <p className="text-stone-500 mb-6">{error}</p>
                <LuxeButton onClick={() => fetchProducts(1, true)} variant="luxury">
                    Retry
                </LuxeButton>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header / Nav */}
            <div className="flex items-center gap-4 mb-4">
                <Link to="/product-groups" className="p-2 border border-stone-200 rounded-lg hover:bg-stone-50 text-stone-500 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="font-serif text-3xl text-luxury-charcoal font-black tracking-tight">Collection Items</h1>
                    <p className="text-stone-500 text-sm font-medium mt-1">Viewing items assigned to this specific group.</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-2 rounded-xl border border-stone-200 shadow-sm">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-luxury-charcoal transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search items in this collection..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-transparent rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-200 transition-all text-sm font-medium text-luxury-charcoal placeholder:text-stone-400"
                    />
                </div>
            </div>

            {/* Grid */}
            {loading && products.length === 0 ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-stone-300" size={40} />
                </div>
            ) : filteredProducts.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="group relative bg-white rounded-2xl overflow-hidden border border-stone-100 hover:border-luxury-gold/30 hover:shadow-lg transition-all duration-300 p-2">
                                <div className="aspect-[3/4] overflow-hidden bg-stone-50 rounded-xl relative">
                                    <img
                                        src={product.image}
                                        alt={product.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity inset-0 flex items-center justify-center p-4 bg-black/5 backdrop-blur-[1px]">
                                        <Link
                                            to={`/product-groups/${product.id}`}
                                            className="px-6 py-2.5 bg-white backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest text-luxury-charcoal hover:bg-luxury-gold hover:text-white transition-all shadow-xl active:scale-95"
                                        >
                                            View
                                        </Link>
                                    </div>
                                </div>
                                <div className="p-3 text-center">
                                    <h3 className="font-serif text-base font-bold text-luxury-charcoal truncate">{product.title}</h3>
                                    <p className={`text-[10px] uppercase tracking-wider mt-1 font-bold ${product.status === "Active" ? "text-emerald-600" : product.status === "Draft" ? "text-stone-400" : "text-amber-500"}`}>
                                        {product.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {hasMore && !searchQuery && (
                        <div className="flex justify-center mt-12">
                            <LuxeButton onClick={handleLoadMore} disabled={loading} className="min-w-[200px]">
                                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : "Load More"}
                            </LuxeButton>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-stone-200 shadow-sm">
                    <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <PackageOpen className="text-stone-300" size={32} />
                    </div>
                    <h3 className="font-serif text-2xl font-black text-luxury-charcoal">Empty Collection</h3>
                    <p className="text-stone-500 font-medium mt-3 max-w-sm mx-auto">This grouping currently has no products assigned to it. You can assign products during upload or via the product details edit screen.</p>
                </div>
            )}

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

export default CategoryProductsContent;
