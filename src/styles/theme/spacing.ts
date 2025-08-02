// Spacing System - New York Magazine Theme
// Editorial spacing with generous white space and proper hierarchy

export const spacing = {
  // Base spacing scale (4px base unit for consistency)
  0: '0',
  1: '4px',     // Micro spacing
  2: '8px',     // Small spacing
  3: '12px',    // Medium-small spacing
  4: '16px',    // Medium spacing
  5: '20px',    // Medium-large spacing
  6: '24px',    // Large spacing
  8: '32px',    // Extra large spacing
  10: '40px',   // XXL spacing
  12: '48px',   // Section spacing
  16: '64px',   // Large section spacing
  20: '80px',   // XL section spacing
  24: '96px',   // XXL section spacing
  32: '128px',  // Hero spacing
  
  // Semantic spacing tokens for editorial design
  micro: '4px',         // Micro adjustments
  small: '8px',         // Small gaps
  medium: '16px',       // Standard spacing
  large: '24px',        // Large spacing
  xlarge: '32px',       // Extra large spacing
  
  // Component-specific spacing
  section: '48px',      // Between major page sections
  card: '32px',         // Card internal padding
  cardGap: '24px',      // Gap between cards
  nav: '16px',          // Navigation item padding
  navGap: '4px',        // Gap between navigation items
  form: '20px',         // Form element spacing
  button: '12px',       // Button internal padding
  
  // Layout spacing
  container: '32px',    // Container padding
  gutter: '24px',       // Grid gutter
  
  // Editorial spacing for content
  paragraph: '16px',    // Between paragraphs
  heading: '24px',      // Before headings
  list: '8px',          // Between list items
  
  // Interactive element spacing
  clickTarget: '44px',  // Minimum touch target size
  focus: '2px',         // Focus outline offset
  
  // Responsive spacing multipliers
  mobile: 0.75,         // 75% of desktop spacing on mobile
  tablet: 0.875,        // 87.5% of desktop spacing on tablet
  desktop: 1            // Full spacing on desktop
}

// Spacing utility functions
export const createSpacingUtilities = () => ({
  // Margin utilities
  m: (value: keyof typeof spacing) => ({ margin: spacing[value] }),
  mt: (value: keyof typeof spacing) => ({ marginTop: spacing[value] }),
  mr: (value: keyof typeof spacing) => ({ marginRight: spacing[value] }),
  mb: (value: keyof typeof spacing) => ({ marginBottom: spacing[value] }),
  ml: (value: keyof typeof spacing) => ({ marginLeft: spacing[value] }),
  mx: (value: keyof typeof spacing) => ({ 
    marginLeft: spacing[value], 
    marginRight: spacing[value] 
  }),
  my: (value: keyof typeof spacing) => ({ 
    marginTop: spacing[value], 
    marginBottom: spacing[value] 
  }),
  
  // Padding utilities
  p: (value: keyof typeof spacing) => ({ padding: spacing[value] }),
  pt: (value: keyof typeof spacing) => ({ paddingTop: spacing[value] }),
  pr: (value: keyof typeof spacing) => ({ paddingRight: spacing[value] }),
  pb: (value: keyof typeof spacing) => ({ paddingBottom: spacing[value] }),
  pl: (value: keyof typeof spacing) => ({ paddingLeft: spacing[value] }),
  px: (value: keyof typeof spacing) => ({ 
    paddingLeft: spacing[value], 
    paddingRight: spacing[value] 
  }),
  py: (value: keyof typeof spacing) => ({ 
    paddingTop: spacing[value], 
    paddingBottom: spacing[value] 
  }),
  
  // Gap utilities for flexbox and grid
  gap: (value: keyof typeof spacing) => ({ gap: spacing[value] }),
  rowGap: (value: keyof typeof spacing) => ({ rowGap: spacing[value] }),
  columnGap: (value: keyof typeof spacing) => ({ columnGap: spacing[value] })
})

// Responsive spacing helpers
export const createResponsiveSpacing = (
  mobileValue: keyof typeof spacing,
  tabletValue?: keyof typeof spacing,
  desktopValue?: keyof typeof spacing
) => ({
  mobile: spacing[mobileValue],
  tablet: spacing[tabletValue || mobileValue],
  desktop: spacing[desktopValue || tabletValue || mobileValue]
})

// Layout composition helpers
export const layoutSpacing = {
  // Page layout
  pageContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: `0 ${spacing.container}`
  },
  
  // Section layout
  section: {
    marginBottom: spacing.section,
    '&:last-child': {
      marginBottom: 0
    }
  },
  
  // Card grid layout
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: spacing.cardGap
  },
  
  // Navigation layout
  navList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.navGap
  },
  
  // Form layout
  formGroup: {
    marginBottom: spacing.form,
    '&:last-child': {
      marginBottom: 0
    }
  }
}

// Editorial content spacing
export const contentSpacing = {
  // Typography spacing
  headlineMargin: {
    marginTop: spacing.heading,
    marginBottom: spacing.medium,
    '&:first-child': {
      marginTop: 0
    }
  },
  
  paragraphMargin: {
    marginBottom: spacing.paragraph,
    '&:last-child': {
      marginBottom: 0
    }
  },
  
  // List spacing
  listSpacing: {
    '& > li': {
      marginBottom: spacing.list,
      '&:last-child': {
        marginBottom: 0
      }
    }
  }
}

// CSS custom properties for spacing
export const spacingCSSVariables = `
  :root {
    --spacing-micro: ${spacing.micro};
    --spacing-small: ${spacing.small};
    --spacing-medium: ${spacing.medium};
    --spacing-large: ${spacing.large};
    --spacing-xlarge: ${spacing.xlarge};
    --spacing-section: ${spacing.section};
    --spacing-card: ${spacing.card};
    --spacing-card-gap: ${spacing.cardGap};
    --spacing-nav: ${spacing.nav};
    --spacing-form: ${spacing.form};
    --spacing-container: ${spacing.container};
  }
`

export default spacing