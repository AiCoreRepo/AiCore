import React, { useState } from 'react';
import { CheckCircle2, Clock, XCircle, Info } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProductStatusBadgeProps {
    status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'Active' | 'Pending' | 'Rejected';
    reason?: string;
}

const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({ status, reason }) => {
    // Normalize status to uppercase for consistency
    const normalizedStatus = status.toUpperCase() as 'APPROVED' | 'PENDING' | 'REJECTED';

    // Badge configurations for each status
    const badgeConfig = {
        APPROVED: {
            icon: CheckCircle2,
            label: 'Approved',
            className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            iconColor: 'text-emerald-600',
        },
        PENDING: {
            icon: Clock,
            label: 'Pending Review',
            className: 'bg-amber-50 text-amber-700 border-amber-200',
            iconColor: 'text-amber-600',
        },
        REJECTED: {
            icon: XCircle,
            label: 'Rejected',
            className: 'bg-red-50 text-red-700 border-red-200',
            iconColor: 'text-red-600',
        },
    };

    const config = badgeConfig[normalizedStatus] || badgeConfig.PENDING;
    const Icon = config.icon;

    // For rejected status with reason, show tooltip
    if (normalizedStatus === 'REJECTED' && reason) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 hover:shadow-md cursor-help ${config.className}`}
                        >
                            <Icon size={14} className={config.iconColor} />
                            <span>{config.label}</span>
                            <Info size={12} className="opacity-70" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent
                        side="bottom"
                        className="max-w-xs bg-stone-900 text-white p-4 rounded-lg shadow-xl border border-stone-700"
                    >
                        <div className="space-y-2">
                            <p className="font-semibold text-sm text-luxury-gold">Rejection Reason:</p>
                            <p className="text-sm leading-relaxed">{reason}</p>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // For approved or pending status (no tooltip needed)
    return (
        <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 ${config.className}`}
        >
            <Icon size={14} className={config.iconColor} />
            <span>{config.label}</span>
        </div>
    );
};

export default ProductStatusBadge;
