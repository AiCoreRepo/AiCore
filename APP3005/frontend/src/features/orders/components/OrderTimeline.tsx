// ============================================
// ORDER TIMELINE COMPONENT
// Animated vertical timeline showing order progress
// ============================================

import React from 'react';
import type { OrderStatus } from '../types/order.types';
import {
    ORDER_TIMELINE_STEPS,
    ORDER_STATUS_CONFIG,
    isStepCompleted,
    isStepActive,
    formatOrderTime,
} from '../utils/order.utils';

interface OrderTimelineProps {
    currentStatus: OrderStatus;
    statusHistory?: Array<{
        status: OrderStatus;
        timestamp: string;
        location?: string;
    }>;
    className?: string;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({
    currentStatus,
    statusHistory = [],
    className = '',
}) => {
    // Calculate current step index
    const currentIndex = ORDER_TIMELINE_STEPS.indexOf(currentStatus);
    const progressHeight = currentIndex >= 0
        ? ((currentIndex / (ORDER_TIMELINE_STEPS.length - 1)) * 100)
        : 0;

    return (
        <div className={`relative py-4 ${className}`}>
            {/* Background Line */}
            <div className="timeline-line" />

            {/* Active Progress Line */}
            <div
                className="timeline-line-active"
                style={{ height: `${progressHeight}%` }}
            />

            {/* Timeline Steps */}
            <div className="space-y-6">
                {ORDER_TIMELINE_STEPS.map((step, index) => {
                    const isCompleted = isStepCompleted(step, currentStatus);
                    const isActive = isStepActive(step, currentStatus);
                    const statusConfig = ORDER_STATUS_CONFIG[step];
                    const historyItem = statusHistory.find(h => h.status === step);

                    return (
                        <div
                            key={step}
                            className="relative flex items-start gap-4 animate-slide-up"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            {/* Timeline Dot */}
                            <div
                                className={`
                  timeline-dot flex-shrink-0
                  ${isCompleted ? 'timeline-dot-completed' : ''}
                  ${isActive ? 'timeline-dot-active' : ''}
                  ${!isCompleted && !isActive ? 'timeline-dot-pending' : ''}
                `}
                            >
                                {isCompleted ? (
                                    <svg
                                        className="w-4 h-4"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                ) : isActive ? (
                                    <div className="w-3 h-3 rounded-full bg-white" />
                                ) : (
                                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                                )}
                            </div>

                            {/* Timeline Content */}
                            <div className="flex-1 min-w-0 pb-6">
                                <div className="flex items-center justify-between">
                                    <h4
                                        className={`text-sm font-medium ${isCompleted || isActive
                                                ? 'text-gray-900'
                                                : 'text-gray-400'
                                            }`}
                                    >
                                        {statusConfig.icon} {statusConfig.label}
                                    </h4>
                                    {historyItem && (
                                        <span className="text-xs text-gray-500">
                                            {formatOrderTime(historyItem.timestamp)}
                                        </span>
                                    )}
                                </div>

                                {historyItem?.location && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        📍 {historyItem.location}
                                    </p>
                                )}

                                {isActive && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                                        <span className="font-medium">In Progress</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OrderTimeline;
