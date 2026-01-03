import React from "react";
import { DashboardStats } from "../../types/dashboard";
import { Star, Flame, ThumbsUp, Shirt, Wallet } from "lucide-react";

interface StatsGridProps {
  stats: DashboardStats;
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
      <div className="bg-gradient-to-br from-white to-luxury-cream rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center gap-3 text-luxury-charcoal text-sm font-medium mb-2"><Star className="h-4 w-4 text-luxury-gold" />Rating</div>
        <h3 className="text-3xl font-bold text-luxury-black tracking-tight">{stats.rating ?? 'NA'}</h3>
        <p className="text-sm text-stone-500 mt-1">Based on user views</p>
      </div>
      <div className="bg-gradient-to-br from-white to-luxury-cream rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center gap-2 text-stone-500 text-sm mb-1"><Flame className="h-4 w-4 text-luxury-gold" />Ranking</div>
        <h3 className="text-2xl font-bold text-luxury-black">{stats.ranking ?? 'NA'}</h3>
        <p className="text-xs text-stone-400">Month</p>
      </div>
      <div className="bg-gradient-to-br from-white to-luxury-cream rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center gap-2 text-stone-500 text-sm mb-1"><ThumbsUp className="h-4 w-4 text-luxury-gold" />Likes</div>
        <div className="flex items-baseline gap-3">
          <h3 className="text-2xl font-bold text-luxury-black">{stats.likes != null ? Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(stats.likes) : 'NA'}</h3>
          {typeof stats.likesChangePct === 'number' && (
            <span className={`text-sm font-semibold px-2 py-1 rounded-full ${stats.likesChangePct >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {stats.likesChangePct >= 0 ? '↑' : '↓'} {Math.abs(stats.likesChangePct)}%
            </span>
          )}
        </div>
        <p className="text-xs text-stone-400">Weekly</p>
      </div>
      <div className="bg-gradient-to-br from-white to-luxury-cream rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center gap-2 text-stone-500 text-sm mb-1"><Shirt className="h-4 w-4 text-luxury-gold" />Outfit Uploads</div>
        <h3 className="text-2xl font-bold text-luxury-black">{stats.uploads ?? 'NA'}</h3>
        {typeof stats.lastUploadDaysAgo === 'number' && (
          <p className="text-xs text-stone-400">Last upload {stats.lastUploadDaysAgo} days ago</p>
        )}
      </div>
      <div className="bg-gradient-to-br from-white to-luxury-cream rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center gap-2 text-stone-500 text-sm mb-1"><Wallet className="h-4 w-4 text-luxury-gold" />Revenue</div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-luxury-black">{stats.revenueLastMonthCents != null ? `$${((stats.revenueLastMonthCents) / 100).toLocaleString()}` : 'NA'}</h3>
          {typeof stats.revenueChangePct === 'number' && (
            <span className={`text-xs font-medium ${stats.revenueChangePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.revenueChangePct >= 0 ? '↑' : '↓'} {Math.abs(stats.revenueChangePct)}%
            </span>
          )}
        </div>
        <p className="text-xs text-stone-400">Last month</p>
      </div>
    </div>
  );
};

export default StatsGrid;