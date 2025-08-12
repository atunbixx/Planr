import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'luxury';
  error?: string;
  'aria-describedby'?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'default', error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 motion-reduce:transition-none",
          variant === 'luxury' && "luxury-input h-12 rounded-xl px-4 py-3 text-base font-medium",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }