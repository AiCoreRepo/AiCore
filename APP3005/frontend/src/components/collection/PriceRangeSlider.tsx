import { useState } from "react";

interface PriceRangeSliderProps {
    min: number;
    max: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    currency?: string;
}

export const PriceRangeSlider = ({
    min,
    max,
    value,
    onChange,
    currency = "₹"
}: PriceRangeSliderProps) => {
    const [localValue, setLocalValue] = useState(value);
    const [isDragging, setIsDragging] = useState(false);

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMin = Number(e.target.value);
        const newValue: [number, number] = [Math.min(newMin, localValue[1]), localValue[1]];
        setLocalValue(newValue);
        onChange(newValue);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMax = Number(e.target.value);
        const newValue: [number, number] = [localValue[0], Math.max(newMax, localValue[0])];
        setLocalValue(newValue);
        onChange(newValue);
    };

    const formatPrice = (price: number) => {
        return `${currency}${price.toLocaleString()}`;
    };

    return (
        <div
            className="px-5 py-3 rounded-xl border transition-all duration-300"
            style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFAF8 100%)',
                borderColor: isDragging ? '#D4AF37' : 'rgba(0, 0, 0, 0.1)',
                minWidth: '240px',
                boxShadow: isDragging
                    ? '0 8px 24px rgba(212, 175, 55, 0.2)'
                    : '0 2px 8px rgba(0, 0, 0, 0.08)',
            }}
        >
            {/* Header with Price Display - Myntra Style */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 font-medium">PRICE</span>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: '#D4AF37' }}>
                        {formatPrice(localValue[0])}
                    </span>
                    <span className="text-xs text-gray-400">-</span>
                    <span className="text-sm font-bold" style={{ color: '#D4AF37' }}>
                        {formatPrice(localValue[1])}
                    </span>
                </div>
            </div>

            {/* Slider - Myntra Style (Simple) */}
            <div className="relative pt-1 pb-1">
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={localValue[0]}
                    onChange={handleMinChange}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onTouchStart={() => setIsDragging(true)}
                    onTouchEnd={() => setIsDragging(false)}
                    className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none z-20 slider-thumb"
                    style={{
                        WebkitAppearance: 'none',
                    }}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={localValue[1]}
                    onChange={handleMaxChange}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onTouchStart={() => setIsDragging(true)}
                    onTouchEnd={() => setIsDragging(false)}
                    className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none z-20 slider-thumb"
                    style={{
                        WebkitAppearance: 'none',
                    }}
                />
                <div
                    className="relative h-1 rounded-full"
                    style={{
                        background: 'rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <div
                        className="absolute h-1 rounded-full transition-all duration-200"
                        style={{
                            background: '#D4AF37',
                            left: `${((localValue[0] - min) / (max - min)) * 100}%`,
                            right: `${100 - ((localValue[1] - min) / (max - min)) * 100}%`,
                        }}
                    />
                </div>
            </div>

            <style>{`
                .slider-thumb::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #D4AF37;
                    cursor: pointer;
                    pointer-events: auto;
                    border: 2px solid #FFFFFF;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                    transition: all 0.2s ease;
                }

                .slider-thumb::-webkit-slider-thumb:hover {
                    transform: scale(1.15);
                    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
                }

                .slider-thumb::-webkit-slider-thumb:active {
                    transform: scale(1.1);
                }

                .slider-thumb::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #D4AF37;
                    cursor: pointer;
                    pointer-events: auto;
                    border: 2px solid #FFFFFF;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                    transition: all 0.2s ease;
                }

                .slider-thumb::-moz-range-thumb:hover {
                    transform: scale(1.15);
                    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
                }

                .slider-thumb::-moz-range-thumb:active {
                    transform: scale(1.1);
                }
            `}</style>
        </div>
    );
};
