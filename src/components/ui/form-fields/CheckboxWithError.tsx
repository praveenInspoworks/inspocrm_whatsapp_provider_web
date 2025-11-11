import React from "react";
import { Checkbox, CheckboxProps } from "@/components/ui/checkbox";
import { FormFieldWrapper } from "./FormFieldWrapper";
import { cn } from "@/lib/utils";

interface CheckboxWithErrorProps extends CheckboxProps {
  error?: string;
  label?: string;
}

export const CheckboxWithError = React.forwardRef<
  React.ElementRef<typeof Checkbox>,
  CheckboxWithErrorProps
>(({ error, className, label, ...props }, ref) => (
  <FormFieldWrapper error={error}>
    <div className="flex items-center space-x-2">
      <Checkbox
        ref={ref}
        className={cn(error && "border-red-500", className)}
        {...props}
      />
      {label && <label htmlFor={props.id}>{label}</label>}
    </div>
  </FormFieldWrapper>
));

CheckboxWithError.displayName = "CheckboxWithError";
