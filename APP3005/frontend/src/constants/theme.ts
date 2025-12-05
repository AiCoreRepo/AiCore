import { Variants } from 'framer-motion';
import { LayoutDashboard, CheckCircle, Users, DollarSign, BarChart3, Settings } from 'lucide-react';

/**
 * Midnight Luxury Design Tokens
 * A cohesive design system for the Admin Dashboard
 */

// Color Palette
export const colors = {
    gold: '#D4AF37',
    deepBlack: 'rgb(10, 10, 10)', // bg-neutral-950
    textPrimary: 'rgb(229, 229, 229)', // text-neutral-200
    textMuted: 'rgb(163, 163, 163)', // text-neutral-400
    glassBackground: 'rgba(0, 0, 0, 0.4)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
} as const;

// Framer Motion Animation Variants
export const animations = {
    // Hover scale effect
    hoverScale: {
        scale: 1.02,
        transition: { duration: 0.2, ease: 'easeOut' },
    },

    // Tap scale effect
    tapScale: {
        scale: 0.98,
        transition: { duration: 0.1 },
    },

    // Fade in animation
    fadeIn: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        transition: { duration: 0.3 },
    } as Variants,

    // Card lift on hover
    cardLift: {
        rest: { y: 0 },
        hover: { y: -5, transition: { duration: 0.2 } },
    },

    // Modal animations
    modalBackdrop: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    } as Variants,

    modalContent: {
        initial: { opacity: 0, y: 50, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 50, scale: 0.95 },
    } as Variants,

    // Number count up
    numberCount: {
        initial: { opacity: 0, scale: 0.5 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.5, ease: 'easeOut' },
    },
} as const;

// Sidebar Menu Configuration
export interface MenuItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    isBeta?: boolean;
}

export const menuItems: MenuItem[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/admin-dashboard',
        isBeta: false,
    },
    {
        id: 'approvals',
        label: 'Atelier Approval',
        icon: CheckCircle,
        href: '/admin-dashboard/approvals',
        isBeta: false,
    },
    {
        id: 'creators',
        label: 'Creator Artisans',
        icon: Users,
        href: '/admin-dashboard/creators',
        isBeta: true,
    },
    {
        id: 'analytics',
        label: 'Collection Analytics',
        icon: BarChart3,
        href: '/admin-dashboard/analytics',
        isBeta: true,
    },
    {
        id: 'financial',
        label: 'Financial Suite',
        icon: DollarSign,
        href: '/admin-dashboard/financial',
        isBeta: true,
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        href: '/admin-dashboard/settings',
        isBeta: true,
    },
];

// Typography
export const typography = {
    fontSerif: 'Playfair Display, serif',
    fontSans: 'Inter, system-ui, sans-serif',
} as const;

// Spacing
export const spacing = {
    sidebarWidth: '280px',
    sidebarWidthCollapsed: '80px',
} as const;
