import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface FilterDropdownProps {
    label: string;
    options: string[];
    value: string;
    onChange: (value: string) => void;
    icon?: React.ReactNode;
}

export const FilterDropdown = ({ label, options, value, onChange, icon }: FilterDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group px-4 py-2.5 rounded-lg font-normal text-sm transition-all duration-200 flex items-center gap-2.5 min-w-[140px] border"
                style={{
                    background: '#FFFFFF',
                    borderColor: 'rgba(0, 0, 0, 0.12)',
                    color: '#2C2C2C',
                }}
            >
                {icon && <span style={{ color: '#D4AF37', opacity: 0.8 }}>{icon}</span>}
                <div className="flex-1 text-left">
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
                    <div className="text-sm font-medium" style={{ color: '#2C2C2C' }}>
                        {value}
                    </div>
                </div>
                <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    style={{ color: '#999' }}
                />
            </button>

            {isOpen && (
                <div
                    className="absolute top-full mt-1 w-full min-w-[200px] rounded-lg shadow-lg z-50 overflow-hidden"
                    style={{
                        background: '#FFFFFF',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <div className="py-1 max-h-[280px] overflow-y-auto custom-scrollbar">
                        {options.map((option) => (
                            <button
                                key={option}
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm transition-colors duration-150 flex items-center justify-between"
                                style={{
                                    background: value === option ? 'rgba(212, 175, 55, 0.08)' : 'transparent',
                                    color: value === option ? '#D4AF37' : '#2C2C2C',
                                }}
                                onMouseEnter={(e) => {
                                    if (value !== option) {
                                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (value !== option) {
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                <span className="font-normal">{option}</span>
                                {value === option && (
                                    <Check className="w-3.5 h-3.5" style={{ color: '#D4AF37' }} />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.03);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.15);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 0, 0, 0.25);
                }
            `}</style>
        </div>
    );
};
