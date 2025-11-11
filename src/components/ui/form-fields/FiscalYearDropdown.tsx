/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FiscalYearDropdownProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

const FiscalYearDropdown = ({
  value,
  onChange,
  error,
  placeholder = "Select fiscal year"
}: FiscalYearDropdownProps) => {
  const [fiscalYears, setFiscalYears] = useState<string[]>([]);
  
  useEffect(() => {
    // Generate fiscal years: previous, current, and next
    const currentYear = new Date().getFullYear();
    const years = [
      `${currentYear - 1}-${currentYear}`,
      `${currentYear}-${currentYear + 1}`,
      `${currentYear + 1}-${currentYear + 2}`
    ];
    setFiscalYears(years);
  }, []);

  return (
    <div className="space-y-2">
      <Select
        value={value}
        onValueChange={onChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {fiscalYears.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default FiscalYearDropdown;