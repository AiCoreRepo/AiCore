import { Star } from "lucide-react";

interface StatsCardsProps {
    stats: {
        rating: string | number;
        ranking: string | number;
        likes: number;
        uploads: number;
        revenueLastMonthCents: number;
        latestImages?: string[];
    };
}

const StatsCards = ({ stats }: StatsCardsProps) => {
    const rankings = [
        { rank: 1, name: "Julia", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop&crop=face", score: "24.5K" },
        { rank: 2, name: "Mather", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face", score: "5,200" },
        { rank: 3, name: "Pernser", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop&crop=face", score: "#12" },
    ];

    const outfitImages = stats.latestImages && stats.latestImages.length > 0
        ? stats.latestImages
        : [
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=80&h=100&fit=crop",
            "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=80&h=100&fit=crop",
            "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=80&h=100&fit=crop",
        ];

    const revenue = (stats.revenueLastMonthCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    return (
        <div className="grid grid-cols-5 gap-4 mb-8">
            {/* Rating Card */}
            <div className="bg-card rounded-xl p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-transparent hover:border-gold/20">
                <h3 className="text-sm text-muted-foreground mb-2">Rating</h3>
                <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4].map((i) => (
                        <Star key={i} size={20} className="fill-gold text-gold" />
                    ))}
                    <Star size={20} className="fill-gold/50 text-gold" />
                </div>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                    <div className="w-4/5 h-full bg-gold rounded-full"></div>
                </div>
                <p className="mt-2 text-xl font-semibold text-foreground">{stats.rating}</p>
            </div>

            {/* Ranking Card */}
            <div className="bg-card rounded-xl p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-transparent hover:border-gold/20">
                <h3 className="text-sm text-muted-foreground mb-2">Ranking</h3>
                <div className="space-y-2">
                    {rankings.map((item) => (
                        <div key={item.rank} className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground w-4">{item.rank}</span>
                            <img
                                src={item.avatar}
                                alt={item.name}
                                className="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="flex-1 text-foreground">{item.name}</span>
                            <span className="text-muted-foreground text-xs">{item.score}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Likes Card */}
            <div className="bg-card rounded-xl p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-transparent hover:border-gold/20">
                <h3 className="text-sm text-muted-foreground mb-2">Likes</h3>
                <svg viewBox="0 0 100 40" className="w-full h-16">
                    <path
                        d="M 0 35 Q 15 30 25 25 T 50 20 T 75 15 T 100 10"
                        fill="none"
                        stroke="hsl(var(--gold))"
                        strokeWidth="2"
                    />
                    <path
                        d="M 0 35 Q 15 30 25 25 T 50 20 T 75 15 T 100 10 L 100 40 L 0 40 Z"
                        fill="hsl(var(--gold) / 0.1)"
                    />
                </svg>
                <p className="text-xl font-semibold text-foreground">{Intl.NumberFormat('en', { notation: 'compact' }).format(stats.likes)}</p>
            </div>

            {/* Outfit Uploads Card */}
            <div className="bg-card rounded-xl p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-transparent hover:border-gold/20">
                <h3 className="text-sm text-muted-foreground mb-2">Outfit Uploads</h3>
                <div className="flex gap-1 mb-2">
                    {outfitImages.map((img, i) => (
                        <img
                            key={i}
                            src={img}
                            alt={`Outfit ${i + 1}`}
                            className="w-12 h-14 object-cover rounded-md"
                        />
                    ))}
                </div>
                <p className="text-xl font-semibold text-foreground">{stats.uploads}</p>
            </div>

            {/* Earnings Card */}
            <div className="bg-card rounded-xl p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-transparent hover:border-gold/20">
                <h3 className="text-sm text-muted-foreground mb-2">Earnings</h3>
                <p className="text-2xl font-semibold text-foreground">{revenue}</p>
                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                    {["All", "3h", "6m", "1y", "5d"].map((period) => (
                        <span
                            key={period}
                            className={period === "All" ? "text-gold font-medium" : ""}
                        >
                            {period}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StatsCards;
