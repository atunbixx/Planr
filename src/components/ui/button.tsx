"use client";

import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:transform-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md",
        luxury: "luxury-button-primary text-primary-foreground hover:shadow-lg transform hover:-translate-y-0.5 motion-reduce:hover:shadow-sm motion-reduce:hover:transform-none font-medium",
      },
      size: {
        sm: "h-9 rounded-md px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-11 rounded-md px-8 text-base",
        pill: "h-10 rounded-full px-6",
        luxury: "h-12 rounded-xl px-6 py-3 text-sm font-semibold",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, isLoading, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          buttonVariants({ variant, size }),
          isLoading && "opacity-80 cursor-wait",
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";
