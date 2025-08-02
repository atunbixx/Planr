# New York Magazine Theme System - Design Document

## Overview

The New York Magazine Theme System provides a comprehensive design language that brings editorial sophistication to the wedding planner application. The system is built around the principles of premium publishing design, emphasizing typography, white space, and refined aesthetics.

## Architecture

### Theme Structure
```
src/
├── styles/
│   ├── theme/
│   │   ├── index.ts              # Main theme export
│   │   ├── typography.ts         # Font definitions and scales
│   │   ├── colors.ts            # Color palette and semantic tokens
│   │   ├── spacing.ts           # Spacing scale and layout utilities
│   │   ├── components.ts        # Component style definitions
│   │   └── animations.ts        # Transition and animation presets
│   ├── components/
│   │   ├── Card.ts              # Card component styles
│   │   ├── Button.ts            # Button component styles
│   │   ├── Navigation.ts        # Navigation component styles
│   │   └── Forms.ts             # Form component styles
│   └── globals.css              # Global styles and CSS variables
```

### Component Architecture
The theme system uses a layered approach:
1. **Base Layer**: CSS variables and global styles
2. **Token Layer**: Semantic design tokens (colors, spacing, typography)
3. **Component Layer**: Reusable component styles
4. **Utility Layer**: Helper functions and mixins

## Components and Interfaces

### Typography System

#### Font Families
```typescript
export const typography = {
  fontFamily: {
    serif: '"Times New Roman", Times, serif',
    sans: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    mono: '"SF Mono", Monaco, "Cascadia Code", monospace'
  },
  fontSize: {
    display: '48px',      // Main headlines
    headline: '28px',     // Section headers
    title: '20px',        // Card titles
    body: '16px',         // Body text
    caption: '14px',      // Secondary text
    label: '12px',        // Form labels
    micro: '10px'         // Micro text
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  letterSpacing: {
    tight: '-0.02em',     // Headlines
    normal: '0',          // Body text
    wide: '0.5px',        // Uppercase labels
    wider: '1px'          // Micro labels
  }
}
```

#### Typography Utilities
```typescript
export const createTypographyStyle = (variant: TypographyVariant) => {
  const styles = {
    display: {
      fontFamily: typography.fontFamily.serif,
      fontSize: typography.fontSize.display,
      fontWeight: typography.fontWeight.light,
      letterSpacing: typography.letterSpacing.tight,
      lineHeight: '1.1'
    },
    headline: {
      fontFamily: typography.fontFamily.serif,
      fontSize: typography.fontSize.headline,
      fontWeight: typography.fontWeight.light,
      letterSpacing: typography.letterSpacing.tight,
      lineHeight: '1.2'
    },
    // ... other variants
  }
  return styles[variant]
}
```

### Color System

#### Core Palette
```typescript
export const colors = {
  // Primary colors
  black: '#000000',
  white: '#ffffff',
  
  // Gray scale
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e8e8e8',
    300: '#cccccc',
    400: '#999999',
    500: '#666666',
    600: '#333333',
    700: '#222222',
    800: '#111111',
    900: '#000000'
  },
  
  // Semantic colors
  primary: '#000000',
  secondary: '#666666',
  accent: '#000000',
  
  // State colors
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
  info: '#0284c7'
}
```

#### Color Utilities
```typescript
export const createColorUtilities = () => ({
  text: {
    primary: colors.black,
    secondary: colors.gray[500],
    muted: colors.gray[400],
    inverse: colors.white
  },
  background: {
    primary: colors.white,
    secondary: colors.gray[50],
    dark: colors.black,
    overlay: 'rgba(0, 0, 0, 0.05)'
  },
  border: {
    light: colors.gray[200],
    medium: colors.gray[300],
    dark: colors.gray[600]
  }
})
```

### Spacing System

```typescript
export const spacing = {
  // Base spacing scale (4px base unit)
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  
  // Semantic spacing
  section: '48px',      // Between major sections
  card: '32px',         // Card internal padding
  cardGap: '24px',      // Between cards
  nav: '16px',          // Navigation padding
  form: '20px'          // Form element spacing
}
```

### Component Styles

