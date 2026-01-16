import { X } from "lucide-react";

interface FilterChip {
    id: string;
    label: string;
    value: string;
    onRemove: () => void;
}

interface ActiveFilterChipsProps {
    chips: FilterChip[];
    onClearAll: () => void;
    className?: string;
}

export const ActiveFilterChips = ({
    chips,
    onClearAll,
    className = ""
}: ActiveFilterChipsProps) => {
    if (chips.length === 0) return null;

    return (
        <div className={`flex items-center flex-wrap gap-2 ${className}`}>
            {chips.map((chip) => (
                <button
                    key={chip.id}
                    onClick={chip.onRemove}
                    className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-sm animate-in fade-in zoom-in"
                    style={{
                        background: 'rgba(212, 130, 111, 0.1)',
                        color: '#D4826F',
                        border: '1px solid rgba(212, 130, 111, 0.2)',
                        fontFamily: 'Inter, sans-serif',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(212, 130, 111, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(212, 130, 111, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(212, 130, 111, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(212, 130, 111, 0.2)';
                    }}
                    aria-label={`Remove ${chip.label} filter`}
                >
                    <span className="text-xs">{chip.label}: {chip.value}</span>
                    <X className="w-3 h-3 transition-transform duration-150 group-hover:scale-110" />
                </button>
            ))}

            {chips.length > 0 && (
                <button
                    onClick={onClearAll}
                    className="text-sm font-medium transition-colors duration-150 underline-offset-2 hover:underline"
                    style={{
                        color: '#6B7280',
                        fontFamily: 'Inter, sans-serif',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#2C2C2C';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#6B7280';
                    }}
                >
                    Clear all
                </button>
            )}
        </div>
    );
};
