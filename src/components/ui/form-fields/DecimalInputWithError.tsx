
import React, { useState, useCallback } from "react";
import { InputWithError } from "./InputWithError"; // Assuming this is your existing component

interface DecimalInputWithErrorProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  error?: string;
  value?: number | string;
  onChange?: (value: number | null) => void;
  onValueChange?: (value: number | null) => void; // Support for onValueChange pattern
  decimalPlaces?: number;
  decimalScale?: number; // Alternative name for decimalPlaces
  min?: number;
  max?: number;
  allowNegative?: boolean;
}

export const DecimalInputWithError = React.forwardRef<
  HTMLInputElement,
  DecimalInputWithErrorProps
>(({ 
  error, 
  value = '', 
  onChange, 
  onValueChange, 
  decimalPlaces = 2, 
  decimalScale, 
  min, 
  max, 
  allowNegative = true,
  ...props 
}, ref) => {
  const [inputValue, setInputValue] = useState<string>(
    value !== null && value !== undefined ? value.toString() : ''
  );
  const [validationError, setValidationError] = useState<string>('');

  // Use decimalScale if provided, otherwise use decimalPlaces
  const actualDecimalPlaces = decimalScale ?? decimalPlaces;

  const validateAndFormatInput = useCallback((inputStr: string) => {
    // Remove any non-numeric characters except decimal point and minus sign
    let cleaned = inputStr.replace(/[^\d.-]/g, '');
    
    // Handle negative sign
    if (!allowNegative) {
      cleaned = cleaned.replace(/-/g, '');
    } else {
      // Only allow minus at the beginning
      const minusCount = (cleaned.match(/-/g) || []).length;
      if (minusCount > 1) {
        cleaned = cleaned.charAt(0) === '-' ? '-' + cleaned.replace(/-/g, '') : cleaned.replace(/-/g, '');
      }
      if (cleaned.indexOf('-') > 0) {
        cleaned = cleaned.replace(/-/g, '');
      }
    }
    
    // Handle decimal points - only allow one
    const decimalCount = (cleaned.match(/\./g) || []).length;
    if (decimalCount > 1) {
      const firstDotIndex = cleaned.indexOf('.');
      cleaned = cleaned.substring(0, firstDotIndex + 1) + cleaned.substring(firstDotIndex + 1).replace(/\./g, '');
    }
    
    // Limit decimal places
    if (cleaned.includes('.')) {
      const parts = cleaned.split('.');
      if (parts[1] && parts[1].length > actualDecimalPlaces) {
        cleaned = parts[0] + '.' + parts[1].substring(0, actualDecimalPlaces);
      }
    }
    
    return cleaned;
  }, [allowNegative, actualDecimalPlaces]);

  const validateValue = useCallback((numValue: number | null) => {
    if (numValue === null) return '';
    
    if (min !== undefined && numValue < min) {
      return `Value must be at least ${min}`;
    }
    
    if (max !== undefined && numValue > max) {
      return `Value must be at most ${max}`;
    }
    
    return '';
  }, [min, max]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = validateAndFormatInput(rawValue);
    
    setInputValue(formattedValue);
    
    // Convert to number and validate
    let numericValue: number | null = null;
    if (formattedValue !== '' && formattedValue !== '-' && formattedValue !== '.') {
      const parsed = parseFloat(formattedValue);
      if (!isNaN(parsed)) {
        numericValue = parsed;
      }
    }
    
    // Validate the numeric value
    const validationMsg = numericValue !== null ? validateValue(numericValue) : '';
    setValidationError(validationMsg);
    
    // Call onChange or onValueChange callback
    const handleValueChange = onValueChange || onChange;
    if (handleValueChange) {
      handleValueChange(numericValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Format the value on blur for better UX
    if (inputValue && inputValue !== '-' && inputValue !== '.') {
      const numValue = parseFloat(inputValue);
      if (!isNaN(numValue)) {
        const formatted = numValue.toFixed(actualDecimalPlaces);
        setInputValue(formatted);
      }
    }
    
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  // Use the custom validation error if present, otherwise use the prop error
  const displayError = validationError || error;

  return (
    <InputWithError
      ref={ref}
      {...props}
      type="text"
      value={inputValue}
      onChange={handleInputChange}
      onBlur={handleBlur}
      error={displayError}
    />
  );
});

DecimalInputWithError.displayName = "DecimalInputWithError";