#### Card Component
```typescript
export const cardStyles = {
  base: {
    backgroundColor: colors.white,
    borderRadius: '2px',
    border: `1px solid ${colors.gray[200]}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden'
  },
  accent: {
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '2px',
      background: `linear-gradient(90deg, ${colors.black} 0%, ${colors.gray[600]} 100%)`
    }
  },
  header: {
    padding: `${spacing[8]} ${spacing[8]} ${spacing[4]} ${spacing[8]}`,
    borderBottom: `1px solid ${colors.gray[100]}`
  },
  content: {
    padding: `${spacing[6]} ${spacing[8]} ${spacing[8]} ${spacing[8]}`
  }
}
```

#### Button Component
```typescript
export const buttonStyles = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0px',
    fontFamily: typography.fontFamily.sans,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '2px solid transparent',
    cursor: 'pointer',
    textDecoration: 'none'
  },
  variants: {
    primary: {
      backgroundColor: colors.black,
      color: colors.white,
      borderColor: colors.black,
      '&:hover': {
        backgroundColor: colors.gray[800]
      }
    },
    secondary: {
      backgroundColor: 'transparent',
      color: colors.black,
      borderColor: colors.black,
      '&:hover': {
        backgroundColor: colors.gray[50]
      }
    }
  },
  sizes: {
    sm: {
      padding: `${spacing[2]} ${spacing[5]}`,
      fontSize: typography.fontSize.micro
    },
    md: {
      padding: `${spacing[3]} ${spacing[6]}`,
      fontSize: typography.fontSize.label
    },
    lg: {
      padding: `${spacing[4]} ${spacing[8]}`,
      fontSize: typography.fontSize.caption
    }
  }
}
```

## Data Models

### Theme Configuration
```typescript
interface ThemeConfig {
  typography: TypographyConfig
  colors: ColorConfig
  spacing: SpacingConfig
  components: ComponentConfig
  animations: AnimationConfig
}

interface TypographyConfig {
  fontFamily: FontFamilyScale
  fontSize: FontSizeScale
  fontWeight: FontWeightScale
  letterSpacing: LetterSpacingScale
  lineHeight: LineHeightScale
}

interface ColorConfig {
  primary: ColorPalette
  semantic: SemanticColors
  state: StateColors
  utilities: ColorUtilities
}

interface ComponentConfig {
  card: ComponentStyles
  button: ComponentStyles
  navigation: ComponentStyles
  form: ComponentStyles
}
```

### Component Style Interface
```typescript
interface ComponentStyles {
  base: CSSProperties
  variants?: Record<string, CSSProperties>
  sizes?: Record<string, CSSProperties>
  states?: Record<string, CSSProperties>
}
```

## Error Handling

### Theme Loading
- Graceful fallbacks for missing theme values
- Default styles when theme is not available
- Error boundaries for theme-related failures

### Component Rendering
- Fallback styles for unsupported variants
- Graceful degradation for missing properties
- Console warnings for development debugging

## Testing Strategy

### Unit Tests
- Theme utility functions
- Color and spacing calculations
- Typography scale generation
- Component style generation

### Integration Tests
- Theme provider functionality
- Component style application
- Cross-browser compatibility
- Performance impact measurement

### Visual Regression Tests
- Component appearance consistency
- Typography rendering across browsers
- Color accuracy and contrast ratios
- Layout stability across screen sizes

## Implementation Notes

### CSS-in-JS Integration
The theme system supports both CSS-in-JS solutions and traditional CSS approaches:

```typescript
// CSS-in-JS usage
const StyledCard = styled.div`
  ${cardStyles.base}
  ${cardStyles.accent}
`

// Inline styles usage
const cardStyle = {
  ...cardStyles.base,
  ...cardStyles.accent
}
```

### CSS Variables
Global CSS variables provide runtime theme switching capability:

```css
:root {
  --color-primary: #000000;
  --color-secondary: #666666;
  --font-serif: "Times New Roman", Times, serif;
  --font-sans: "Helvetica Neue", Helvetica, Arial, sans-serif;
  --spacing-section: 48px;
  --spacing-card: 32px;
}
```

### Performance Considerations
- Lazy loading of theme modules
- CSS bundle optimization
- Runtime style calculation minimization
- Efficient re-rendering strategies