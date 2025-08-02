// =============================================
// NEW YORK MAGAZINE THEME - DESIGN SYSTEM
// =============================================
// Editorial-first design language inspired by New York Magazine
// Sophisticated, minimal, content-focused

export const designSystem = {
  // Typography - Editorial hierarchy
  typography: {
    fontFamily: {
      // Primary fonts - elegant and readable
      serif: 'Noe Display, Playfair Display, Georgia, serif',      // Headlines and emphasis
      sans: 'Graphik, "SF Pro Display", -apple-system, system-ui, sans-serif', // Body text
      mono: 'SF Mono, "Fira Code", Monaco, "Cascadia Code", monospace'  // Data and code
    },
    fontSize: {
      xs: '0.75rem',      // 12px - Captions, small text
      sm: '0.875rem',     // 14px - Small body text
      base: '1rem',       // 16px - Body text
      lg: '1.125rem',     // 18px - Large body text
      xl: '1.25rem',      // 20px - Small headings
      '2xl': '1.5rem',    // 24px - Section headings
      '3xl': '2rem',      // 32px - Page headings
      '4xl': '2.5rem',    // 40px - Hero headings
      '5xl': '3rem',      // 48px - Display headings
      '6xl': '3.75rem',   // 60px - Large display
      '7xl': '4.5rem',    // 72px - Extra large display
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800
    },
    lineHeight: {
      tight: 1.1,         // Headlines and display text
      snug: 1.3,          // Subheadings
      normal: 1.5,        // Body text
      relaxed: 1.7,       // Long-form reading
      loose: 2.0          // Special spacing
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em'
    }
  },

  // Color palette - Sophisticated and minimal
  colors: {
    // Primary brand colors
    ink: '#0A0A0A',           // Primary text - rich black
    paper: '#FFFFFF',         // Background - pure white
    accent: '#FF3366',        // New York Magazine red - sparingly used
    
    // Sophisticated grays - carefully calibrated
    gray: {
      50: '#FAFAFA',          // Lightest background
      100: '#F4F4F5',         // Light background
      200: '#E4E4E7',         // Borders, subtle elements
      300: '#D4D4D8',         // Disabled elements
      400: '#A1A1AA',         // Placeholder text
      500: '#71717A',         // Secondary text
      600: '#52525B',         // Body text (lighter)
      700: '#3F3F46',         // Body text
      800: '#27272A',         // Dark text
      900: '#18181B'          // Darkest text
    },
    
    // Semantic colors - minimal and tasteful
    success: '#10B981',       // Green - confirmations
    warning: '#F59E0B',       // Amber - warnings
    error: '#EF4444',         // Red - errors and alerts
    info: '#3B82F6',          // Blue - information
    
    // Wedding-specific accent colors
    wedding: {
      gold: '#D4AF37',        // Elegant gold accent
      blush: '#F8F0F0',       // Soft pink background
      sage: '#9CAF88',        // Sage green accent
      navy: '#1E3A8A',        // Deep navy accent
      cream: '#FDF6E3'        // Warm cream background
    }
  },

  // Spacing system - Consistent and rhythmic
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',    // 2px
    1: '0.25rem',       // 4px
    1.5: '0.375rem',    // 6px
    2: '0.5rem',        // 8px
    2.5: '0.625rem',    // 10px
    3: '0.75rem',       // 12px
    3.5: '0.875rem',    // 14px
    4: '1rem',          // 16px - base unit
    5: '1.25rem',       // 20px
    6: '1.5rem',        // 24px
    7: '1.75rem',       // 28px
    8: '2rem',          // 32px
    9: '2.25rem',       // 36px
    10: '2.5rem',       // 40px
    11: '2.75rem',      // 44px
    12: '3rem',         // 48px
    14: '3.5rem',       // 56px
    16: '4rem',         // 64px
    20: '5rem',         // 80px
    24: '6rem',         // 96px
    28: '7rem',         // 112px
    32: '8rem',         // 128px
    36: '9rem',         // 144px
    40: '10rem',        // 160px
    44: '11rem',        // 176px
    48: '12rem',        // 192px
    52: '13rem',        // 208px
    56: '14rem',        // 224px
    60: '15rem',        // 240px
    64: '16rem',        // 256px
    72: '18rem',        // 288px
    80: '20rem',        // 320px
    96: '24rem'         // 384px
  },

  // Border radius - Subtle and refined
  borderRadius: {
    none: '0',
    sm: '0.125rem',     // 2px
    base: '0.25rem',    // 4px
    md: '0.375rem',     // 6px
    lg: '0.5rem',       // 8px
    xl: '0.75rem',      // 12px
    '2xl': '1rem',      // 16px
    '3xl': '1.5rem',    // 24px
    full: '9999px'      // Fully rounded
  },

  // Shadows - Subtle depth
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: '0 0 #0000'
  },

  // Animation and transitions
  animation: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
      slower: '500ms'
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },

  // Component-specific tokens
  components: {
    card: {
      background: '#FFFFFF',
      border: '1px solid #E4E4E7',
      borderRadius: '0.5rem',
      shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      padding: '1.5rem'
    },
    button: {
      primary: {
        background: '#0A0A0A',
        color: '#FFFFFF',
        borderRadius: '0.375rem',
        padding: '0.75rem 1.5rem'
      },
      secondary: {
        background: 'transparent',
        color: '#0A0A0A',
        border: '1px solid #E4E4E7',
        borderRadius: '0.375rem',
        padding: '0.75rem 1.5rem'
      },
      accent: {
        background: '#FF3366',
        color: '#FFFFFF',
        borderRadius: '0.375rem',
        padding: '0.75rem 1.5rem'
      }
    },
    input: {
      background: '#FFFFFF',
      border: '1px solid #D4D4D8',
      borderRadius: '0.375rem',
      padding: '0.75rem 1rem',
      fontSize: '1rem',
      lineHeight: '1.5'
    }
  },

  // Layout and grid
  layout: {
    container: {
      maxWidth: '1280px',
      padding: '1rem'
    },
    sidebar: {
      width: '280px',
      background: '#FAFAFA'
    },
    header: {
      height: '4rem',
      background: '#FFFFFF',
      borderBottom: '1px solid #E4E4E7'
    }
  },

  // Breakpoints - Mobile-first responsive design
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
} as const

// Type exports for TypeScript
export type DesignSystem = typeof designSystem
export type Colors = typeof designSystem.colors
export type Typography = typeof designSystem.typography
export type Spacing = typeof designSystem.spacing