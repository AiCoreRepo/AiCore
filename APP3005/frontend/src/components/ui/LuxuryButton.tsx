import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { animations } from '@/constants/theme';

type ButtonVariant = 'primary' | 'gold' | 'destructive' | 'ghost';

interface LuxuryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    isLoading?: boolean;
    icon?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * LuxuryButton - Highly polished animated button component
 * Implements Midnight Luxury design with Framer Motion
 */
export const LuxuryButton: React.FC<LuxuryButtonProps> = ({
    variant = 'primary',
    isLoading = false,
    icon,
    children,
    className,
    disabled,
    ...props
}) => {
    const variantStyles = {
        primary: cn(
            'bg-neutral-950 border-2 border-[#D4AF37]',
            'text-[#D4AF37] font-semibold',
            'hover:bg-[#D4AF37]/10',
            'shadow-lg shadow-[#D4AF37]/20'
        ),
        gold: cn(
            'bg-gradient-to-r from-[#D4AF37] to-[#F4D03F]',
            'text-neutral-950 font-bold',
            'hover:from-[#F4D03F] hover:to-[#D4AF37]',
            'shadow-lg shadow-[#D4AF37]/40'
        ),
        destructive: cn(
            'bg-red-600 border-2 border-red-500',
            'text-white font-semibold',
            'hover:bg-red-700',
            'shadow-lg shadow-red-500/50',
            'hover:shadow-red-500/70'
        ),
        ghost: cn(
            'bg-transparent border-2 border-white/20',
            'text-neutral-200 font-medium',
            'hover:bg-white/5 hover:border-white/30'
        ),
    };

    return (
        <motion.button
            className={cn(
                // Base styles
                'px-6 py-3 rounded-xl',
                'flex items-center justify-center gap-2',
                'transition-all duration-300',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                // Variant styles
                variantStyles[variant],
                // Custom className
                className
            )}
            whileHover={!disabled && !isLoading ? animations.hoverScale : undefined}
            whileTap={!disabled && !isLoading ? animations.tapScale : undefined}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading...</span>
                </>
            ) : (
                <>
                    {icon && <span className="flex-shrink-0">{icon}</span>}
                    <span>{children}</span>
                </>
            )}
        </motion.button>
    );
};
