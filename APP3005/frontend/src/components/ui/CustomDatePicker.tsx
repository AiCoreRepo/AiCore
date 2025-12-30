import { forwardRef, useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";
import "./CustomDatePicker.css";

interface CustomDatePickerProps {
    value?: string;
    onChange?: (value: string) => void;
    name?: string;
    onBlur?: () => void;
    maxDate?: Date;
    minDate?: Date;
    placeholder?: string;
    error?: string;
}

export const CustomDatePicker = forwardRef<HTMLInputElement, CustomDatePickerProps>(
    ({ value, onChange, name, onBlur, maxDate, minDate, placeholder, error }, ref) => {
        const [selectedDate, setSelectedDate] = useState<Date | null>(
            value ? new Date(value) : null
        );
        const [isOpen, setIsOpen] = useState(false);
        const [inputValue, setInputValue] = useState(
            value ? new Date(value).toLocaleDateString('en-GB') : ''
        );
        const wrapperRef = useRef<HTMLDivElement>(null);

        // Close calendar when clicking outside
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };

            if (isOpen) {
                document.addEventListener('mousedown', handleClickOutside);
            }

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, [isOpen]);

        const handleDatePickerChange = (date: Date | null) => {
            setSelectedDate(date);
            if (date) {
                const formatted = date.toLocaleDateString('en-GB');
                setInputValue(formatted);
                const isoDate = date.toISOString().split('T')[0];
                onChange?.(isoDate);
            } else {
                setInputValue('');
                onChange?.("");
            }
            setIsOpen(false);
        };

        const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setInputValue(value);

            // Try to parse DD/MM/YYYY format
            const parts = value.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1;
                const year = parseInt(parts[2]);

                if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                    const date = new Date(year, month, day);
                    if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
                        setSelectedDate(date);
                        const isoDate = date.toISOString().split('T')[0];
                        onChange?.(isoDate);
                    }
                }
            }
        };

        const handleIconClick = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
        };

        return (
            <div className="custom-datepicker-wrapper" ref={wrapperRef}>
                <div className="relative">
                    <div className="relative w-full">
                        <input
                            ref={ref}
                            name={name}
                            type="text"
                            value={inputValue}
                            onChange={handleManualInput}
                            onBlur={onBlur}
                            placeholder="DD/MM/YYYY"
                            className={`
                                w-full pl-11 pr-4 py-2.5 rounded-lg
                                bg-white border-2 transition-all duration-300
                                text-charcoal
                                focus:outline-none focus:ring-2 focus:ring-gold/20
                                placeholder:text-gray-400
                                ${isOpen ? 'border-gold shadow-lg shadow-gold/20' : error ? 'border-red-400' : 'border-luxury-charcoal hover:border-gold/50'}
                            `}
                            style={{ fontSize: '16px' }}
                        />
                        <button
                            type="button"
                            onClick={handleIconClick}
                            className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer z-10 p-1"
                        >
                            <Calendar className={`w-5 h-5 transition-colors ${isOpen ? 'text-gold' : 'text-gray-400 hover:text-gold'}`} />
                        </button>
                    </div>

                    {/* Calendar Popup */}
                    {isOpen && (
                        <div className="absolute z-50 mt-2">
                            <DatePicker
                                selected={selectedDate}
                                onChange={handleDatePickerChange}
                                maxDate={maxDate}
                                minDate={minDate}
                                dateFormat="dd/MM/yyyy"
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                                yearDropdownItemNumber={80}
                                scrollableYearDropdown
                                inline
                                calendarClassName="custom-calendar"
                            />
                        </div>
                    )}
                </div>
                {error && (
                    <p className="mt-2 text-sm text-red-400">{error}</p>
                )}
            </div>
        );
    }
);

CustomDatePicker.displayName = "CustomDatePicker";
