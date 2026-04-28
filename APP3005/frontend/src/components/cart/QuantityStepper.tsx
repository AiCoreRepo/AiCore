import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
    quantity: number;
    maxQuantity: number;
    onIncrement: () => void;
    onDecrement: () => void;
    disabled?: boolean;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
    quantity,
    maxQuantity,
    onIncrement,
    onDecrement,
    disabled = false,
}) => {
    const isMinDisabled = disabled || quantity <= 1;
    const isMaxDisabled = disabled || quantity >= maxQuantity;

    return (
        <div className="inline-flex items-center rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
            {/* Minus Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isMinDisabled) onDecrement();
                }}
                disabled={isMinDisabled}
                className={`
                    w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center
                    transition-all duration-200
                    ${isMinDisabled
                        ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200'
                    }
                `}
                aria-label="Decrease quantity"
            >
                <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>

            {/* Quantity Display */}
            <div
                className="w-8 sm:w-10 h-8 sm:h-9 flex items-center justify-center border-x border-gray-200 select-none"
                style={{ fontVariantNumeric: 'tabular-nums' }}
            >
                <span
                    key={quantity}
                    className="text-sm sm:text-base font-semibold text-gray-900"
                    style={{
                        animation: 'qtyBounce 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    }}
                >
                    {quantity}
                </span>
            </div>

            {/* Plus Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isMaxDisabled) onIncrement();
                }}
                disabled={isMaxDisabled}
                className={`
                    w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center
                    transition-all duration-200
                    ${isMaxDisabled
                        ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                        : 'text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#C5A028] active:bg-[#D4AF37]/20'
                    }
                `}
                aria-label="Increase quantity"
            >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>

            {/* Bounce animation */}
            <style>{`
                @keyframes qtyBounce {
                    0% { transform: scale(0.6); opacity: 0.5; }
                    60% { transform: scale(1.15); }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};
