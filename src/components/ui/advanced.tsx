"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

/* Utility */
function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

/* Spinner */
export function Spinner({ size = 24, className = "" }: { size?: number; className?: string }) {
  const s = `${size}px`;
  return (
    <svg
      className={cn("animate-spin text-[hsl(var(--primary))]", className)}
      style={{ width: s, height: s }}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4A4 4 0 008 12H4z"></path>
    </svg>
  );
}

/* Skeleton */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

/* Empty State */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-8 text-center", className)}>
      {icon && <div className="text-[hsl(var(--primary))]">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

/* Toast system */
type ToastType = "info" | "success" | "warning" | "error";
type Toast = {
  id: string;
  type: ToastType;
  title?: string;
  description?: string;
  duration?: number;
};

type ToastContextValue = {
  show: (t: Omit<Toast, "id">) => void;
  remove: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const remove = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = React.useCallback(
    (t: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      const duration = t.duration ?? 3500;
      const toast: Toast = { id, ...t };
      setToasts((prev) => [toast, ...prev]);
      if (duration > 0) {
        window.setTimeout(() => remove(id), duration);
      }
    },
    [remove]
  );

  const value = React.useMemo(() => ({ show, remove }), [show, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-3 top-3 z-[60] flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className={cn(
                "pointer-events-auto overflow-hidden rounded-md border p-3 shadow-md bg-card text-card-foreground",
                t.type === "success" && "border-green-200",
                t.type === "info" && "border-blue-200",
                t.type === "warning" && "border-yellow-200",
                t.type === "error" && "border-red-200"
              )}
              role="status"
              aria-live="polite"
            >
              {t.title && <div className="text-sm font-medium">{t.title}</div>}
              {t.description && <div className="mt-1 text-xs text-muted-foreground">{t.description}</div>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

/* Alerts */
export function Alert({
  type = "info",
  title,
  children,
  className,
}: {
  type?: ToastType;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-3 text-sm",
        type === "info" && "border-blue-200 bg-blue-50/50 text-blue-900",
        type === "success" && "border-green-200 bg-green-50/50 text-green-900",
        type === "warning" && "border-yellow-200 bg-yellow-50/50 text-yellow-900",
        type === "error" && "border-red-200 bg-red-50/50 text-red-900",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {title && <div className="font-medium">{title}</div>}
      {children && <div className="mt-1 text-[13px] opacity-90">{children}</div>}
    </div>
  );
}
