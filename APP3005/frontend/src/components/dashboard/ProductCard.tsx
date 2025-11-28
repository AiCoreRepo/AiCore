import { useState } from "react";
import { Heart, Repeat, Share2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ActionMenu } from "@/components/common/ActionMenu";

interface ProductCardProps {
    image: string;
    images?: string[];
    title: string;
    tags: string[];
    revenue: string;
    status: "Active" | "Pending";
    isNew?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
}

const ProductCard = ({ image, images = [], title, tags, revenue, status, isNew, onEdit, onDelete }: ProductCardProps) => {
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

    return (
        <>
            <div
                className="bg-card rounded-xl overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-transparent hover:border-gold/20 group"
                onClick={openGallery}
            >
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {isNew && (
                        <span className="absolute top-2 left-2 px-2 py-1 bg-gold text-primary-foreground text-xs font-medium rounded z-10">
                            NEW
                        </span>
                    )}
                    {additionalImagesCount > 0 && (
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm z-10">
                            +{additionalImagesCount}
                        </div>
                    )}
                </div>

                <div className="p-3">
                    <h4 className="font-medium text-foreground mb-2 line-clamp-1">{title}</h4>

                    <div className="flex flex-wrap gap-1 mb-3">
                        {tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                            <Heart size={12} />
                            <span>Likes</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Repeat size={12} />
                            <span>Tries</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Share2 size={12} />
                            <span>Shares</span>
                        </div>
                        <span className="ml-auto font-medium text-foreground">{revenue}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <button
                            className={`px-6 py-1.5 rounded-full text-sm font-medium ${status === "Active"
                                ? "bg-gold text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                                }`}
                        >
                            {status}
                        </button>

                        <ActionMenu onEdit={onEdit} onDelete={onDelete} />
                    </div>
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
        </>
    );
};

export default ProductCard;
