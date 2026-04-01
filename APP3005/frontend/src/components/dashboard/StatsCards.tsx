import {
    Boxes,
    CircleDollarSign,
    Eye,
    Heart,
    MessageCircle,
    PackageCheck,
    PencilLine,
    ShieldAlert,
    Sparkles,
    TrendingUp,
} from "lucide-react";
import type { DashboardStats } from "@/types/dashboard";

interface StatsCardsProps {
    stats: DashboardStats;
}

const compactNumber = (value: number) =>
    Intl.NumberFormat("en-IN", {
        notation: value >= 1000 ? "compact" : "standard",
        maximumFractionDigits: 1,
    }).format(value || 0);

const formatCurrency = (cents: number, currency: string) => {
    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: currency || "INR",
            maximumFractionDigits: 0,
        }).format((cents || 0) / 100);
    } catch {
        return `₹${Math.round((cents || 0) / 100).toLocaleString("en-IN")}`;
    }
};

const summaryCardStyles = "rounded-2xl border border-white/60 bg-white/80 p-5 shadow-[0_18px_35px_-18px_rgba(120,87,27,0.35)] backdrop-blur-sm";
const miniStatStyles = "rounded-2xl border border-[#E7D6AA]/70 bg-[#FFF9EA]/90 p-4";

const StatsCards = ({ stats }: StatsCardsProps) => {
    const summaryCards = [
        {
            label: "Total Products",
            value: compactNumber(stats.totalProducts),
            hint: `${stats.remainingSlots} of ${stats.productLimit} slots left`,
            icon: Boxes,
        },
        {
            label: "Earnings",
            value: formatCurrency(stats.earningsCents, stats.currency),
            hint: "Delivered orders",
            icon: CircleDollarSign,
        },
        {
            label: "Units Sold",
            value: compactNumber(stats.soldUnits),
            hint: "Across delivered orders",
            icon: PackageCheck,
        },
        {
            label: "Product Views",
            value: compactNumber(stats.totalViews),
            hint: `${compactNumber(stats.totalLikes)} likes and ${compactNumber(stats.totalComments)} comments`,
            icon: TrendingUp,
        },
    ];

    const statusCards = [
        { label: "Active", value: stats.statusBreakdown.active, accent: "text-emerald-700 bg-emerald-50 border-emerald-100", icon: PackageCheck },
        { label: "Pending", value: stats.statusBreakdown.pending, accent: "text-amber-700 bg-amber-50 border-amber-100", icon: Sparkles },
        { label: "Draft", value: stats.statusBreakdown.draft, accent: "text-sky-700 bg-sky-50 border-sky-100", icon: PencilLine },
        { label: "Rejected", value: stats.statusBreakdown.rejected, accent: "text-rose-700 bg-rose-50 border-rose-100", icon: ShieldAlert },
    ];

    const productUsagePct = stats.productLimit > 0
        ? Math.min(100, Math.round((stats.totalProducts / stats.productLimit) * 100))
        : 0;

    return (
        <div className="mb-6 space-y-5 md:mb-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className={summaryCardStyles}>
                            <div className="mb-4 flex items-center justify-between">
                                <div className="rounded-2xl bg-[#FFF4D6] p-3 text-[#B2872D]">
                                    <Icon size={20} />
                                </div>
                                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9A7D39]">
                                    Creator
                                </span>
                            </div>
                            <p className="text-sm font-medium text-stone-500">{card.label}</p>
                            <p className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
                                {card.value}
                            </p>
                            <p className="mt-2 text-xs text-stone-500">{card.hint}</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {statusCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className={`rounded-2xl border p-4 ${card.accent}`}>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">{card.label}</span>
                                <Icon size={16} />
                            </div>
                            <p className="mt-3 text-3xl font-semibold">{card.value}</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className={summaryCardStyles}>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9A7D39]">
                                Product Capacity
                            </p>
                            <h3 className="mt-2 font-serif text-2xl text-stone-900">
                                Creator overview
                            </h3>
                        </div>
                        <div className="rounded-full border border-[#E7D6AA] bg-[#FFF7E1] px-3 py-1 text-xs font-semibold text-[#9A7D39]">
                            {stats.totalProducts}/{stats.productLimit} used
                        </div>
                    </div>

                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#F3E8C4]">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-[#C9A55F] via-[#D9BB71] to-[#C9A55F]"
                            style={{ width: `${productUsagePct}%` }}
                        />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className={miniStatStyles}>
                            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Average Price</p>
                            <p className="mt-2 text-xl font-semibold text-stone-900">
                                {formatCurrency(stats.averagePriceCents, stats.currency)}
                            </p>
                        </div>
                        <div className={miniStatStyles}>
                            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Inventory Units</p>
                            <p className="mt-2 text-xl font-semibold text-stone-900">
                                {compactNumber(stats.totalInventoryUnits)}
                            </p>
                        </div>
                        <div className={miniStatStyles}>
                            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Likes</p>
                            <p className="mt-2 flex items-center gap-2 text-xl font-semibold text-stone-900">
                                <Heart size={16} className="text-[#C9A55F]" />
                                {compactNumber(stats.totalLikes)}
                            </p>
                        </div>
                        <div className={miniStatStyles}>
                            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Comments</p>
                            <p className="mt-2 flex items-center gap-2 text-xl font-semibold text-stone-900">
                                <MessageCircle size={16} className="text-[#C9A55F]" />
                                {compactNumber(stats.totalComments)}
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#F0E2B7] bg-[#FFFBEF] p-4">
                        <div>
                            <p className="text-sm font-medium text-stone-700">Last upload activity</p>
                            <p className="mt-1 text-xs text-stone-500">
                                {typeof stats.lastUploadDaysAgo === "number"
                                    ? stats.lastUploadDaysAgo === 0
                                        ? "Uploaded today"
                                        : `Last upload ${stats.lastUploadDaysAgo} day${stats.lastUploadDaysAgo === 1 ? "" : "s"} ago`
                                    : "No uploads yet"}
                            </p>
                        </div>

                        <div className="flex -space-x-3">
                            {(stats.latestImages || []).map((img, index) => (
                                <img
                                    key={`${img}-${index}`}
                                    src={img}
                                    alt={`Latest upload ${index + 1}`}
                                    className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm"
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className={summaryCardStyles}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9A7D39]">
                        Best Performer
                    </p>
                    <h3 className="mt-2 font-serif text-2xl text-stone-900">
                        Top product snapshot
                    </h3>

                    {stats.topProduct ? (
                        <div className="mt-5 space-y-4">
                            <div className="overflow-hidden rounded-2xl bg-[#F6F1E4]">
                                {stats.topProduct.imageUrl ? (
                                    <img
                                        src={stats.topProduct.imageUrl}
                                        alt={stats.topProduct.title}
                                        className="h-52 w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-52 items-center justify-center bg-gradient-to-br from-[#F6E8BF] to-[#F2DEC7] text-stone-600">
                                        No image
                                    </div>
                                )}
                            </div>

                            <div>
                                <p className="text-lg font-semibold text-stone-900">{stats.topProduct.title}</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <span className="rounded-full bg-[#FFF4D6] px-3 py-1 text-xs font-medium text-[#9A7D39]">
                                        {stats.topProduct.status}
                                    </span>
                                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
                                        {formatCurrency(stats.topProduct.priceCents, stats.currency)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className={miniStatStyles}>
                                    <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                                        <Eye size={14} />
                                        Views
                                    </p>
                                    <p className="mt-2 text-xl font-semibold text-stone-900">
                                        {compactNumber(stats.topProduct.views)}
                                    </p>
                                </div>
                                <div className={miniStatStyles}>
                                    <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                                        <Heart size={14} />
                                        Likes
                                    </p>
                                    <p className="mt-2 text-xl font-semibold text-stone-900">
                                        {compactNumber(stats.topProduct.likes)}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-[#F0E2B7] bg-[#FFFBEF] p-4 text-sm text-stone-600">
                                This product currently leads your catalog by visibility, then likes. Use it as the reference point for future uploads.
                            </div>
                        </div>
                    ) : (
                        <div className="mt-5 rounded-2xl border border-dashed border-[#E7D6AA] bg-[#FFFBEF] p-6 text-sm text-stone-500">
                            Upload products to unlock performance insights here.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatsCards;
