// components/ui/FormFieldWrapper.tsx
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface FormFieldWrapperProps {
  children: ReactNode;
  error?: string;
  className?: string;
}

export const FormFieldWrapper = ({ 
  children, 
  error, 
  className 
}: FormFieldWrapperProps) => (
  <div className={cn("space-y-1", className)}>
    {children}
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);