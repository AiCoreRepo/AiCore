import React from 'react';
import { Loader2 } from 'lucide-react';

interface SubmitButtonProps {
    label: string;
    isSubmitting: boolean;
    loadingLabel?: string;
    disabled?: boolean;
    onClick?: () => void;
    type?: 'submit' | 'button';
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
    label,
    isSubmitting,
    loadingLabel = 'Submitting...',
    disabled = false,
    onClick,
    type = 'submit',
}) => (
    <button
        type={type}
        onClick={onClick}
        disabled={isSubmitting || disabled}
        className={`
            inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl
            text-sm font-semibold transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:ring-offset-2 focus:ring-offset-neutral-900
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isSubmitting
                ? 'bg-[#D4AF37]/60 text-neutral-900 cursor-wait'
                : 'bg-[#D4AF37] text-neutral-900 hover:bg-[#D4AF37]/90 active:scale-[0.98]'
            }
        `}
    >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {isSubmitting ? loadingLabel : label}
    </button>
);
