import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export const SearchBar = ({
    value,
    onChange,
    placeholder = "Search within collection",
    className = "",
}: SearchBarProps) => {
    const [localValue, setLocalValue] = useState(value);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            onChange(localValue);
        }, 300);

        return () => clearTimeout(timer);
    }, [localValue, onChange]);

    const handleClear = () => {
        setLocalValue("");
        onChange("");
    };

    return (
        <div className={`relative ${className}`}>
            <div className="relative">
                <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    aria-hidden="true"
                />
                <input
                    type="text"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                    style={{
                        borderColor: 'rgba(0, 0, 0, 0.12)',
                        background: '#FFFFFF',
                        fontFamily: 'Inter, sans-serif',
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = '#D4826F';
                        e.target.style.boxShadow = '0 0 0 3px rgba(212, 130, 111, 0.1)';
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(0, 0, 0, 0.12)';
                        e.target.style.boxShadow = 'none';
                    }}
                    aria-label="Search products"
                />
                {localValue && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-150"
                        aria-label="Clear search"
                        type="button"
                    >
                        <X className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                )}
            </div>
        </div>
    );
};
