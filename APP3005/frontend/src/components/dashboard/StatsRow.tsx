import React from "react";

const StatCard = ({ title, value, children }: { title: string; value: React.ReactNode; children?: React.ReactNode }) => (
  <div className="bg-white rounded-xl border border-[#E5E0D8] shadow-[0_4px_20px_-5px_rgba(212,175,55,0.15)] p-7 flex flex-col items-center min-w-[140px]">
    <span className="font-sans text-xs text-[#8B7355]">{title}</span>
    <span className="font-serif text-3xl text-[#2D2D2D] font-bold mt-1">{value}</span>
    {children}
  </div>
);

const StatsRow: React.FC<{ stats: any }> = ({ stats }) => (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
    <StatCard title="Rating" value={stats.rating ?? "NA"} />
    <StatCard title="Ranking" value={stats.ranking ?? "NA"} />
    <StatCard title="Likes" value={stats.likes ?? "NA"} />
    <StatCard title="Outfit Uploads" value={stats.uploads ?? "NA"} />
    <StatCard title="Earnings" value={`$${stats.revenueLastMonthCents ? (stats.revenueLastMonthCents / 100).toLocaleString() : "0"}`} />
  </div>
);

export default StatsRow;
