// Component Styles - New York Magazine Theme
// Sophisticated component styling with editorial aesthetics

import { colors } from './colors'
import { typography } from './typography'
import { spacing } from './spacing'
import { animations } from './animations'

export const components = {
  // Card component styles
  card: {
    base: {
      backgroundColor: colors.white,
      borderRadius: '2px',
      border: `1px solid ${colors.border.light}`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.08)',
      transition: animations.smooth,
      position: 'relative' as const,
      overflow: 'hidden' as const
    },
    
    // Accent line at top of card
    accent: {
      '&::before': {
        content: '""',
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, ${colors.black} 0%, ${colors.gray[600]} 100%)`
      }
    },
    
    // Card sections
    header: {
      padding: `${spacing.card} ${spacing.card} ${spacing.medium} ${spacing.card}`,
      borderBottom: `1px solid ${colors.gray[100]}`
    },
    
    content: {
      padding: `${spacing.large} ${spacing.card} ${spacing.card} ${spacing.card}`
    },
    
    footer: {
      padding: `${spacing.medium} ${spacing.card} ${spacing.card} ${spacing.card}`,
      borderTop: `1px solid ${colors.gray[100]}`
    },
    
    // Card variants
    variants: {
      elevated: {
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1), 0 3px 10px rgba(0, 0, 0, 0.05)',
        transform: 'translateY(-2px)'
      },
      
      interactive: {
        cursor: 'pointer',
        transition: animations.smooth,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
        }
      }
    }
  },
  
  // Button component styles
  button: {
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '0px', // Sharp corners for editorial feel
      fontFamily: typography.fontFamily.sans,
      fontWeight: typography.fontWeight.medium,
      textTransform: 'uppercase' as const,
      letterSpacing: typography.letterSpacing.wide,
      transition: animations.smooth,
      border: '2px solid transparent',
      cursor: 'pointer',
      textDecoration: 'none',
      position: 'relative' as const,
      overflow: 'hidden' as const
    },
    
    // Button variants
    variants: {
      primary: {
        backgroundColor: colors.black,
        color: colors.white,
        borderColor: colors.black,
        '&:hover': {
          backgroundColor: colors.gray[800],
          borderColor: colors.gray[800]
        },
        '&:active': {
          transform: 'translateY(1px)'
        },
        '&:disabled': {
          backgroundColor: colors.gray[400],
          borderColor: colors.gray[400],
          cursor: 'not-allowed',
          transform: 'none'
        }
      },
      
      secondary: {
        backgroundColor: 'transparent',
        color: colors.black,
        borderColor: colors.black,
        '&:hover': {
          backgroundColor: colors.gray[50],
          color: colors.black
        },
        '&:active': {
          transform: 'translateY(1px)'
        },
        '&:disabled': {
          color: colors.gray[400],
          borderColor: colors.gray[400],
          cursor: 'not-allowed',
          transform: 'none'
        }
      },
      
      ghost: {
        backgroundColor: 'transparent',
        color: colors.text.secondary,
        borderColor: 'transparent',
        '&:hover': {
          backgroundColor: colors.interactive.hover,
          color: colors.text.primary
        }
      }
    },
    
    // Button sizes
    sizes: {
      sm: {
        padding: `${spacing[2]} ${spacing[5]}`,
        fontSize: typography.fontSize.micro,
        minHeight: '32px'
      },
      
      md: {
        padding: `${spacing[3]} ${spacing[6]}`,
        fontSize: typography.fontSize.label,
        minHeight: '40px'
      },
      
      lg: {
        padding: `${spacing[4]} ${spacing[8]}`,
        fontSize: typography.fontSize.caption,
        minHeight: '48px'
      }
    }
  },
  
  // Navigation component styles
  navigation: {
    base: {
      fontFamily: typography.fontFamily.sans,
      fontSize: typography.fontSize.label,
      fontWeight: typography.fontWeight.medium,
      textTransform: 'uppercase' as const,
      letterSpacing: typography.letterSpacing.wide
    },
    
    // Navigation item
    item: {
      display: 'flex',
      alignItems: 'center',
      padding: `${spacing.nav} ${spacing.nav}`,
      textDecoration: 'none',
      transition: animations.smooth,
      borderLeft: '2px solid transparent',
      marginBottom: spacing.navGap
    },
    
    // Navigation states
    states: {
      default: {
        color: colors.gray[300],
        backgroundColor: 'transparent'
      },
      
      hover: {
        color: colors.white,
        backgroundColor: colors.interactive.hoverDark
      },
      
      active: {
        color: colors.white,
        backgroundColor: colors.interactive.hoverDark,
        borderLeftColor: colors.white
      }
    },
    
    // Navigation variants
    variants: {
      sidebar: {
        width: '280px',
        backgroundColor: colors.black,
        color: colors.white,
        minHeight: '100vh',
        position: 'sticky' as const,
        top: '64px'
      },
      
      horizontal: {
        display: 'flex',
        alignItems: 'center',
        gap: spacing.large
      }
    }
  },
  
  // Form component styles
  form: {
    // Form field container
    field: {
      marginBottom: spacing.form
    },
    
    // Form field container (last child - use CSS class)
    fieldLast: {
      marginBottom: 0
    },
    
    // Form label
    label: {
      display: 'block',
      fontFamily: typography.fontFamily.sans,
      fontSize: typography.fontSize.label,
      fontWeight: typography.fontWeight.medium,
      color: colors.text.secondary,
      textTransform: 'uppercase' as const,
      letterSpacing: typography.letterSpacing.wide,
      marginBottom: spacing.small
    },
    
    // Form input
    input: {
      width: '100%',
      padding: `${spacing.medium} ${spacing.large}`,
      fontSize: typography.fontSize.body,
      fontFamily: typography.fontFamily.sans,
      color: colors.text.primary,
      backgroundColor: colors.white,
      border: `2px solid ${colors.border.light}`,
      borderRadius: '2px',
      transition: animations.smooth,
      
      '&:focus': {
        outline: 'none',
        borderColor: colors.black,
        boxShadow: `0 0 0 4px ${colors.interactive.focus}`
      },
      
      '&:hover:not(:focus)': {
        borderColor: colors.border.medium
      },
      
      '&::placeholder': {
        color: colors.text.muted,
        fontWeight: typography.fontWeight.normal
      },
      
      '&:disabled': {
        backgroundColor: colors.gray[50],
        color: colors.text.disabled,
        cursor: 'not-allowed'
      }
    },
    
    // Form error state
    error: {
      input: {
        borderColor: colors.error,
        '&:focus': {
          borderColor: colors.error,
          boxShadow: `0 0 0 4px rgba(220, 38, 38, 0.1)`
        }
      },
      
      message: {
        color: colors.error,
        fontSize: typography.fontSize.caption,
        fontWeight: typography.fontWeight.medium,
        marginTop: spacing.small,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.small
      }
    }
  },
  
  // Typography component styles
  typography: {
    display: {
      fontFamily: typography.fontFamily.serif,
      fontSize: typography.fontSize.display,
      fontWeight: typography.fontWeight.light,
      letterSpacing: typography.letterSpacing.tight,
      lineHeight: typography.lineHeight.tight,
      color: colors.text.primary,
      marginBottom: spacing.large
    },
    
    headline: {
      fontFamily: typography.fontFamily.serif,
      fontSize: typography.fontSize.headline,
      fontWeight: typography.fontWeight.light,
      letterSpacing: typography.letterSpacing.tight,
      lineHeight: typography.lineHeight.snug,
      color: colors.text.primary,
      marginBottom: spacing.medium
    },
    
    body: {
      fontFamily: typography.fontFamily.sans,
      fontSize: typography.fontSize.body,
      fontWeight: typography.fontWeight.normal,
      letterSpacing: typography.letterSpacing.normal,
      lineHeight: typography.lineHeight.relaxed,
      color: colors.text.primary,
      marginBottom: spacing.paragraph
    },
    
    caption: {
      fontFamily: typography.fontFamily.sans,
      fontSize: typography.fontSize.caption,
      fontWeight: typography.fontWeight.normal,
      letterSpacing: typography.letterSpacing.normal,
      lineHeight: typography.lineHeight.normal,
      color: colors.text.secondary
    }
  }
}

export default components