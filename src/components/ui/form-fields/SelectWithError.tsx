import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectWithErrorProps {
  label?: string;
  value: string;
  onValueChange?: (value: string) => void;
  onChange?: (value: string) => void;
  error?: string;
  placeholder?: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export const SelectWithError = React.forwardRef<
  HTMLButtonElement,
  SelectWithErrorProps
>(({ label, value, onValueChange, onChange, error, placeholder, children, disabled, className, required }, ref) => {
  const handleValueChange = (newValue: string) => {
    // Call both onValueChange and onChange for compatibility
    if (onValueChange) {
      onValueChange(newValue);
    }
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Select
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger ref={ref} className={`w-full ${error ? 'border-red-500' : ''}`}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-60 overflow-y-auto">
          {children}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
});

SelectWithError.displayName = "SelectWithError";
