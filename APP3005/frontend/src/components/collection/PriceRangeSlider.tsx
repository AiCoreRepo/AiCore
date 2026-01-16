import { useState, useRef, useEffect } from "react";

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
    const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
    const sliderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!sliderRef.current) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const clickPosition = (e.clientX - rect.left) / rect.width;
        const clickValue = min + clickPosition * (max - min);

        const distToMin = Math.abs(clickValue - localValue[0]);
        const distToMax = Math.abs(clickValue - localValue[1]);

        if (distToMin < distToMax) {
            const newValue: [number, number] = [Math.round(clickValue / 100) * 100, localValue[1]];
            setLocalValue(newValue);
            onChange(newValue);
        } else {
            const newValue: [number, number] = [localValue[0], Math.round(clickValue / 100) * 100];
            setLocalValue(newValue);
            onChange(newValue);
        }
    };

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMin = Number(e.target.value);
        const newValue: [number, number] = [Math.min(newMin, localValue[1] - 100), localValue[1]];
        setLocalValue(newValue);
        onChange(newValue);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMax = Number(e.target.value);
        const newValue: [number, number] = [localValue[0], Math.max(newMax, localValue[0] + 100)];
        setLocalValue(newValue);
        onChange(newValue);
    };

    const formatPrice = (price: number) => {
        return `${currency}${price.toLocaleString('en-IN')}`;
    };

    const getPercentage = (val: number) => {
        return ((val - min) / (max - min)) * 100;
    };

    return (
        <div
            className="px-4 py-3 rounded-lg border transition-all duration-200"
            style={{
                background: '#FFFFFF',
                borderColor: 'rgba(0, 0, 0, 0.12)',
                minWidth: '240px',
            }}
        >
            {/* Header */}
            <div className="mb-3">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">PRICE RANGE</div>

                {/* Inline Min/Max Display */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 text-center py-1.5 px-2 rounded" style={{ background: 'rgba(212, 175, 55, 0.06)' }}>
                        <div className="text-xs text-gray-500 mb-0.5">Min</div>
                        <div className="text-sm font-semibold" style={{ color: '#D4AF37' }}>
                            {formatPrice(localValue[0])}
                        </div>
                    </div>
                    <div className="text-gray-300">—</div>
                    <div className="flex-1 text-center py-1.5 px-2 rounded" style={{ background: 'rgba(212, 175, 55, 0.06)' }}>
                        <div className="text-xs text-gray-500 mb-0.5">Max</div>
                        <div className="text-sm font-semibold" style={{ color: '#D4AF37' }}>
                            {formatPrice(localValue[1])}
                        </div>
                    </div>
                </div>
            </div>

            {/* Slider Track */}
            <div className="relative pt-1 pb-4" ref={sliderRef} onClick={handleSliderClick}>
                {/* Background Track */}
                <div
                    className="relative h-1.5 rounded-full cursor-pointer"
                    style={{
                        background: 'rgba(0, 0, 0, 0.08)',
                    }}
                >
                    {/* Active Track */}
                    <div
                        className="absolute h-1.5 rounded-full transition-all duration-200"
                        style={{
                            background: '#D4AF37',
                            left: `${getPercentage(localValue[0])}%`,
                            right: `${100 - getPercentage(localValue[1])}%`,
                        }}
                    />
                </div>

                {/* Min Handle */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={100}
                    value={localValue[0]}
                    onChange={handleMinChange}
                    onMouseDown={() => setIsDragging('min')}
                    onMouseUp={() => setIsDragging(null)}
                    onTouchStart={() => setIsDragging('min')}
                    onTouchEnd={() => setIsDragging(null)}
                    className="absolute w-full top-0 appearance-none bg-transparent pointer-events-none z-30 range-input"
                    style={{
                        height: '1.5rem',
                    }}
                />

                {/* Max Handle */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={100}
                    value={localValue[1]}
                    onChange={handleMaxChange}
                    onMouseDown={() => setIsDragging('max')}
                    onMouseUp={() => setIsDragging(null)}
                    onTouchStart={() => setIsDragging('max')}
                    onTouchEnd={() => setIsDragging(null)}
                    className="absolute w-full top-0 appearance-none bg-transparent pointer-events-none z-30 range-input"
                    style={{
                        height: '1.5rem',
                    }}
                />
            </div>

            <style>{`
                .range-input::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #D4AF37;
                    cursor: grab;
                    pointer-events: auto;
                    border: 3px solid #FFFFFF;
                    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
                    transition: all 0.15s ease;
                }

                .range-input::-webkit-slider-thumb:hover {
                    transform: scale(1.15);
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
                }

                .range-input::-webkit-slider-thumb:active {
                    cursor: grabbing;
                    transform: scale(1.1);
                }

                .range-input::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #D4AF37;
                    cursor: grab;
                    pointer-events: auto;
                    border: 3px solid #FFFFFF;
                    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
                    transition: all 0.15s ease;
                }

                .range-input::-moz-range-thumb:hover {
                    transform: scale(1.15);
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
                }

                .range-input::-moz-range-thumb:active {
                    cursor: grabbing;
                    transform: scale(1.1);
                }

                .range-input::-webkit-slider-runnable-track {
                    background: transparent;
                }

                .range-input::-moz-range-track {
                    background: transparent;
                }
            `}</style>
        </div>
    );
};
