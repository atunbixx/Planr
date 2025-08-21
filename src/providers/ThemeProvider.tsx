'use client';

import React from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ThemeProvider as CustomThemeProvider, useTheme } from '@/contexts/ThemeContext';
import ImpersonationBanner from '@/components/admin/ImpersonationBanner';

function ThemeContent({ children }: { children: React.ReactNode }) {
  const { currentTheme } = useTheme();
  
  return (
    <MuiThemeProvider theme={currentTheme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <ImpersonationBanner />
        {children}
      </LocalizationProvider>
    </MuiThemeProvider>
  );
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <CustomThemeProvider>
      <ThemeContent>{children}</ThemeContent>
    </CustomThemeProvider>
  );
}
