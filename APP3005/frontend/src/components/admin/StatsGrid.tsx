import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { TrendingUp, Users, CheckCircle, DollarSign } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { colors, typography } from '@/constants/theme';

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    suffix?: string;
    prefix?: string;
    trend?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, suffix = '', prefix = '', trend }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const controls = useAnimation();

    useEffect(() => {
        // Animate number counting up
        let startTime: number;
        const duration = 1500; // 1.5 seconds

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setDisplayValue(Math.floor(value * easeOutQuart));

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setDisplayValue(value);
            }
        };

        requestAnimationFrame(animate);

        // Trigger icon animation
        controls.start({
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0],
            transition: { duration: 0.5, delay: 0.2 },
        });
    }, [value, controls]);

    return (
        <GlassCard hover className="relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-neutral-400 font-medium uppercase tracking-wider">
                        {title}
                    </p>
                    <motion.div
                        animate={controls}
                        className="p-2 bg-[#D4AF37]/10 rounded-lg"
                    >
                        {icon}
                    </motion.div>
                </div>

                {/* Value */}
                <div className="flex items-baseline gap-2">
                    <motion.h3
                        className="text-4xl font-bold text-neutral-100"
                        style={{ fontFamily: typography.fontSerif }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {prefix}{displayValue.toLocaleString()}{suffix}
                    </motion.h3>

                    {trend !== undefined && (
                        <span className={`text-sm font-semibold ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trend >= 0 ? '+' : ''}{trend}%
                        </span>
                    )}
                </div>

                {/* Trend indicator */}
                {trend !== undefined && trend >= 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>vs last month</span>
                    </div>
                )}
            </div>
        </GlassCard>
    );
};

interface StatsGridProps {
    stats: {
        totalCreators: number;
        totalProducts: number;
        pendingApprovals: number;
        totalRevenue: number;
    };
}

/**
 * StatsGrid - Animated statistics cards with count-up animation
 * Displays 4 key metrics with glassmorphism design
 */
export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Total Creator Artisans"
                value={stats.totalCreators}
                icon={<Users className="w-5 h-5 text-[#D4AF37]" />}
                trend={12}
            />

            <StatCard
                title="Active Collections"
                value={stats.totalProducts}
                icon={<CheckCircle className="w-5 h-5 text-[#D4AF37]" />}
                trend={8}
            />

            <StatCard
                title="Pending Approvals"
                value={stats.pendingApprovals}
                icon={<CheckCircle className="w-5 h-5 text-[#D4AF37]" />}
            />

            <StatCard
                title="Monthly Revenue"
                value={stats.totalRevenue}
                prefix="$"
                suffix="M"
                icon={<DollarSign className="w-5 h-5 text-[#D4AF37]" />}
                trend={15}
            />
        </div>
    );
};
