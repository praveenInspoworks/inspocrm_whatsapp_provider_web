// CurrencyInputWithError.tsx
import React from "react";
import { Input } from "@/components/ui/input";

export const CurrencyInputWithError = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { 
    error?: string;
    onValueChange?: (value: number) => void;
    value?: number;
  }
>(({ error, onValueChange, value, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-numeric characters except decimal point
    const rawValue = e.target.value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const sanitizedValue = rawValue.replace(/(\..*)\./g, '$1');
    
    // Convert to number
    const numValue = parseFloat(sanitizedValue);
    
    onValueChange?.(isNaN(numValue) ? 0 : numValue);
  };

  const displayValue = value !== undefined ? value.toString() : '';

  return (
    <div className="space-y-1">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          className="pl-8"
          {...props}
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
});

CurrencyInputWithError.displayName = "CurrencyInputWithError";