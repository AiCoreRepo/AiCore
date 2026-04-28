import React from 'react';

interface FormInputProps {
    id: string;
    label: string;
    type?: 'text' | 'number' | 'date';
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
    id,
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    error,
    disabled = false,
    required = false,
}) => (
    <div className="space-y-1.5">
        <label htmlFor={id} className="block text-sm font-medium text-neutral-300">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <input
            id={id}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            style={{ color: '#ffffff', caretColor: '#ffffff', colorScheme: 'dark' }}
            className={`
                w-full px-4 py-2.5 rounded-xl text-sm bg-neutral-800
                border transition-all duration-200 placeholder-neutral-500
                focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]/60
                disabled:opacity-50 disabled:cursor-not-allowed
                ${error
                    ? 'border-red-500/60 focus:ring-red-500/40 focus:border-red-500/60'
                    : 'border-neutral-700 hover:border-neutral-600'
                }
            `}
        />
        {error && (
            <p className="text-xs text-red-400 mt-1">{error}</p>
        )}
    </div>
);
