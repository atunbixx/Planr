'use client';

import React from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import theme from '@/theme/theme';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        {children}
      </LocalizationProvider>
    </MuiThemeProvider>
  );
}
