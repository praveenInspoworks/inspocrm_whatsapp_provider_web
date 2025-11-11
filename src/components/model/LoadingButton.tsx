import { Button, ButtonProps } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
}

export const LoadingButton = ({
  loading,
  children,
  ...props
}: LoadingButtonProps) => {
  return (
    <Button disabled={loading} {...props}>
      {loading ? (
        <>
          <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </Button>
  );
};