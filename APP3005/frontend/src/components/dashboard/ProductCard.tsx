import { useState } from "react";
import { Heart, MessageCircle, Share2, ChevronLeft, ChevronRight, X, CheckCircle2, Clock, Eye, Send, FileText } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ActionMenu } from "@/components/common/ActionMenu";
import ProductDetailsModal from "./ProductDetailsModal";
import ReviewsModal from "./ReviewsModal";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
    image: string;
    images?: string[];
    title: string;
    description?: string;
    tags: string[];
    revenue: string;
    status: "Active" | "Pending" | "Draft";
    isNew?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    onPublish?: () => void;
    product_id?: string;
    stats?: {
        likes_count: number;
        comments_count: number;
        shares_count?: number;
        tries_count?: number;
    };
}

const ProductCard = ({ image, images = [], title, description, tags, revenue, status, isNew, onEdit, onDelete, onPublish, product_id, stats }: ProductCardProps) => {
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [isReviewsOpen, setIsReviewsOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const { toast } = useToast();

    // Ensure we have a valid list of images to show
    const displayImages = images.length > 0 ? images : [image];
    const additionalImagesCount = Math.max(0, displayImages.length - 1);

    const openGallery = () => {
        setCurrentImageIndex(0);
        setIsGalleryOpen(true);
    };

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
    };

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        toast({
            title: "Shared!",
            description: "Product link copied to clipboard.",
        });
    };

    const handleReviewsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsReviewsOpen(true);
    };

    return (
        <>
            <div
                className="group relative bg-white rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 hover:border-luxury-gold/30"
                onClick={openGallery}
            >
                {/* Image Section */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-50">
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {isNew && (
                            <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md text-luxury-black text-[10px] font-bold tracking-wider uppercase rounded-sm shadow-sm">
                                New Arrival
                            </span>
                        )}
                    </div>

                    {/* Quick Actions Overlay */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        <button
                            className="p-2 bg-white text-luxury-black rounded-full shadow-lg hover:bg-luxury-gold hover:text-white transition-colors"
                            onClick={(e) => { e.stopPropagation(); openGallery(); }}
                            title="Quick View"
                        >
                            <Eye size={16} />
                        </button>
                        <button
                            className="p-2 bg-white text-luxury-black rounded-full shadow-lg hover:bg-luxury-gold hover:text-white transition-colors"
                            onClick={handleShare}
                            title="Share"
                        >
                            <Share2 size={16} />
                        </button>
                    </div>

                    {/* Image Counter */}
                    {additionalImagesCount > 0 && (
                        <div className="absolute top-3 right-3 bg-neutral-800/60 backdrop-blur-md text-white text-[10px] font-medium px-2 py-1 rounded-full">
                            +{additionalImagesCount}
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h4 className="font-serif text-lg text-luxury-black leading-tight mb-1 group-hover:text-luxury-gold transition-colors">
                                {title}
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {tags.slice(0, 2).map((tag) => (
                                    <span key={tag} className="text-[10px] text-stone-500 uppercase tracking-wide">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <ActionMenu
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onViewDetails={() => setIsDetailsOpen(true)}
                        />
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 py-3 border-b border-stone-100 mb-3">
                        <div className="flex items-center gap-1.5 text-stone-400 group-hover:text-luxury-gold/80 transition-colors">
                            <Heart size={14} className={stats?.likes_count ? "fill-luxury-gold text-luxury-gold" : ""} />
                            <span className="text-xs font-medium">{stats?.likes_count || 0}</span>
                        </div>
                        <div
                            className="flex items-center gap-1.5 text-stone-400 hover:text-luxury-gold cursor-pointer transition-colors"
                            onClick={handleReviewsClick}
                        >
                            <MessageCircle size={14} />
                            <span className="text-xs font-medium">{stats?.comments_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-stone-400">
                            <Share2 size={14} />
                            <span className="text-xs font-medium">{stats?.shares_count || stats?.tries_count || 0}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                        {/* Status Badge - Left Aligned */}
                        <span className={`flex items-center gap-1.5 pl-2.5 pr-3 py-1 rounded-full text-[10px] font-medium tracking-wide uppercase ${status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : status === "Draft"
                                ? "bg-blue-50 text-blue-700 border border-blue-100"
                                : "bg-amber-50 text-amber-700 border border-amber-100"
                            }`}>
                            {status === "Active" ? <CheckCircle2 size={10} /> : status === "Draft" ? <FileText size={10} /> : <Clock size={10} />}
                            {status}
                        </span>

                        {/* Revenue - Right Aligned */}
                        <span className="font-serif text-sm font-medium text-luxury-gold tracking-wide">
                            {revenue}
                        </span>
                    </div>

                    {/* Publish Button for Draft Products */}
                    {status === "Draft" && onPublish && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onPublish();
                            }}
                            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-luxury-gold text-white rounded-lg hover:bg-luxury-gold/90 transition-all duration-300 shadow-sm hover:shadow-md font-medium text-sm"
                        >
                            <Send size={16} />
                            Publish for Approval
                        </button>
                    )}
                </div>
            </div>

            {/* Lightbox Gallery */}
            <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
                <DialogContent className="max-w-[95vw] w-full h-[90vh] bg-black/95 border-none shadow-none p-0 flex flex-col items-center justify-center outline-none !rounded-none">
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                        {/* Close Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsGalleryOpen(false);
                            }}
                            className="absolute top-4 right-4 z-50 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        {/* Image */}
                        <img
                            src={displayImages[currentImageIndex]}
                            alt={`${title} - View ${currentImageIndex + 1}`}
                            className="max-w-full max-h-full object-contain select-none"
                        />

                        {/* Navigation */}
                        {displayImages.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm"
                                >
                                    <ChevronLeft size={32} />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm"
                                >
                                    <ChevronRight size={32} />
                                </button>

                                {/* Counter */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 text-white text-sm rounded-full backdrop-blur-sm border border-white/10">
                                    {currentImageIndex + 1} / {displayImages.length}
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <ReviewsModal
                open={isReviewsOpen}
                onOpenChange={setIsReviewsOpen}
                productTitle={title}
            />

            <ProductDetailsModal
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                product={{
                    image,
                    images,
                    title,
                    description,
                    tags,
                    revenue,
                    status,
                    stats
                }}
            />
        </>
    );
};

export default ProductCard;
