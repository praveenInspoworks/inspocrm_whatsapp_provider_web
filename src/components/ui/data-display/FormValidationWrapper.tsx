/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm, FormProvider, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ReactNode, useEffect, MutableRefObject } from "react";

interface FormValidationWrapperProps<T extends z.ZodType<any, any>> {
  children: (methods: UseFormReturn<z.infer<T>>) => ReactNode;
  schema: T;
  defaultValues?: z.infer<T>;
  onSubmit: (data: z.infer<T>) => void;
  className?: string;
  submitRef?: MutableRefObject<(() => void) | undefined>;
}

export const FormValidationWrapper = <T extends z.ZodType<any, any>>({
  children,
  schema,
  defaultValues,
  onSubmit,
  className,
  submitRef,
}: FormValidationWrapperProps<T>) => {
  const methods = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  // Store the submit function in the ref so parent components can call it
  useEffect(() => {
    if (submitRef) {
      submitRef.current = () => {
        methods.handleSubmit(onSubmit)();
      };
    }
  }, [methods, onSubmit, submitRef]);

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className={className}
        noValidate
      >
        {children(methods)}
      </form>
    </FormProvider>
  );
};