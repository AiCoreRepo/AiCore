import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Sparkles } from 'lucide-react';

interface AdminPageHeaderProps {
    title: string;
    subtitle?: string;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
    showBack?: boolean;
    backHref?: string;
    count?: number;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
    title,
    subtitle,
    actionLabel,
    actionHref,
    onAction,
    showBack = false,
    backHref,
    count,
}) => {
    const navigate = useNavigate();

    const handleAction = () => {
        if (onAction) {
            onAction();
        } else if (actionHref) {
            navigate(actionHref);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full flex-1 min-w-0">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0">
                {showBack && (
                    <button
                        onClick={() => backHref ? navigate(backHref) : navigate(-1)}
                        className="p-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition-all border border-neutral-700"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                )}
                <div className="min-w-0 flex-1 leading-tight">
                    <h1
                        className="text-[17px] xs:text-lg sm:text-2xl font-bold text-white tracking-tight truncate w-full"
                        style={{ fontFamily: 'Georgia, serif' }}
                    >
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-neutral-500 text-[11px] sm:text-xs mt-1 truncate w-full">
                            {subtitle}
                        </p>
                    )}
                    {typeof count === 'number' && (
                        <p className="text-neutral-500 text-[11px] sm:text-xs mt-1 truncate w-full">
                            {count} coupon{count !== 1 ? 's' : ''} found
                        </p>
                    )}
                </div>
            </div>
            {actionLabel && (
                <button
                    onClick={handleAction}
                    className="
                        group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                        bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-neutral-900
                        hover:from-[#E0C04A] hover:to-[#D4AF37]
                        transition-all duration-300 ease-out
                        active:scale-[0.97]
                        shadow-lg shadow-[#D4AF37]/20 hover:shadow-xl hover:shadow-[#D4AF37]/30
                        overflow-hidden
                    "
                >
                    {/* Shimmer effect */}
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10" />
                    <span className="relative z-10 hidden sm:inline">Create Coupon</span>
                    <span className="relative z-10 sm:hidden">Create</span>
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 relative z-10 opacity-70" />
                </button>
            )}
        </div>
    );
};
