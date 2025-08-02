'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface NotificationToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function NotificationToggle({ 
  checked, 
  onChange, 
  label,
  description,
  disabled = false,
  size = 'md' 
}: NotificationToggleProps) {
  const sizes = {
    sm: {
      toggle: 'w-8 h-4',
      thumb: 'h-3 w-3',
      translate: 'translate-x-4'
    },
    md: {
      toggle: 'w-11 h-6',
      thumb: 'h-5 w-5',
      translate: 'translate-x-5'
    },
    lg: {
      toggle: 'w-14 h-8',
      thumb: 'h-7 w-7',
      translate: 'translate-x-6'
    }
  }

  const currentSize = sizes[size]

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 pr-4">
        <p className={cn(
          "font-medium",
          size === 'sm' && "text-sm",
          size === 'lg' && "text-lg"
        )}>
          {label}
        </p>
        {description && (
          <p className={cn(
            "text-gray-500",
            size === 'sm' && "text-xs",
            size === 'md' && "text-sm",
            size === 'lg' && "text-base"
          )}>
            {description}
          </p>
        )}
      </div>

      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black/20 rounded-full",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <motion.div
          className={cn(
            "rounded-full transition-colors",
            currentSize.toggle,
            checked ? "bg-black" : "bg-gray-200"
          )}
          animate={{
            backgroundColor: checked ? "#000000" : "#E5E7EB"
          }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className={cn(
              "absolute top-[2px] left-[2px] bg-white rounded-full shadow-sm",
              currentSize.thumb
            )}
            animate={{
              x: checked ? currentSize.translate.replace('translate-x-', '') : '0'
            }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30 
            }}
          />
        </motion.div>
      </button>
    </div>
  )
}

// Notification group component for organizing toggles
interface NotificationGroupProps {
  title: string
  description?: string
  children: React.ReactNode
  icon?: string
}

export function NotificationGroup({ 
  title, 
  description, 
  children,
  icon 
}: NotificationGroupProps) {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start space-x-3">
        {icon && (
          <i className={cn(icon, "text-gray-400 mt-1")}></i>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-4 ml-7">
        {children}
      </div>
    </motion.div>
  )
}

// Quick toggle all component
interface ToggleAllProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  label?: string
}

export function ToggleAll({ 
  enabled, 
  onChange,
  label = "Enable all notifications" 
}: ToggleAllProps) {
  return (
    <motion.div
      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
      whileHover={{ backgroundColor: '#F3F4F6' }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center space-x-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          enabled ? "bg-black text-white" : "bg-gray-300 text-gray-600"
        )}>
          <i className={cn(
            "fas",
            enabled ? "fa-bell" : "fa-bell-slash"
          )}></i>
        </div>
        <p className="font-medium">{label}</p>
      </div>
      <NotificationToggle
        checked={enabled}
        onChange={onChange}
        label=""
        size="lg"
      />
    </motion.div>
  )
}