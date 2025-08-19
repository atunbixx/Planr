import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#000000', // Pure black for NY Magazine aesthetic
      light: '#333333',
      dark: '#000000',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#666666', // Mid gray for subtle accents
      light: '#999999',
      dark: '#333333',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#E9F5EB', // Lime green background
      paper: '#FFFFFF', // Pure white for cards
    },
    text: {
      primary: '#000000', // Pure black text
      secondary: '#666666', // Gray for secondary text
    },
    error: {
      main: '#000000', // Black for errors (minimalist)
    },
    warning: {
      main: '#333333', // Dark gray for warnings
    },
    info: {
      main: '#666666', // Mid gray for info
    },
    success: {
      main: '#000000', // Black for success (minimalist)
    },
  },
  typography: {
    fontFamily: '"Bodoni Moda", "Playfair Display", "Didot", serif', // Ultra-luxury serif font
    h1: {
      fontSize: '4rem',
      fontWeight: 300,
      letterSpacing: '-0.05em',
      fontFamily: '"Bodoni Moda", "Playfair Display", "Didot", serif',
      lineHeight: 1.05,
      fontStyle: 'normal',
    },
    h2: {
      fontSize: '3rem',
      fontWeight: 300,
      letterSpacing: '-0.04em',
      fontFamily: '"Bodoni Moda", "Playfair Display", "Didot", serif',
      lineHeight: 1.1,
    },
    h3: {
      fontSize: '2.5rem',
      fontWeight: 300,
      letterSpacing: '-0.03em',
      fontFamily: '"Bodoni Moda", "Playfair Display", "Didot", serif',
      lineHeight: 1.15,
    },
    h4: {
      fontSize: '2rem',
      fontWeight: 400,
      letterSpacing: '-0.02em',
      fontFamily: '"Bodoni Moda", "Playfair Display", "Didot", serif',
      lineHeight: 1.2,
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 400,
      letterSpacing: '-0.01em',
      fontFamily: '"Bodoni Moda", "Playfair Display", "Didot", serif',
      lineHeight: 1.25,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 500,
      letterSpacing: '0.02em',
      fontFamily: '"Inter", "Helvetica Neue", sans-serif',
      lineHeight: 1.3,
      textTransform: 'uppercase',
    },
    body1: {
      fontFamily: '"Inter", "Helvetica Neue", sans-serif',
      fontWeight: 400,
      letterSpacing: '-0.01em',
      fontSize: '0.9375rem',
      lineHeight: 1.65,
    },
    body2: {
      fontFamily: '"Inter", "Helvetica Neue", sans-serif',
      fontWeight: 400,
      letterSpacing: '-0.01em',
      fontSize: '0.875rem',
      lineHeight: 1.65,
    },
    button: {
      textTransform: 'uppercase',
      fontWeight: 700,
      fontFamily: '"Inter", "Helvetica Neue", sans-serif',
      letterSpacing: '0.12em',
      fontSize: '0.625rem',
    },
  },
  shape: {
    borderRadius: 0, // Sharp corners for minimalist luxury look
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          padding: '14px 40px',
          fontSize: '0.6875rem',
          boxShadow: 'none',
          border: '1px solid #000000',
          transition: 'all 0.2s ease',
          fontWeight: 600,
          '&:hover': {
            boxShadow: 'none',
            backgroundColor: '#000000',
            color: '#FFFFFF',
            borderColor: '#000000',
          },
        },
        contained: {
          backgroundColor: '#000000',
          color: '#FFFFFF',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#FFFFFF',
            color: '#000000',
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          borderRadius: 0,
          border: 'none',
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.10)',
            transform: 'none',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 0,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 0 rgba(74, 93, 58, 0.1)',
          backgroundImage: 'none',
          borderBottom: '1px solid rgba(74, 93, 58, 0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(74, 93, 58, 0.1)',
          color: '#4A5D3A',
        },
      },
    },
  },
});

export default theme;