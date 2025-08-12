"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative h-1 w-full overflow-hidden bg-gray-100 rounded-full",
          className
        )}
        {...props}
      >
        <div
          className="h-full bg-[#7a9b7f] transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }