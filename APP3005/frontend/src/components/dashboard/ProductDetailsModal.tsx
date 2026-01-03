import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LuxeButton } from "@/components/common/Buttons/LuxeButton";
import { Heart, MessageCircle, Share2, CheckCircle2, Clock, Tag, FileText } from "lucide-react";

interface ProductDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: {
        image: string;
        images?: string[];
        title: string;
        description?: string;
        tags: string[];
        revenue: string;
        status: "Active" | "Pending" | "Draft";
        stats?: {
            likes_count: number;
            comments_count: number;
            shares_count?: number;
            tries_count?: number;
        };
    };
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ open, onOpenChange, product }) => {
    const [selectedImage, setSelectedImage] = useState(product.image);
    const displayImages = product.images && product.images.length > 0 ? product.images : [product.image];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="dashboard-theme bg-foreground text-primary-foreground max-w-4xl max-h-[90vh] overflow-y-auto border-none shadow-2xl p-0 gap-0">
                <div className="flex flex-col md:flex-row h-full">
                    {/* Left Side: Image Gallery */}
                    <div className="w-full md:w-1/2 bg-black/50 p-6 flex flex-col gap-4">
                        <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden border border-white/10 bg-stone-900">
                            <img
                                src={selectedImage}
                                alt={product.title}
                                className="w-full h-full object-contain"
                            />
                        </div>
                        {displayImages.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                {displayImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(img)}
                                        className={`relative w-20 aspect-square rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${selectedImage === img ? "border-luxury-gold" : "border-transparent hover:border-white/20"
                                            }`}
                                    >
                                        <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Side: Details */}
                    <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col h-full overflow-y-auto">
                        <DialogHeader className="mb-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <DialogTitle className="text-2xl font-serif text-luxury-gold mb-2">
                                        {product.title}
                                    </DialogTitle>
                                    <div className="flex flex-wrap gap-2">
                                        {product.tags.map((tag) => (
                                            <span key={tag} className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-stone-400 uppercase tracking-wider flex items-center gap-1">
                                                <Tag size={10} /> {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <span className="font-serif text-xl font-medium text-luxury-gold tracking-wide whitespace-nowrap">
                                    {product.revenue}
                                </span>
                            </div>
                        </DialogHeader>

                        <div className="space-y-6 flex-1">
                            {/* Status */}
                            <div className="flex items-center gap-2">
                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase ${product.status === "Active"
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : product.status === "Draft"
                                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                            : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                    }`}>
                                    {product.status === "Active" ? <CheckCircle2 size={12} /> : product.status === "Draft" ? <FileText size={12} /> : <Clock size={12} />}
                                    {product.status}
                                </span>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-stone-300 uppercase tracking-wider">Description</h4>
                                <p className="text-sm text-stone-400 leading-relaxed">
                                    {product.description || "No description provided."}
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 py-6 border-y border-white/10">
                                <div className="flex flex-col items-center gap-1 text-center">
                                    <Heart className="text-luxury-gold" size={20} />
                                    <span className="text-lg font-bold text-white">{product.stats?.likes_count || 0}</span>
                                    <span className="text-xs text-stone-500 uppercase tracking-wider">Likes</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 text-center">
                                    <MessageCircle className="text-luxury-gold" size={20} />
                                    <span className="text-lg font-bold text-white">{product.stats?.comments_count || 0}</span>
                                    <span className="text-xs text-stone-500 uppercase tracking-wider">Comments</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 text-center">
                                    <Share2 className="text-luxury-gold" size={20} />
                                    <span className="text-lg font-bold text-white">{product.stats?.shares_count || 0}</span>
                                    <span className="text-xs text-stone-500 uppercase tracking-wider">Shares</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-white/10">
                            <LuxeButton onClick={() => onOpenChange(false)} className="w-full" variant="luxury-outline">
                                Close Details
                            </LuxeButton>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProductDetailsModal;
