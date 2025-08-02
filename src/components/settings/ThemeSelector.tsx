'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import { themeColors } from '@/types/settings'

interface ThemeSelectorProps {
  selectedTheme: string
  onThemeChange: (theme: string) => void
  className?: string
}

export function ThemeSelector({ 
  selectedTheme, 
  onThemeChange,
  className 
}: ThemeSelectorProps) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {Object.entries(themeColors).map(([themeId, theme]) => (
        <motion.button
          key={themeId}
          onClick={() => onThemeChange(themeId)}
          className={cn(
            "relative p-4 rounded-lg border-2 transition-all overflow-hidden",
            selectedTheme === themeId
              ? "border-black shadow-lg"
              : "border-gray-200 hover:border-gray-300"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Theme preview */}
          <div className="relative">
            {/* Color swatches */}
            <div className="grid grid-cols-2 gap-1 mb-3">
              <motion.div
                className="h-8 rounded"
                style={{ backgroundColor: theme.primary }}
                initial={false}
                animate={{
                  scale: selectedTheme === themeId ? 1.05 : 1
                }}
                transition={{ duration: 0.2 }}
              />
              <div
                className="h-8 rounded"
                style={{ backgroundColor: theme.secondary }}
              />
              <div
                className="h-8 rounded"
                style={{ backgroundColor: theme.accent }}
              />
              <div
                className="h-8 rounded flex items-center justify-center"
                style={{ backgroundColor: theme.text }}
              >
                <span 
                  className="text-xs font-medium"
                  style={{ 
                    color: theme.text === '#FFFFFF' ? '#000000' : '#FFFFFF' 
                  }}
                >
                  Aa
                </span>
              </div>
            </div>

            {/* Theme name */}
            <p className="font-medium text-sm">{theme.name}</p>

            {/* Selected indicator */}
            <AnimatePresence>
              {selectedTheme === themeId && (
                <motion.div
                  className="absolute -top-1 -right-1 w-6 h-6 bg-black rounded-full flex items-center justify-center"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <i className="fas fa-check text-white text-xs"></i>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Hover effect */}
          <motion.div
            className="absolute inset-0 bg-black opacity-0 pointer-events-none"
            animate={{
              opacity: selectedTheme === themeId ? 0.05 : 0
            }}
            whileHover={{
              opacity: 0.05
            }}
            transition={{ duration: 0.2 }}
          />
        </motion.button>
      ))}
    </div>
  )
}

// Preview component for showing theme in action
interface ThemePreviewProps {
  theme: keyof typeof themeColors
  className?: string
}

export function ThemePreview({ theme, className }: ThemePreviewProps) {
  const colors = themeColors[theme]

  return (
    <motion.div
      className={cn("p-6 rounded-lg", className)}
      style={{ backgroundColor: colors.primary }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div 
        className="p-4 rounded-md mb-4"
        style={{ backgroundColor: colors.secondary }}
      >
        <h3 
          className="font-semibold text-lg mb-2"
          style={{ color: colors.text }}
        >
          Theme Preview
        </h3>
        <p 
          className="text-sm opacity-80"
          style={{ color: colors.text }}
        >
          This is how your wedding planner will look with the {colors.name} theme.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={{ 
            backgroundColor: colors.accent,
            color: colors.text === '#FFFFFF' ? colors.primary : '#FFFFFF'
          }}
        >
          Primary Button
        </button>
        <button
          className="px-4 py-2 rounded-md text-sm font-medium border transition-colors"
          style={{ 
            borderColor: colors.accent,
            color: colors.text,
            backgroundColor: 'transparent'
          }}
        >
          Secondary Button
        </button>
      </div>
    </motion.div>
  )
}