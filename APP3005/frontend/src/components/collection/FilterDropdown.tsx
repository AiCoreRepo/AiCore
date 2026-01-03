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
                className="group px-5 py-3 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-3 min-w-[160px] border"
                style={{
                    background: isOpen
                        ? '#FFFFFF'
                        : 'linear-gradient(135deg, #FFFFFF 0%, #FAFAF8 100%)',
                    borderColor: isOpen ? '#D4AF37' : 'rgba(0, 0, 0, 0.1)',
                    color: '#2C2C2C',
                    boxShadow: isOpen
                        ? '0 8px 24px rgba(212, 175, 55, 0.2)'
                        : '0 2px 8px rgba(0, 0, 0, 0.08)',
                }}
            >
                {icon && <span style={{ color: '#D4AF37' }}>{icon}</span>}
                <div className="flex-1 text-left">
                    <div className="text-xs text-gray-500 mb-0.5">{label}</div>
                    <div className="text-sm font-semibold truncate" style={{ color: '#2C2C2C' }}>
                        {value}
                    </div>
                </div>
                <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    style={{ color: '#D4AF37' }}
                />
            </button>

            {isOpen && (
                <div
                    className="absolute top-full mt-2 w-full md:min-w-[220px] rounded-xl shadow-2xl z-50 overflow-hidden"
                    style={{
                        background: '#FFFFFF',
                        border: '2px solid #D4AF37',
                        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
                    }}
                >
                    <div className="py-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {options.map((option) => (
                            <button
                                key={option}
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-3 text-left text-sm transition-all duration-200 flex items-center justify-between group"
                                style={{
                                    background: value === option
                                        ? 'rgba(212, 175, 55, 0.1)'
                                        : 'transparent',
                                    color: value === option ? '#D4AF37' : '#2C2C2C',
                                }}
                                onMouseEnter={(e) => {
                                    if (value !== option) {
                                        e.currentTarget.style.background = 'rgba(212, 175, 55, 0.05)';
                                        e.currentTarget.style.color = '#D4AF37';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (value !== option) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = '#2C2C2C';
                                    }
                                }}
                            >
                                <span className="font-medium">{option}</span>
                                {value === option && (
                                    <Check className="w-4 h-4" style={{ color: '#D4AF37' }} />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, #D4AF37 0%, #C9A55C 100%);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(180deg, #E5C158 0%, #D4AF37 100%);
                }
            `}</style>
        </div>
    );
};
