// Typography System - New York Magazine Theme
// Sophisticated editorial typography with serif headlines and clean sans-serif body text

export const typography = {
  // Font families with proper fallbacks
  fontFamily: {
    serif: '"Times New Roman", Times, serif',
    sans: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", monospace'
  },

  // Font size scale - based on editorial design principles
  fontSize: {
    display: '48px',      // Main page headlines
    headline: '28px',     // Section headers
    title: '20px',        // Card titles, subheadings
    body: '16px',         // Body text, paragraphs
    caption: '14px',      // Secondary text, captions
    label: '12px',        // Form labels, navigation
    micro: '10px'         // Micro text, metadata
  },

  // Font weights - minimal set for clean hierarchy
  fontWeight: {
    light: '300',         // Display headlines
    normal: '400',        // Body text
    medium: '500',        // Emphasis, labels
    semibold: '600',      // Card titles
    bold: '700'           // Strong emphasis (rarely used)
  },

  // Letter spacing - editorial refinement
  letterSpacing: {
    tight: '-0.02em',     // Large headlines
    normal: '0',          // Body text
    wide: '0.5px',        // Uppercase labels
    wider: '1px'          // Micro labels, metadata
  },

  // Line heights - optimized for readability
  lineHeight: {
    tight: '1.1',         // Display headlines
    snug: '1.2',          // Section headlines
    normal: '1.4',        // UI text
    relaxed: '1.6',       // Body text
    loose: '1.8'          // Long-form content
  }
}

// Typography utility functions
export const createTypographyStyle = (variant: keyof typeof typographyVariants) => {
  return typographyVariants[variant]
}

export const typographyVariants = {
  display: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.light,
    letterSpacing: typography.letterSpacing.tight,
    lineHeight: typography.lineHeight.tight
  },
  
  headline: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.fontSize.headline,
    fontWeight: typography.fontWeight.light,
    letterSpacing: typography.letterSpacing.tight,
    lineHeight: typography.lineHeight.snug
  },
  
  title: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.normal,
    lineHeight: typography.lineHeight.snug
  },
  
  body: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.normal,
    letterSpacing: typography.letterSpacing.normal,
    lineHeight: typography.lineHeight.relaxed
  },
  
  caption: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.normal,
    letterSpacing: typography.letterSpacing.normal,
    lineHeight: typography.lineHeight.normal
  },
  
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: typography.letterSpacing.wide,
    lineHeight: typography.lineHeight.normal,
    textTransform: 'uppercase' as const
  },
  
  micro: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.micro,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: typography.letterSpacing.wider,
    lineHeight: typography.lineHeight.normal,
    textTransform: 'uppercase' as const
  }
}

// Responsive typography helpers
export const createResponsiveTypography = (
  mobileVariant: keyof typeof typographyVariants,
  desktopVariant?: keyof typeof typographyVariants
) => {
  const mobile = typographyVariants[mobileVariant]
  const desktop = desktopVariant ? typographyVariants[desktopVariant] : mobile
  
  return {
    ...mobile,
    '@media (min-width: 768px)': desktop
  }
}

// Font loading utilities
export const fontLoadingCSS = `
  /* Font loading optimization */
  @font-face {
    font-family: 'Times New Roman';
    font-display: swap;
  }
  
  @font-face {
    font-family: 'Helvetica Neue';
    font-display: swap;
  }
`

export default typography