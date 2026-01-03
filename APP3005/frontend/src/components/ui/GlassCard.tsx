import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

/**
 * GlassCard - Glassmorphism effect wrapper component
 * Implements frosted glass aesthetic with backdrop blur
 * 
 * @param hover - Enable hover lift animation
 */
export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className,
    hover = false
}) => {
    return (
        <motion.div
            className={cn(
                // Glassmorphism base
                'bg-neutral-800/50 backdrop-blur-md',
                // Border and shadow
                'border border-white/10',
                'shadow-xl shadow-black/20',
                // Rounded corners
                'rounded-2xl',
                // Padding
                'p-6',
                // Custom classes
                className
            )}
            whileHover={hover ? { y: -5 } : undefined}
            transition={{ duration: 0.2 }}
        >
            {children}
        </motion.div>
    );
};
