import React, { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

interface OTPInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    onComplete?: (value: string) => void;
    error?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
    length = 4,
    value,
    onChange,
    onComplete,
    error = false,
}) => {
    const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Initialize refs array
        inputRefs.current = inputRefs.current.slice(0, length);
    }, [length]);

    useEffect(() => {
        // Update internal state when value prop changes
        const otpArray = value.split('').slice(0, length);
        while (otpArray.length < length) {
            otpArray.push('');
        }
        setOtp(otpArray);
    }, [value, length]);

    const handleChange = (index: number, digit: string) => {
        // Only allow digits
        if (digit && !/^\d$/.test(digit)) return;

        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);

        const otpString = newOtp.join('');
        onChange(otpString);

        // Auto-focus next input
        if (digit && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Call onComplete if all digits are filled
        if (otpString.length === length && onComplete) {
            onComplete(otpString);
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        // Handle backspace
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                // If current input is empty, focus previous and clear it
                inputRefs.current[index - 1]?.focus();
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
                onChange(newOtp.join(''));
            } else {
                // Clear current input
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
                onChange(newOtp.join(''));
            }
        }
        // Handle arrow keys
        else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length);

        if (pastedData) {
            const newOtp = pastedData.split('');
            while (newOtp.length < length) {
                newOtp.push('');
            }
            setOtp(newOtp);
            onChange(pastedData);

            // Focus the last filled input or the next empty one
            const nextIndex = Math.min(pastedData.length, length - 1);
            inputRefs.current[nextIndex]?.focus();

            // Call onComplete if all digits are filled
            if (pastedData.length === length && onComplete) {
                onComplete(pastedData);
            }
        }
    };

    return (
        <div className="flex gap-3 justify-center">
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'} // SMS autofill support
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    style={{ color: '#1a1a1a', backgroundColor: '#f5f5dc' }}
                    className={`
            w-14 h-14 text-center text-2xl font-semibold
            border-2 rounded-xl
            transition-all duration-300
            focus:outline-none focus:ring-4 focus:ring-luxury-gold/20
            ${error
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-luxury-gold focus:border-luxury-gold'
                        }
            ${digit ? 'border-luxury-gold bg-luxury-gold/20' : 'border-luxury-gold/50'}
            hover:border-luxury-gold
            shadow-sm hover:shadow-md
          `}
                    aria-label={`Digit ${index + 1}`}
                />
            ))}
        </div>
    );
};
