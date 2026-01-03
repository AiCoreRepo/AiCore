import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface CurrencySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  className?: string;
}

const currencies = [
  { code: "INR", name: "Indian Rupee" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "AED", name: "UAE Dirham" },
  { code: "SAR", name: "Saudi Riyal" },
];

const CurrencySelect: React.FC<CurrencySelectProps> = ({
  value,
  onValueChange,
  label,
  className,
}) => {
  return (
    <div className={className}>
      {label && (
        <Label className="text-luxury-cream mb-2 block">{label}</Label>
      )}
      <Select onValueChange={onValueChange} value={value}>
        <SelectTrigger
          className="bg-luxury-charcoal border-luxury-charcoal text-luxury-cream focus:border-luxury-gold focus:ring-luxury-gold hover:border-luxury-gold/50"
          style={{
            backgroundColor: "hsl(var(--luxury-charcoal))",
            borderColor: "hsl(var(--luxury-charcoal))",
            color: "hsl(var(--luxury-cream))",
          }}
        >
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent
          className="bg-luxury-charcoal border-luxury-charcoal text-luxury-cream"
          style={{
            backgroundColor: "hsl(var(--luxury-charcoal))",
            borderColor: "hsl(var(--luxury-charcoal))",
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {currencies.map((currency) => (
            <SelectItem
              key={currency.code}
              value={currency.code}
              className="text-luxury-cream focus:bg-luxury-gold/20 focus:text-luxury-gold hover:bg-luxury-gold/10"
              style={{
                color: "hsl(var(--luxury-cream))",
              }}
            >
              {currency.code} - {currency.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CurrencySelect;

