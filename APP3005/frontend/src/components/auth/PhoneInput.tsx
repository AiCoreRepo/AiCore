import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
    label?: string;
    placeholder?: string;
}

const countryCodes = [
    { code: '+1', country: 'US', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+91', country: 'IN', flag: '🇮🇳' },
    { code: '+86', country: 'CN', flag: '🇨🇳' },
    { code: '+81', country: 'JP', flag: '🇯🇵' },
    { code: '+49', country: 'DE', flag: '🇩🇪' },
    { code: '+33', country: 'FR', flag: '🇫🇷' },
    { code: '+61', country: 'AU', flag: '🇦🇺' },
    { code: '+7', country: 'RU', flag: '🇷🇺' },
    { code: '+55', country: 'BR', flag: '🇧🇷' },
];

export const PhoneInput: React.FC<PhoneInputProps> = ({
    value,
    onChange,
    error,
    label = 'Phone Number',
    placeholder = '1234567890',
}) => {
    const [countryCode, setCountryCode] = useState('+91');
    const [phoneNumber, setPhoneNumber] = useState('');

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value.replace(/\D/g, ''); // Only digits
        setPhoneNumber(input);
        // Pass full international format with country code
        onChange(input ? `${countryCode}${input}` : '');
    };

    const handleCountryCodeChange = (code: string) => {
        setCountryCode(code);
        // Update with new country code
        onChange(phoneNumber ? `${code}${phoneNumber}` : '');
    };

    return (
        <div className="space-y-2">
            <Label htmlFor="phone" className="text-luxury-cream">
                {label}
            </Label>
            <div className="flex gap-2">
                <Select value={countryCode} onValueChange={handleCountryCodeChange}>
                    <SelectTrigger className="w-[100px] bg-luxury-cream border-neutral-200 text-luxury-black h-9 text-sm rounded-xl shadow-sm focus:border-luxury-gold/50 focus:ring-2 focus:ring-luxury-gold/5 transition-all duration-300">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-luxury-cream border-neutral-200">
                        {countryCodes.map((item) => (
                            <SelectItem
                                key={item.code}
                                value={item.code}
                                className="cursor-pointer hover:bg-luxury-gold/10 focus:bg-luxury-gold/20"
                            >
                                <span className="flex items-center gap-2">
                                    <span>{item.flag}</span>
                                    <span>{item.code}</span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder={placeholder}
                    maxLength={15}
                    className="flex-1 bg-luxury-cream border-neutral-200 text-luxury-black placeholder:text-neutral-500 h-9 text-sm rounded-xl shadow-sm focus:border-luxury-gold/50 focus:ring-2 focus:ring-luxury-gold/5 transition-all duration-300"
                />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
};
