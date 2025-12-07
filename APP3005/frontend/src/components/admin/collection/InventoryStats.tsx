import React from 'react';
import { ShoppingBag, Star, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { typography } from '@/constants/theme';
import { CollectionStats } from '@/hooks/useApprovedProducts';

interface InventoryStatsProps {
    stats: CollectionStats;
    isLoading?: boolean;
}

export const InventoryStats: React.FC<InventoryStatsProps> = ({ stats, isLoading }) => {
    const statCards = [
        {
            label: 'Total Collection',
            value: stats.total,
            icon: ShoppingBag,
            color: 'text-[#D4AF37]',
            bgColor: 'bg-[#D4AF37]/10',
        },
        {
            label: 'Featured Items',
            value: stats.featured,
            icon: Star,
            color: 'text-[#D4AF37]',
            bgColor: 'bg-[#D4AF37]/10',
        },
        {
            label: 'Low Stock Alert',
            value: stats.lowStock,
            icon: AlertTriangle,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-neutral-800/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-[#D4AF37]/30 transition-colors"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                                <Icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            {isLoading ? (
                                <div className="w-16 h-8 bg-white/5 animate-pulse rounded" />
                            ) : (
                                <span
                                    className={`text-3xl font-bold ${stat.color}`}
                                    style={{ fontFamily: typography.fontSerif }}
                                >
                                    {stat.value}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-neutral-400">{stat.label}</p>
                    </motion.div>
                );
            })}
        </div>
    );
};
