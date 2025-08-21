import { createTheme } from '@mui/material/styles';

// Million Dollar UI Theme - Premium, Modern, Symmetrical
const premiumTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#722F37', // Deep burgundy
      light: '#8B4A52',
      dark: '#5A252A',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#6B7C32', // Olive green
      light: '#8A9B4A',
      dark: '#556028',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FAFBFF', // Ultra-light blue-tinted white
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E293B', // Sophisticated dark blue-gray
      secondary: '#64748B',
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
    },
    warning: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
    },
    info: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
    },
    // Custom colors for premium feel
    grey: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", "Segoe UI", system-ui, sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 300,
      letterSpacing: '-0.025em',
      lineHeight: 1.1,
      color: '#722F37',
      fontFamily: '"Bodoni Moda", serif',
    },
    h2: {
      fontSize: '2.75rem',
      fontWeight: 300,
      letterSpacing: '-0.025em',
      lineHeight: 1.2,
      color: '#1E293B',
      fontFamily: '"Bodoni Moda", serif',
    },
    h3: {
      fontSize: '2.25rem',
      fontWeight: 300,
      letterSpacing: '-0.025em',
      lineHeight: 1.25,
      color: '#1E293B',
      fontFamily: '"Bodoni Moda", serif',
    },
    h4: {
      fontSize: '1.875rem',
      fontWeight: 400,
      letterSpacing: '-0.025em',
      lineHeight: 1.3,
      color: '#1E293B',
      fontFamily: '"Bodoni Moda", serif',
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 400,
      letterSpacing: '-0.025em',
      lineHeight: 1.35,
      color: '#1E293B',
      fontFamily: '"Bodoni Moda", serif',
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 400,
      letterSpacing: '-0.025em',
      lineHeight: 1.4,
      color: '#1E293B',
      fontFamily: '"Bodoni Moda", serif',
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.6,
      color: '#475569',
      fontFamily: '"Inter", "SF Pro Display", "Segoe UI", system-ui, sans-serif',
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.6,
      color: '#64748B',
      fontFamily: '"Inter", "SF Pro Display", "Segoe UI", system-ui, sans-serif',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.875rem',
      letterSpacing: '0.025em',
      fontFamily: '"Inter", "SF Pro Display", "Segoe UI", system-ui, sans-serif',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.4,
      color: '#94A3B8',
      fontFamily: '"Inter", "SF Pro Display", "Segoe UI", system-ui, sans-serif',
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: '#64748B',
      fontFamily: '"Bodoni Moda", serif',
    },
  },
  shape: {
    borderRadius: 12, // Modern rounded corners
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.05)',
    '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
    '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#FAFBFF',
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontSize: '0.875rem',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0px 4px 12px rgba(99, 102, 241, 0.4)',
          },
          '&:active': {
            transform: 'translateY(0px)',
          },
        },
        contained: {
          backgroundColor: '#722F37',
          color: '#FFFFFF',
          border: 'none',
          '&:hover': {
            backgroundColor: '#5A252A',
            boxShadow: '0px 8px 25px rgba(114, 47, 55, 0.4)',
          },
        },
        outlined: {
          borderColor: '#E2E8F0',
          color: '#475569',
          backgroundColor: '#FFFFFF',
          '&:hover': {
            borderColor: '#722F37',
            backgroundColor: '#F8FAFC',
            color: '#722F37',
          },
        },
        text: {
          color: '#722F37',
          '&:hover': {
            backgroundColor: 'rgba(114, 47, 55, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #F1F5F9',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
            borderColor: '#E2E8F0',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
          border: '1px solid #F1F5F9',
        },
        elevation1: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
        },
        elevation2: {
          boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        elevation3: {
          boxShadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#FFFFFF',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '& fieldset': {
              borderColor: '#E2E8F0',
            },
            '&:hover fieldset': {
              borderColor: '#CBD5E1',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#722F37',
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
        filled: {
          backgroundColor: '#F1F5F9',
          color: '#475569',
          '&:hover': {
            backgroundColor: '#E2E8F0',
          },
        },
        outlined: {
          borderColor: '#E2E8F0',
          color: '#475569',
          '&:hover': {
            backgroundColor: '#F8FAFC',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: '#722F37',
          color: '#FFFFFF',
          fontWeight: 600,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #F1F5F9',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
          color: '#1E293B',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #F1F5F9',
          boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&:hover': {
            backgroundColor: '#F8FAFC',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(114, 47, 55, 0.08)',
            color: '#722F37',
            '&:hover': {
              backgroundColor: 'rgba(114, 47, 55, 0.12)',
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          minHeight: 48,
          '&.Mui-selected': {
            color: '#722F37',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#722F37',
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: '#F1F5F9',
        },
        bar: {
          backgroundColor: '#722F37',
          borderRadius: 4,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          '& .MuiCircularProgress-circle': {
            stroke: 'url(#gradient)',
          },
        },
      },
    },
  },
});

export default premiumTheme;