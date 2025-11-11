import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "./LoadingButton";
import { ReactNode } from "react";

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  onSave?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  submitText?: string;
}

export const AddModal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  onSave,
  onSubmit,
  isSubmitting = false,
  submitText = "Save",
}: AddModalProps) => {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  // Determine which function to call
  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit();
    } else if (onSave) {
      onSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`${sizeClasses[size]} h-auto max-h-[95vh] flex flex-col`}
      >
        <DialogHeader className="flex-shrink-0 pb-4 px-6">
          <DialogTitle className="text-xl font-semibold pr-8">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 px-6">{children}</div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4 px-6">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <LoadingButton onClick={handleSubmit} loading={isSubmitting}>
            {submitText}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};