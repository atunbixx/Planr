"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { ChevronDown, ChevronUp, Check } from "lucide-react";

/* Utility */
function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

/* TextInput */
export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  floating?: boolean;
}
export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, label, error, hint, floating, id, ...props }, ref) => {
    const inputId = id || React.useId();
    const describedBy = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className={cn("w-full", className)}>
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            aria-describedby={describedBy}
            aria-errormessage={errorId}
            aria-invalid={!!error}
            className={cn(
              "peer w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition",
              "placeholder:text-muted-foreground focus:ring-2 focus:ring-[hsl(var(--ring))]",
              error ? "border-destructive focus:ring-destructive" : ""
            )}
            placeholder={floating ? " " : props.placeholder}
            {...props}
          />
          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                "absolute left-3 top-2 text-muted-foreground text-sm transition-all pointer-events-none",
                floating &&
                  "peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground",
                floating &&
                  "peer-focus:-top-3 peer-focus:text-xs peer-focus:bg-background peer-focus:px-1",
                floating ? " -top-3 text-xs bg-background px-1" : ""
              )}
            >
              {label}
            </label>
          )}
        </div>
        {hint && !error && (
          <p id={describedBy} className="mt-1 text-xs text-muted-foreground">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="mt-1 text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);
TextInput.displayName = "TextInput";

/* Textarea */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || React.useId();
    const describedBy = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className={cn("w-full", className)}>
        {label && (
          <label htmlFor={inputId} className="mb-1 block text-sm text-foreground/90">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          aria-describedby={describedBy}
          aria-errormessage={errorId}
          aria-invalid={!!error}
          className={cn(
            "w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition",
            "placeholder:text-muted-foreground focus:ring-2 focus:ring-[hsl(var(--ring))]",
            error ? "border-destructive focus:ring-destructive" : ""
          )}
          {...props}
        />
        {hint && !error && (
          <p id={describedBy} className="mt-1 text-xs text-muted-foreground">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="mt-1 text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

/* Select (Radix) */
export interface SelectItem {
  label: string;
  value: string;
}
export function Select({
  items,
  placeholder = "Select an option",
  value,
  onValueChange,
  label,
  className,
  id,
}: {
  items: SelectItem[];
  placeholder?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  label?: string;
  className?: string;
  id?: string;
}) {
  const selectId = id || React.useId();
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label htmlFor={selectId} className="mb-1 block text-sm text-foreground/90">
          {label}
        </label>
      )}
      <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
        <SelectPrimitive.Trigger
          id={selectId}
          className="inline-flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          aria-label={label}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown className="h-4 w-4 opacity-70" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="z-50 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md"
            position="popper"
          >
            <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1 text-muted-foreground">
              <ChevronUp className="h-4 w-4" />
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport className="p-1">
              {items.map((item) => (
                <SelectPrimitive.Item
                  key={item.value}
                  value={item.value}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
                >
                  <SelectPrimitive.ItemText>{item.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2 inline-flex items-center">
                    <Check className="h-4 w-4" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1 text-muted-foreground">
              <ChevronDown className="h-4 w-4" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}

/* Checkbox */
export function Checkbox({
  checked,
  onCheckedChange,
  label,
  className,
  id,
}: {
  checked?: boolean;
  onCheckedChange?: (c: boolean) => void;
  label?: string;
  className?: string;
  id?: string;
}) {
  const checkboxId = id || React.useId();
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <CheckboxPrimitive.Root
        id={checkboxId}
        checked={checked}
        onCheckedChange={(c) => onCheckedChange?.(!!c)}
        className="h-4 w-4 shrink-0 rounded-sm border border-input bg-background shadow focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] data-[state=checked]:bg-[hsl(var(--primary))] data-[state=checked]:text-primary-foreground"
      >
        <CheckboxPrimitive.Indicator className="text-primary-foreground">
          <Check className="h-3.5 w-3.5" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && (
        <label htmlFor={checkboxId} className="text-sm text-foreground/90">
          {label}
        </label>
      )}
    </div>
  );
}

/* Radio Group */
export function RadioGroup({
  value,
  onValueChange,
  items,
  className,
  ariaLabel,
}: {
  value?: string;
  onValueChange?: (v: string) => void;
  items: { label: string; value: string }[];
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <RadioGroupPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      className={cn("flex flex-col gap-2", className)}
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <div key={item.value} className="inline-flex items-center gap-2">
          <RadioGroupPrimitive.Item
            value={item.value}
            id={`radio-${item.value}`}
            className="h-4 w-4 rounded-full border border-input bg-background shadow outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] data-[state=checked]:border-[hsl(var(--primary))]"
          >
            <RadioGroupPrimitive.Indicator className="relative flex h-full w-full items-center justify-center">
              <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--primary))]" />
            </RadioGroupPrimitive.Indicator>
          </RadioGroupPrimitive.Item>
          <label htmlFor={`radio-${item.value}`} className="text-sm text-foreground/90">
            {item.label}
          </label>
        </div>
      ))}
    </RadioGroupPrimitive.Root>
  );
}

/* Switch (wrapper) */
export function Switch({
  checked,
  onCheckedChange,
  className,
  ariaLabel,
}: {
  checked?: boolean;
  onCheckedChange?: (c: boolean) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        "w-12 h-7 bg-muted rounded-full relative border border-border data-[state=checked]:bg-primary/20 transition-colors",
        className
      )}
      aria-label={ariaLabel}
    >
      <SwitchPrimitive.Thumb className="block w-6 h-6 bg-primary rounded-full shadow-sm border border-border translate-x-1 translate-y-0.5 transition-transform data-[state=checked]:translate-x-6" />
    </SwitchPrimitive.Root>
  );
}
