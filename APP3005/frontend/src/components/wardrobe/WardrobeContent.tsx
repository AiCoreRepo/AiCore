import React, { useState, useEffect } from "react";
import { getCreatorProducts } from "@/lib/api";
import { Search, Filter, Plus, Shirt, Loader2 } from "lucide-react";
import { LuxeButton } from "@/components/common/Buttons/LuxeButton";
import UploadCollectionModal from "@/components/dashboard/UploadCollectionModal";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

const WardrobeContent: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const fetchWardrobe = async () => {
        setLoading(true);
        try {
            // Fetch all products (pagination handled loosely here for the visual closet)
            const response = await getCreatorProducts(1);
            let data = [];
            if (Array.isArray(response)) {
                data = response;
            } else {
                data = response.data || [];
            }

            // Map to usable format
            const mapped = data.map((p: any) => ({
                id: p.product_id,
                title: p.name || "Unnamed Item",
                image: p.image_url || "https://placehold.co/400x600/F5F2EB/8B7355?text=No+Image",
                category: p.tags?.[0]?.name || "Uncategorized",
                status: p.status === 'approved' ? 'Active' : 'Pending',
                price: p.price,
            }));

            setProducts(mapped);
        } catch (error) {
            console.error("Failed to fetch wardrobe", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWardrobe();
    }, []);

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === "All" || p.category.toLowerCase().includes(filter.toLowerCase());
        return matchesSearch && matchesFilter;
    });

    const categories = ["All", "Dress", "Top", "Bottom", "Outerwear", "Accessory"];

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
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-luxury-gold" size={40} />
                </div>
            ) : filteredProducts.length > 0 ? (
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
                                        onClick={() => setSelectedImage(product.image)}
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
                onSuccess={fetchWardrobe}
            />

            {/* Image Lightbox */}
            <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
                <DialogContent className="max-w-[95vw] w-full h-[90vh] bg-black/95 border-none shadow-none p-0 flex flex-col items-center justify-center outline-none !rounded-none">
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 z-50 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                        >
                            <X size={24} />
                        </button>
                        {selectedImage && (
                            <img
                                src={selectedImage}
                                alt="Product Detail"
                                className="max-w-full max-h-full object-contain select-none"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WardrobeContent;
