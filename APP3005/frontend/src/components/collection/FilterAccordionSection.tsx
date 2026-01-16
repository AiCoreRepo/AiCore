import { ChevronDown } from "lucide-react";
import { ReactNode } from "react";
import { colors, typography } from "@/utils/designSystem";

interface FilterAccordionSectionProps {
    title: string;
    icon?: ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    selectedCount?: number;
    children: ReactNode;
    accentColor?: string;
    className?: string;
}

export const FilterAccordionSection = ({
    title,
    icon,
    isExpanded,
    onToggle,
    selectedCount = 0,
    children,
    accentColor = colors.accent,
    className = "",
}: FilterAccordionSectionProps) => {
    return (
        <div className={`border-b ${className}`} style={{ borderColor: colors.border }}>
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between py-4 group"
                aria-expanded={isExpanded}
                aria-controls={`filter-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
                <div className="flex items-center gap-2.5">
                    {icon && (
                        <div
                            className="w-5 h-5 flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                            style={{ color: accentColor }}
                        >
                            {icon}
                        </div>
                    )}
                    <span
                        className="text-sm font-semibold uppercase tracking-wide"
                        style={{
                            color: colors.textPrimary,
                            fontFamily: typography.fontSans,
                        }}
                    >
                        {title}
                    </span>
                    {selectedCount > 0 && (
                        <span
                            className="px-1.5 py-0.5 rounded text-xs font-bold"
                            style={{
                                background: accentColor,
                                color: '#FFFFFF',
                            }}
                        >
                            {selectedCount}
                        </span>
                    )}
                </div>
                <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''
                        }`}
                    style={{ color: colors.textTertiary }}
                />
            </button>

            <div
                id={`filter-${title.toLowerCase().replace(/\s+/g, '-')}`}
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                    maxHeight: isExpanded ? '1000px' : '0',
                    opacity: isExpanded ? 1 : 0,
                }}
            >
                <div className="pb-4">
                    {children}
                </div>
            </div>
        </div>
    );
};
