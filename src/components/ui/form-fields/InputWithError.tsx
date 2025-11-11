import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils"; 

export const InputWithError = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { error?: string }
>(({ error, className, readOnly, ...props }, ref) => {
  return (
    <div className="space-y-1">
      <Input 
        ref={ref} 
        className={cn(
          className,
          readOnly && "shadow" 
        )}
        readOnly={readOnly}
        {...props} 
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
});

InputWithError.displayName = "InputWithError";