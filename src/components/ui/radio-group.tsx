"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { cn } from "@/lib/utils"

const RadioGroup = RadioGroupPrimitive.Root

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      [
        // Size and shape
        "h-4 w-4 shrink-0 rounded-full border-2",
        // Borders/backgrounds for light/dark
        "border-slate-300 bg-white dark:border-dark-3 dark:bg-dark-2",
        // Focus ring
        "focus:outline-none focus:ring-2 focus:ring-[color:hsl(var(--primary))/0.3] focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-dark-2",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Checked state accent
        "data-[state=checked]:border-[hsl(var(--primary))]",
      ].join(' '),
      className
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator
      className={cn(
        "flex items-center justify-center",
        "after:block after:h-2 after:w-2 after:rounded-full after:bg-[hsl(var(--primary))]"
      )}
    />
  </RadioGroupPrimitive.Item>
))
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }

