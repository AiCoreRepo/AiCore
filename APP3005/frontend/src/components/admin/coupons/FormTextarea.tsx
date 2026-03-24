import React from 'react';

interface FormTextareaProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    rows?: number;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
    id,
    label,
    value,
    onChange,
    placeholder,
    error,
    disabled = false,
    required = false,
    rows = 3,
}) => (
    <div className="space-y-1.5">
        <label htmlFor={id} className="block text-sm font-medium text-neutral-300">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            style={{ color: '#ffffff', caretColor: '#ffffff' }}
            className={`
                w-full px-4 py-2.5 rounded-xl text-sm bg-neutral-800
                border transition-all duration-200 placeholder-neutral-500 resize-none
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
