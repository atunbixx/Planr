import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          [
            // Layout and shape
            "flex min-h-[80px] w-full rounded-md px-3 py-2 text-sm",
            // Borders and bg with explicit high-contrast colors
            "border-2 border-slate-200 bg-white text-black",
            "dark:border-dark-3 dark:bg-dark-2 dark:text-white",
            // Placeholder + focus
            "placeholder:text-slate-500 dark:placeholder:text-neutral-400",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:hsl(var(--primary))/0.3] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-2",
            // Disabled
            "disabled:cursor-not-allowed disabled:opacity-50",
          ].join(' '),
          className
        )}
        style={{
          color: 'var(--input-fg)',
          WebkitTextFillColor: 'var(--input-fg)' as any,
          backgroundColor: 'var(--input-bg)',
          borderColor: 'var(--input-border)',
          ...(props.style as any),
        }}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
