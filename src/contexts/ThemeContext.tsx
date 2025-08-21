'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme } from '@mui/material/styles';
import defaultTheme from '@/theme/theme';
import premiumTheme from '@/theme/premiumTheme';

type ThemeMode = 'default' | 'premium';

interface ThemeContextType {
  themeMode: ThemeMode;
  currentTheme: Theme;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('default');

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('wedding-planner-theme') as ThemeMode;
    if (savedTheme && (savedTheme === 'default' || savedTheme === 'premium')) {
      setThemeMode(savedTheme);
    }
  }, []);

  // Save theme preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('wedding-planner-theme', themeMode);
  }, [themeMode]);

  const currentTheme = themeMode === 'premium' ? premiumTheme : defaultTheme;

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'default' ? 'premium' : 'default');
  };

  const value: ThemeContextType = {
    themeMode,
    currentTheme,
    toggleTheme,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;