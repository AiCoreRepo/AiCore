// ============================================
// STATUS BADGE COMPONENT
// Animated status badge with pulse effect
// ============================================

import React from 'react';
import type { OrderStatus, PaymentStatus } from '../types/order.types';
import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '../utils/order.utils';

interface StatusBadgeProps {
    status: OrderStatus | PaymentStatus;
    type?: 'order' | 'payment';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    type = 'order',
    size = 'md',
    className = '',
}) => {
    const config = type === 'order'
        ? ORDER_STATUS_CONFIG[status as OrderStatus]
        : PAYMENT_STATUS_CONFIG[status as PaymentStatus];

    if (!config) return null;

    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-base',
    };

    return (
        <span
            className={`
        inline-flex items-center gap-2 rounded-full font-medium
        status-badge transition-all duration-300
        ${sizeClasses[size]}
        ${config.pulse ? 'status-badge-pulse animate-pulse' : ''}
        ${className}
      `}
            style={{
                backgroundColor: config.bgColor,
                color: config.color,
            }}
        >
            {config.icon && <span className="text-base">{config.icon}</span>}
            <span>{config.label}</span>
        </span>
    );
};

export default StatusBadge;
