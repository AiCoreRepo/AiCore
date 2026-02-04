import { Variants } from 'framer-motion';
import { LayoutDashboard, CheckSquare, ShoppingBag, Palette, Users, Settings, Sparkles, Upload } from 'lucide-react';

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
        // High-level pulse check: Revenue + Aura Counts + Creator Activity (Both Microservices)
    },
    {
        id: 'approvals',
        label: 'Atelier Approval',
        icon: CheckSquare,
        href: '/admin-approvals',
        isBeta: false,
        // Microservice 2 (Creator): The Gatekeeper - Review pending 20-item uploads from creators
    },
    {
        id: 'try-on-approvals',
        label: 'Try-On Approvals',
        icon: Sparkles,
        href: '/admin-tryon-approvals',
        isBeta: false,
    },
    {
        id: 'collection',
        label: 'The Collection',
        icon: ShoppingBag,
        href: '/admin-collection',
        isBeta: false,
        // Microservice 1 (Consumer): The Showroom - Manage LIVE inventory that buyers see
    },
    {
        id: 'csv-upload',
        label: 'Import Products',
        icon: Upload,
        href: '/admin-csv-upload',
        isBeta: false,
    },
    {
        id: 'artisans',
        label: 'Artisans',
        icon: Palette,
        href: '/admin-artisans',
        isBeta: true,
        // Microservice 2 (Creator): Creator Management - Designer directory, verify profiles, monitor upload limits
    },
    {
        id: 'clientele',
        label: 'Clientele',
        icon: Users,
        href: '/admin-clientele',
        isBeta: true,
        // Microservice 1 (Consumer): Buyer Management - User list, check Aura status, help stuck users
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        href: '/admin-settings',
        isBeta: false,
        // Global configuration: Admin accounts, system settings
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
