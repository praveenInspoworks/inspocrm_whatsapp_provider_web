import { RadioGroup, RadioGroupProps } from "@/components/ui/radio-group";
import { FormFieldWrapper } from "./FormFieldWrapper";

interface RadioGroupWithErrorProps extends RadioGroupProps {
  error?: string;
}

export const RadioGroupWithError = ({ error, ...props }: RadioGroupWithErrorProps) => (
  <FormFieldWrapper error={error}>
    <RadioGroup {...props} />
  </FormFieldWrapper>
);