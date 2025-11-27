import { Heart, Repeat, Share2, MoreVertical } from "lucide-react";

interface ProductCardProps {
    image: string;
    title: string;
    tags: string[];
    revenue: string;
    status: "Active" | "Pending";
    isNew?: boolean;
}

const ProductCard = ({ image, title, tags, revenue, status, isNew }: ProductCardProps) => {
    return (
        <div className="bg-card rounded-xl overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-transparent hover:border-gold/20 group">
            <div className="relative">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-48 object-cover"
                />
                {isNew && (
                    <span className="absolute top-2 left-2 px-2 py-1 bg-gold text-primary-foreground text-xs font-medium rounded">
                        NEW
                    </span>
                )}
            </div>

            <div className="p-3">
                <h4 className="font-medium text-foreground mb-2">{title}</h4>

                <div className="flex flex-wrap gap-1 mb-3">
                    {tags.map((tag) => (
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
                    <span className="text-muted-foreground">Revenue</span>
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
                    <button className="p-1 text-muted-foreground hover:text-foreground">
                        <MoreVertical size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
