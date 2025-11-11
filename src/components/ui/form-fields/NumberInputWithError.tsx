import React, { useState, useEffect } from "react";
import { InputWithError } from "./InputWithError";

interface NumberInputWithErrorProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  error?: string;
  value?: number | string;
  onChange?: (value: number | string) => void;
  onValueChange?: (value: number | string) => void;
  min?: number;
  max?: number;
}

export const NumberInputWithError = React.forwardRef<
  HTMLInputElement,
  NumberInputWithErrorProps
>(({ error, value = '', onChange, onValueChange, min, max, ...props }, ref) => {
  const [inputValue, setInputValue] = useState<string>(
    value !== null && value !== undefined ? value.toString() : ''
  );
  const [validationError, setValidationError] = useState<string>('');

  // Sync inputValue with value prop from parent (for edit modal)
  useEffect(() => {
    setInputValue(value !== null && value !== undefined ? value.toString() : '');
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // eslint-disable-next-line prefer-const
    let cleaned = e.target.value.replace(/\D/g, '');

    // Optionally enforce min/max
    let numericValue: number | undefined = undefined;
    if (cleaned !== '') {
      numericValue = parseInt(cleaned, 10);
      if (!isNaN(numericValue)) {
        if (min !== undefined && numericValue < min) {
          setValidationError(`Value must be at least ${min}`);
        } else if (max !== undefined && numericValue > max) {
          setValidationError(`Value must be at most ${max}`);
        } else {
          setValidationError('');
        }
      }
    } else {
      setValidationError('');
    }

    setInputValue(cleaned);

    const handleValueChange = onValueChange || onChange;
    if (handleValueChange) {
      // Always send either a number or an empty string (never null)
      handleValueChange(cleaned !== '' ? numericValue : '');
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

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
      inputMode="numeric"
      autoComplete="off"
    />
  );
});

NumberInputWithError.displayName = "NumberInputWithError";