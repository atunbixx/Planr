"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { motion } from "framer-motion";
import { Palette, Crown, Sparkles } from "lucide-react";
import React from "react";

const themeOptions = [
  { value: "default", label: "Default", icon: Palette, color: "bg-blue-500" },
  { value: "bridal", label: "Bridal", icon: Crown, color: "bg-pink-500" },
  { value: "luxury", label: "Luxury", icon: Sparkles, color: "bg-purple-500" },
] as const;

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`flex items-center gap-1 p-1 bg-muted rounded-lg ${className}`}>
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;
        
        return (
          <button
            key={option.value}
            onClick={() => setTheme(option.value as "default" | "bridal" | "luxury")}
            className={`
              relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
              ${isActive 
                ? 'text-white shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }
            `}
            aria-label={`Switch to ${option.label} theme`}
          >
            {isActive && (
              <motion.div
                layoutId="theme-toggle-bg"
                className={`absolute inset-0 rounded-md ${option.color}`}
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              />
            )}
            <Icon className="w-4 h-4 relative z-10" />
            <span className="relative z-10 hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
