import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right" 
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:bg-green-50 group-[.toaster]:text-green-900 group-[.toaster]:border-green-200",
          error: "group-[.toaster]:bg-red-50 group-[.toaster]:text-red-900 group-[.toaster]:border-red-200",
          warning: "group-[.toaster]:bg-yellow-50 group-[.toaster]:text-yellow-900 group-[.toaster]:border-yellow-200",
        },
      }}
      {...props}
    />
  )
}

// Toast utility functions with left position
export const toastSuccess = (message: string, description?: string) => {
  return toast.success(message, { 
    description,
     position:"top-right" 
  })
}

export const toastError = (message: string, description?: string) => {
  return toast.error(message, { 
    description,
     position:"top-right" 
  })
}

export const toastWarning = (message: string, description?: string) => {
  return toast.warning(message, { 
    description,
     position:"top-right" 
  })
}

export const toastInfo = (message: string, description?: string) => {
  return toast.info(message, { 
    description,
     position:"top-right" 
  })
}

// Center position utilities
export const toastCenter = (message: string, description?: string) => {
  return toast(message, { 
    description,
    position: "top-center"
  })
}

export const toastCenterSuccess = (message: string, description?: string) => {
  return toast.success(message, { 
    description,
    position: "top-center"
  })
}

export const toastCenterError = (message: string, description?: string) => {
  return toast.error(message, { 
    description,
    position: "top-center"
  })
}

export const toastCenterWarning = (message: string, description?: string) => {
  return toast.warning(message, { 
    description,
    position: "top-center"
  })
}

export const toastCenterInfo = (message: string, description?: string) => {
  return toast.info(message, { 
    description,
    position: "top-center"
  })
}

export { Toaster, toast }