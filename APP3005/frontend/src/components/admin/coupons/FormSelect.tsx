import React from 'react';

interface SelectOption {
    value: string;
    label: string;
}

interface FormSelectProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    error?: string;
    disabled?: boolean;
    required?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({
    id,
    label,
    value,
    onChange,
    options,
    error,
    disabled = false,
    required = false,
}) => (
    <div className="space-y-1.5">
        <label htmlFor={id} className="block text-sm font-medium text-neutral-300">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <select
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            style={{ color: '#ffffff', colorScheme: 'dark' }}
            className={`
                w-full px-4 py-2.5 rounded-xl text-sm bg-neutral-800
                border transition-all duration-200 appearance-none cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]/60
                disabled:opacity-50 disabled:cursor-not-allowed
                ${error
                    ? 'border-red-500/60 focus:ring-red-500/40 focus:border-red-500/60'
                    : 'border-neutral-700 hover:border-neutral-600'
                }
            `}
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-neutral-800 text-white">
                    {opt.label}
                </option>
            ))}
        </select>
        {error && (
            <p className="text-xs text-red-400 mt-1">{error}</p>
        )}
    </div>
);
