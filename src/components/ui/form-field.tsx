"use client"

import React from 'react'
import { Label } from '@/components/ui/label'

type FormFieldProps = {
  label?: React.ReactNode
  htmlFor?: string
  required?: boolean
  error?: string
  help?: React.ReactNode
  className?: string
  children: React.ReactNode
  size?: 'md' | 'sm'
}

export function FormField({ label, htmlFor, required, error, help, className = '', children, size = 'md' }: FormFieldProps) {
  const describedById = error ? `${htmlFor || 'field'}-error` : (help ? `${htmlFor || 'field'}-help` : undefined)
  const spacing = size === 'sm' ? 'space-y-1' : 'space-y-2'
  const labelSize = size === 'sm' ? 'text-xs' : 'text-sm'
  return (
    <div className={`${spacing} ${className}`}>
      {label ? (
        <Label htmlFor={htmlFor} className={`mb-1 block ${labelSize}`}>
          <span>{label}</span>
          {required ? <span className="ml-1 text-rose-600">*</span> : null}
        </Label>
      ) : null}
      {React.isValidElement(children)
        ? React.cloneElement(children as any, { 'aria-describedby': describedById, 'aria-invalid': Boolean(error) || undefined })
        : children}
      {error ? (
        <p id={describedById} className="text-sm text-rose-600">{error}</p>
      ) : help ? (
        <p id={describedById} className="text-sm text-[#64748B] dark:text-neutral-400">{help}</p>
      ) : null}
    </div>
  )
}
