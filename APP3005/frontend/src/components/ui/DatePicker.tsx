import { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
    value?: string;
    onChange?: (value: string) => void;
    onClear?: () => void;
    placeholder?: string;
    label?: string;
    error?: string;
    maxDate?: string;
    minDate?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
    (
        {
            value,
            onChange,
            onClear,
            placeholder = "Select date",
            label,
            error,
            maxDate,
            minDate,
            required = false,
            disabled = false,
            className,
        },
        ref
    ) => {
        const [isFocused, setIsFocused] = useState(false);
        const [showClear, setShowClear] = useState(false);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange?.(e.target.value);
        };

        const handleClear = () => {
            onChange?.("");
            onClear?.();
        };

        const hasValue = value && value.length > 0;

        return (
            <div className={cn("relative w-full", className)}>
                {/* Label */}
                {label && (
                    <motion.label
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="block text-sm font-medium text-luxury-cream mb-2"
                    >
                        {label}
                        {required && <span className="text-red-400 ml-1">*</span>}
                    </motion.label>
                )}

                {/* Input Container */}
                <motion.div
                    className="relative"
                    onHoverStart={() => setShowClear(true)}
                    onHoverEnd={() => setShowClear(false)}
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Calendar Icon */}
                    <motion.div
                        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                        animate={{
                            color: isFocused ? "#C9A75F" : "#9CA3AF",
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        <Calendar className="w-5 h-5" />
                    </motion.div>

                    {/* Date Input */}
                    <motion.input
                        ref={ref}
                        type="date"
                        value={value || ""}
                        onChange={handleChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        max={maxDate}
                        min={minDate}
                        disabled={disabled}
                        required={required}
                        className={cn(
                            "w-full pl-11 pr-12 py-3 rounded-xl",
                            "bg-white/90 backdrop-blur-sm",
                            "border-2 transition-all duration-300",
                            "text-charcoal font-medium",
                            "focus:outline-none focus:ring-2 focus:ring-gold/20",
                            isFocused
                                ? "border-gold shadow-lg shadow-gold/20"
                                : error
                                    ? "border-red-400"
                                    : "border-gray-300 hover:border-gold/50",
                            disabled && "opacity-50 cursor-not-allowed",
                            // Custom date input styling
                            "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
                            "[&::-webkit-calendar-picker-indicator]:opacity-70",
                            "[&::-webkit-calendar-picker-indicator]:hover:opacity-100",
                            "[&::-webkit-calendar-picker-indicator]:transition-opacity"
                        )}
                        style={{
                            colorScheme: "light",
                        }}
                    />

                    {/* Clear Button */}
                    <AnimatePresence>
                        {hasValue && showClear && !disabled && (
                            <motion.button
                                type="button"
                                onClick={handleClear}
                                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8, x: 10 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 z-10
                                         w-7 h-7 rounded-full
                                         bg-gradient-to-br from-red-400 to-red-500
                                         flex items-center justify-center
                                         shadow-lg hover:shadow-xl
                                         transition-shadow duration-200"
                            >
                                <X className="w-4 h-4 text-white" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Focus Ring Animation */}
                    <AnimatePresence>
                        {isFocused && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 rounded-xl pointer-events-none"
                                style={{
                                    boxShadow: "0 0 0 4px rgba(201, 165, 95, 0.1)",
                                }}
                            />
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="mt-2 text-sm text-red-400 flex items-center gap-1"
                        >
                            <span className="w-1 h-1 rounded-full bg-red-400" />
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>

                {/* Helper Text */}
                {!error && !required && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        className="mt-2 text-xs text-gray-400"
                    >
                        Optional field
                    </motion.p>
                )}
            </div>
        );
    }
);

DatePicker.displayName = "DatePicker";
