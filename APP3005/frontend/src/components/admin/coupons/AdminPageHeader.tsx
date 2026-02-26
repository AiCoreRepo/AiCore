import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                {showBack && (
                    <button
                        onClick={() => backHref ? navigate(backHref) : navigate(-1)}
                        className="p-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition-all border border-neutral-700"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                )}
                <div>
                    <h1
                        className="text-lg sm:text-2xl font-bold text-white leading-tight"
                        style={{ fontFamily: 'Georgia, serif' }}
                    >
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-neutral-500 text-xs mt-0.5">
                            {subtitle}
                        </p>
                    )}
                    {typeof count === 'number' && (
                        <p className="text-neutral-500 text-xs mt-0.5">
                            {count} coupon{count !== 1 ? 's' : ''} found
                        </p>
                    )}
                </div>
            </div>
            {actionLabel && (
                <button
                    onClick={handleAction}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                        bg-[#D4AF37] text-neutral-900 hover:bg-[#D4AF37]/90 transition-all duration-300
                        active:scale-[0.98] shadow-lg shadow-[#D4AF37]/10"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};
