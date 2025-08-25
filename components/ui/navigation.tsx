import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const navbuttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ",
  {
    variants: {
      variant: {
        default: "border-l-2 border-primary bg-hover text-text hover:bg-accent rounded-r-sm ",
        mobilenav: "border-b-2 border-primary bg-accent rounded-t-2 ",
        mobile_nav_outline:
         "dark:bg-zinc-800 hover:bg-accent hover:text-accent-foreground hover:rounded-md",
        outline:
         "bg-card hover:bg-accent hover:text-accent-foreground hover:rounded-md",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof navbuttonVariants> {
  asChild?: boolean
}

const Navigation = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(navbuttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Navigation.displayName = "Navigation Button"

export { Navigation }
