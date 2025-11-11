import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Generate time options (24-hour format)
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const time12 = `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
      options.push({ value: time24, label: time12 });
    }
  }
  return options;
};

export const TimePickerWithError = React.forwardRef<
  HTMLButtonElement,
  {
    id?: string;
    value: string;
    onValueChange?: (value: string) => void;
    onChange?: (value: string) => void;
    error?: string;
    placeholder?: string;
    children?: React.ReactNode;
    disabled?: boolean;
    useBuiltInOptions?: boolean;
  }
>(({ id, value, onValueChange, onChange, error, placeholder, children, disabled, useBuiltInOptions = false }, ref) => {
  
  // Use whichever callback is provided
  const handleValueChange = onValueChange || onChange;
  const timeOptions = generateTimeOptions();

  return (
    <div className="space-y-1">
      <Select value={value || undefined} onValueChange={handleValueChange}>
        <SelectTrigger ref={ref} disabled={disabled} id={id}>
          <SelectValue placeholder={placeholder || "Select time"} />
        </SelectTrigger>
        <SelectContent>
          {useBuiltInOptions 
            ? timeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))
            : children
          }
        </SelectContent>
      </Select>
      
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
});

TimePickerWithError.displayName = "TimePickerWithError";