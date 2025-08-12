"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion, AnimatePresence } from "framer-motion";

/* Utility */
function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

/* Dialog */
export function Dialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  className,
}: {
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  trigger?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal forceMount>
        <AnimatePresence>
          <DialogPrimitive.Overlay asChild>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
            />
          </DialogPrimitive.Overlay>
        </AnimatePresence>
        <AnimatePresence>
          <DialogPrimitive.Content asChild>
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={cn(
                "fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-xl focus:outline-none",
                className
              )}
            >
              {(title || description) && (
                <div className="mb-4">
                  {title && (
                    <DialogPrimitive.Title className="text-lg font-semibold">
                      {title}
                    </DialogPrimitive.Title>
                  )}
                  {description && (
                    <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                      {description}
                    </DialogPrimitive.Description>
                  )}
                </div>
              )}
              {children}
              <DialogPrimitive.Close asChild>
                <button
                  className="mt-4 inline-flex items-center justify-center rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                  aria-label="Close"
                >
                  Close
                </button>
              </DialogPrimitive.Close>
            </motion.div>
          </DialogPrimitive.Content>
        </AnimatePresence>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* Tabs */
export function Tabs({
  defaultValue,
  value,
  onValueChange,
  tabs,
  variant = "underline",
  className,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  tabs: { value: string; label: string; content: React.ReactNode }[];
  variant?: "underline" | "pill";
  className?: string;
}) {
  return (
    <TabsPrimitive.Root
      className={cn("w-full", className)}
      defaultValue={defaultValue ?? tabs[0]?.value}
      value={value}
      onValueChange={onValueChange}
    >
      <TabsPrimitive.List
        className={cn(
          "mb-4 flex flex-wrap items-center gap-2",
          variant === "underline" && "border-b border-border",
          variant === "pill" && "bg-muted/60 p-1 rounded-full"
        )}
      >
        {tabs.map((t) => (
          <TabsPrimitive.Trigger
            key={t.value}
            value={t.value}
            className={cn(
              "px-3 py-2 text-sm font-medium text-foreground/80 outline-none transition",
              "data-[state=active]:text-foreground",
              variant === "underline" &&
                "relative data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:-bottom-[1px] data-[state=active]:after:h-[2px] data-[state=active]:after:bg-[hsl(var(--primary))]",
              variant === "pill" &&
                "rounded-full data-[state=active]:bg-[hsl(var(--primary))/0.08)] data-[state=active]:text-foreground"
            )}
          >
            {t.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {tabs.map((t) => (
        <TabsPrimitive.Content key={t.value} value={t.value} className="outline-none">
          {t.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}
