import * as React from "react";

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

export function Card({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'luxury' }) {
  return (
    <div
      className={cn(
        // Devias-like styling: softer elevation, larger radius, subtle border, white-ish surface
        "rounded-2xl border border-border bg-card text-card-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04),_0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-200",
        variant === 'luxury' && "luxury-card hover:shadow-lg border-border/50",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'luxury' }) {
  return (
    <div
      className={cn(
        // Compact vertical rhythm similar to Devias cards
        "flex flex-col space-y-1.5 px-5 py-4",
        variant === 'luxury' && "px-8 py-6 space-y-3",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLHeadingElement> & { variant?: 'default' | 'luxury' }) {
  return (
    <h3
      className={cn(
        // Slightly smaller/denser than default, aligns with Devias tone
        "text-base font-semibold leading-none tracking-tight",
        variant === 'luxury' && "luxury-heading text-xl font-bold tracking-tight",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLParagraphElement> & { variant?: 'default' | 'luxury' }) {
  return (
    <p
      className={cn(
        // Muted tone and compact size
        "text-sm text-muted-foreground",
        variant === 'luxury' && "luxury-body text-base leading-relaxed",
        className
      )}
      {...props}
    />
  );
}

export function CardContent({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'luxury' }) {
  return (
    <div
      className={cn(
        // Devias cards use tighter padding
        "px-5 py-4",
        variant === 'luxury' && "px-8 py-6 space-y-6",
        className
      )}
      {...props}
    />
  );
}

export function CardFooter({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'luxury' }) {
  return (
    <div
      className={cn(
        // Footer with compact padding and top separator option via border utils when needed
        "flex items-center px-5 py-4",
        variant === 'luxury' && "px-8 py-6 gap-4",
        className
      )}
      {...props}
    />
  );
}
