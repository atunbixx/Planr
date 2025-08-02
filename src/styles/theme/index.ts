// New York Magazine Theme System
// Main theme export and configuration

import { typography } from './typography'
import { colors } from './colors'
import { spacing } from './spacing'
import { components } from './components'
import { animations } from './animations'

export interface NYMagazineTheme {
  typography: typeof typography
  colors: typeof colors
  spacing: typeof spacing
  components: typeof components
  animations: typeof animations
}

export const nyMagazineTheme: NYMagazineTheme = {
  typography,
  colors,
  spacing,
  components,
  animations
}

// CSS-in-JS helper functions
export const createThemeStyles = (theme: NYMagazineTheme) => ({
  // Typography helpers
  display: (color = theme.colors.primary) => ({
    fontFamily: theme.typography.fontFamily.serif,
    fontSize: theme.typography.fontSize.display,
    fontWeight: theme.typography.fontWeight.light,
    letterSpacing: theme.typography.letterSpacing.tight,
    lineHeight: '1.1',
    color
  }),
  
  headline: (color = theme.colors.primary) => ({
    fontFamily: theme.typography.fontFamily.serif,
    fontSize: theme.typography.fontSize.headline,
    fontWeight: theme.typography.fontWeight.light,
    letterSpacing: theme.typography.letterSpacing.tight,
    lineHeight: '1.2',
    color
  }),
  
  body: (color = theme.colors.text.primary) => ({
    fontFamily: theme.typography.fontFamily.sans,
    fontSize: theme.typography.fontSize.body,
    fontWeight: theme.typography.fontWeight.normal,
    letterSpacing: theme.typography.letterSpacing.normal,
    lineHeight: '1.6',
    color
  }),
  
  label: (color = theme.colors.text.secondary) => ({
    fontFamily: theme.typography.fontFamily.sans,
    fontSize: theme.typography.fontSize.label,
    fontWeight: theme.typography.fontWeight.medium,
    letterSpacing: theme.typography.letterSpacing.wide,
    textTransform: 'uppercase' as const,
    color
  }),
  
  // Layout helpers
  section: {
    marginBottom: theme.spacing.section
  },
  
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: theme.spacing.cardGap
  },
  
  // Component helpers
  card: theme.components.card.base,
  buttonPrimary: theme.components.button.variants.primary,
  buttonSecondary: theme.components.button.variants.secondary
})

// Utility functions
export const getThemeValue = (path: string, theme: NYMagazineTheme): any => {
  return path.split('.').reduce((obj, key) => obj?.[key], theme)
}

export const createResponsiveValue = (
  mobile: string | number,
  tablet?: string | number,
  desktop?: string | number
) => ({
  mobile,
  tablet: tablet || mobile,
  desktop: desktop || tablet || mobile
})

// Export individual theme modules
export { typography } from './typography'
export { colors } from './colors'
export { spacing } from './spacing'
export { components } from './components'
export { animations } from './animations'

// Default export
export default nyMagazineTheme