import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, User } from "lucide-react";
import { LuxeButton } from "@/components/common/Buttons/LuxeButton";

interface Review {
    id: string;
    user: string;
    avatar?: string;
    rating: number;
    comment: string;
    date: string;
}

interface ReviewsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productTitle: string;
    reviews?: Review[]; // Optional for now, can fallback to mock
}

const ReviewsModal: React.FC<ReviewsModalProps> = ({ open, onOpenChange, productTitle, reviews = [] }) => {
    // Mock reviews if none provided
    const displayReviews = reviews.length > 0 ? reviews : [
        {
            id: "1",
            user: "Sarah M.",
            rating: 5,
            comment: "Absolutely love this! The quality is amazing.",
            date: "2 days ago"
        },
        {
            id: "2",
            user: "James L.",
            rating: 4,
            comment: "Great fit, but shipping took a bit longer than expected.",
            date: "1 week ago"
        },
        {
            id: "3",
            user: "Emily R.",
            rating: 5,
            comment: "Perfect for my summer collection. Highly recommend!",
            date: "2 weeks ago"
        }
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="dashboard-theme bg-foreground text-primary-foreground sm:max-w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-4 border-b border-muted-foreground/10">
                    <DialogTitle className="text-xl font-semibold text-primary-foreground">
                        Reviews for {productTitle}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
                    {displayReviews.map((review) => (
                        <div key={review.id} className="bg-muted-foreground/10 rounded-lg p-4 border border-muted-foreground/10">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-luxury-gold/20 flex items-center justify-center text-luxury-gold">
                                        {review.avatar ? <img src={review.avatar} alt={review.user} className="w-full h-full rounded-full" /> : <User size={14} />}
                                    </div>
                                    <span className="font-medium text-sm">{review.user}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{review.date}</span>
                            </div>
                            <div className="flex mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={12}
                                        className={i < review.rating ? "fill-luxury-gold text-luxury-gold" : "text-muted-foreground"}
                                    />
                                ))}
                            </div>
                            <p className="text-sm text-muted-foreground/80 leading-relaxed">
                                {review.comment}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-muted-foreground/10">
                    <LuxeButton onClick={() => onOpenChange(false)} className="w-full" variant="luxury">
                        Close
                    </LuxeButton>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ReviewsModal;
