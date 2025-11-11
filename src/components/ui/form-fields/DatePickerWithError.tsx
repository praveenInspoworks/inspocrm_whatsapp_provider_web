import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const DatePickerWithError = React.forwardRef<
  HTMLDivElement,
  {
    selected?: Date;
    onSelect?: (date?: Date) => void;
    error?: string;
    className?: string;
    minDate?: Date;
    isClearable?: boolean;
  }
>(
  (
    { selected, onSelect, error, className, minDate, isClearable = false },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);

    const handleSelect = (date?: Date) => {
      if (onSelect) {
        onSelect(date);
      }
      setOpen(false); // Close the popover after selection
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onSelect) {
        onSelect(undefined);
      }
    };

    return (
      <div className="space-y-1" ref={ref}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !selected && "text-muted-foreground",
                className
              )}
            >
              <div className="flex items-center w-full">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selected ? format(selected, "PPP") : <span>Pick a date</span>}
                {isClearable && selected && (
                  <button
                    onClick={handleClear}
                    className="ml-auto p-1 rounded-full hover:bg-gray-100"
                    aria-label="Clear date"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              initialFocus
              fromDate={minDate}
            />
          </PopoverContent>
        </Popover>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

DatePickerWithError.displayName = "DatePickerWithError";
