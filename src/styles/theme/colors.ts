// Color System - New York Magazine Theme
// Sophisticated black and white palette with strategic gray scale

export const colors = {
  // Primary brand colors
  black: '#000000',
  white: '#ffffff',
  
  // Comprehensive gray scale for editorial sophistication
  gray: {
    50: '#fafafa',    // Lightest background
    100: '#f5f5f5',   // Light background
    200: '#e8e8e8',   // Subtle borders
    300: '#cccccc',   // Muted text
    400: '#999999',   // Secondary text
    500: '#666666',   // Label text
    600: '#333333',   // Dark borders
    700: '#222222',   // Dark backgrounds
    800: '#111111',   // Darker backgrounds
    900: '#000000'    // Pure black
  },
  
  // Semantic color tokens
  primary: '#000000',
  secondary: '#666666',
  accent: '#000000',
  
  // State colors (minimal, sophisticated palette)
  success: '#059669',   // Emerald green
  warning: '#d97706',   // Amber
  error: '#dc2626',     // Red
  info: '#0284c7',      // Sky blue
  
  // Text color utilities
  text: {
    primary: '#000000',     // Main text
    secondary: '#666666',   // Secondary text
    muted: '#999999',       // Muted text
    inverse: '#ffffff',     // Text on dark backgrounds
    disabled: '#cccccc'     // Disabled text
  },
  
  // Background color utilities
  background: {
    primary: '#ffffff',           // Main background
    secondary: '#fafafa',         // Secondary background
    tertiary: '#f5f5f5',         // Tertiary background
    dark: '#000000',              // Dark background
    overlay: 'rgba(0, 0, 0, 0.05)', // Light overlay
    darkOverlay: 'rgba(0, 0, 0, 0.8)' // Dark overlay
  },
  
  // Border color utilities
  border: {
    light: '#e8e8e8',     // Light borders
    medium: '#cccccc',    // Medium borders
    dark: '#666666',      // Dark borders
    accent: '#000000'     // Accent borders
  },
  
  // Interactive state colors
  interactive: {
    hover: 'rgba(0, 0, 0, 0.05)',      // Light hover
    hoverDark: 'rgba(255, 255, 255, 0.05)', // Dark hover
    active: 'rgba(0, 0, 0, 0.1)',      // Active state
    focus: 'rgba(0, 0, 0, 0.1)',       // Focus state
    disabled: 'rgba(0, 0, 0, 0.3)'     // Disabled state
  }
}

// Color utility functions
export const createColorUtilities = () => ({
  // Text color helpers
  textPrimary: { color: colors.text.primary },
  textSecondary: { color: colors.text.secondary },
  textMuted: { color: colors.text.muted },
  textInverse: { color: colors.text.inverse },
  
  // Background color helpers
  bgPrimary: { backgroundColor: colors.background.primary },
  bgSecondary: { backgroundColor: colors.background.secondary },
  bgDark: { backgroundColor: colors.background.dark },
  
  // Border color helpers
  borderLight: { borderColor: colors.border.light },
  borderMedium: { borderColor: colors.border.medium },
  borderDark: { borderColor: colors.border.dark },
  
  // State color helpers
  success: { color: colors.success },
  warning: { color: colors.warning },
  error: { color: colors.error },
  info: { color: colors.info }
})

// Color contrast utilities
export const getContrastColor = (backgroundColor: string): string => {
  // Simple contrast calculation - in production, use a proper contrast library
  const darkColors = [colors.black, colors.gray[900], colors.gray[800], colors.gray[700]]
  return darkColors.includes(backgroundColor) ? colors.white : colors.black
}

// Color opacity utilities
export const withOpacity = (color: string, opacity: number): string => {
  // Convert hex to rgba - simplified version
  if (color === colors.black) return `rgba(0, 0, 0, ${opacity})`
  if (color === colors.white) return `rgba(255, 255, 255, ${opacity})`
  return color // Fallback for complex colors
}

// Gradient utilities for sophisticated effects
export const gradients = {
  subtle: `linear-gradient(180deg, ${colors.white} 0%, ${colors.gray[50]} 100%)`,
  hero: `linear-gradient(135deg, ${colors.gray[50]} 0%, ${colors.white} 100%)`,
  dark: `linear-gradient(180deg, ${colors.black} 0%, ${colors.gray[800]} 100%)`,
  accent: `linear-gradient(90deg, ${colors.black} 0%, ${colors.gray[600]} 100%)`
}

// CSS custom properties for runtime theme switching
export const colorCSSVariables = `
  :root {
    --color-black: ${colors.black};
    --color-white: ${colors.white};
    --color-primary: ${colors.primary};
    --color-secondary: ${colors.secondary};
    --color-text-primary: ${colors.text.primary};
    --color-text-secondary: ${colors.text.secondary};
    --color-text-muted: ${colors.text.muted};
    --color-bg-primary: ${colors.background.primary};
    --color-bg-secondary: ${colors.background.secondary};
    --color-bg-dark: ${colors.background.dark};
    --color-border-light: ${colors.border.light};
    --color-border-medium: ${colors.border.medium};
    --color-border-dark: ${colors.border.dark};
    --color-success: ${colors.success};
    --color-warning: ${colors.warning};
    --color-error: ${colors.error};
    --color-info: ${colors.info};
  }
`

export default colors