import React from "react";
import { Textarea, TextareaProps } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FormFieldWrapper } from "./FormFieldWrapper";

interface TextareaWithErrorProps extends TextareaProps {
  error?: string;
}

export const TextareaWithError = React.forwardRef<HTMLTextAreaElement, TextareaWithErrorProps>(
  ({ error, className, ...props }, ref) => (
    <FormFieldWrapper error={error}>
      <Textarea
        ref={ref}
        className={cn(error && "border-red-500", className)}
        {...props}
      />
    </FormFieldWrapper>
  )
);

TextareaWithError.displayName = "TextareaWithError";