/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getColorInfo } from "@/utils/colorUtils";

interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  onColorInfoChange?: (colorInfo: {
    colorKey(arg0: string, colorKey: any): unknown;
    colorName: string;
    rgbValue: string;
    pantoneCode: string;
    baseColorKey: string;
    subColorKey: string;
    colorVariant: string;
    colorFamily: string;
  }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  baseColorKey?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value = "#000000",
  onChange,
  onColorInfoChange,
  placeholder = "#000000",
  className,
  disabled = false,
  error,
  baseColorKey
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isValidHex, setIsValidHex] = useState(true);

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Validate hex color format
  const validateHex = (hex: string): boolean => {
    const hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(hex);
  };

  // Convert hex to proper format (#RRGGBB)
  const normalizeHex = (hex: string): string => {
    if (!hex.startsWith('#')) {
      hex = '#' + hex;
    }
    
    // Handle 3-character hex codes
    if (hex.length === 4) {
      hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    
    return hex.toUpperCase();
  };

  // Update color info when hex value changes
  const updateColorInfo = (hex: string) => {
    if (hex && validateHex(hex)) {
      const normalizedHex = normalizeHex(hex);
      const colorInfo = getColorInfo(normalizedHex, baseColorKey);
      onColorInfoChange?.(colorInfo);
    }
  };

  // Handle color picker input change
  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setInputValue(color);
    setIsValidHex(true);
    onChange?.(color);
    updateColorInfo(color);
  };

  // Handle manual hex input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (newValue === '' || validateHex(newValue)) {
      setIsValidHex(true);
      if (newValue !== '') {
        const normalizedColor = normalizeHex(newValue);
        onChange?.(normalizedColor);
        updateColorInfo(normalizedColor);
      }
    } else {
      setIsValidHex(false);
    }
  };

  // Handle input blur - validate and normalize
  const handleInputBlur = () => {
    if (inputValue && validateHex(inputValue)) {
      const normalizedColor = normalizeHex(inputValue);
      setInputValue(normalizedColor);
      onChange?.(normalizedColor);
      updateColorInfo(normalizedColor);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Color Code</Label>
      <div className="flex gap-2">
        <Input
          type="color"
          value={inputValue}
          onChange={handleColorPickerChange}
          className="w-16 h-10 cursor-pointer"
          disabled={disabled}
        />
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={cn(
            "flex-1",
            !isValidHex && "border-red-500 focus:border-red-500"
          )}
          disabled={disabled}
        />
      </div>
      {!isValidHex && (
        <p className="text-sm text-red-500">Invalid hex color format</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};
