import type { Config } from 'tailwindcss'
import { designSystem } from './src/styles/design-system'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Typography from New York Magazine design system
      fontFamily: {
        serif: designSystem.typography.fontFamily.serif.split(', '),
        sans: designSystem.typography.fontFamily.sans.split(', '),
        mono: designSystem.typography.fontFamily.mono.split(', '),
        'playfair': ['Playfair Display', 'serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      fontSize: designSystem.typography.fontSize,
      fontWeight: designSystem.typography.fontWeight,
      lineHeight: designSystem.typography.lineHeight,
      letterSpacing: designSystem.typography.letterSpacing,

      // Colors from design system
      colors: {
        ink: designSystem.colors.ink,
        paper: designSystem.colors.paper,
        accent: designSystem.colors.accent,
        gray: designSystem.colors.gray,
        // Wedding colors - individual entries for Tailwind class generation
        'wedding-gold': designSystem.colors.wedding.gold,
        'wedding-blush': designSystem.colors.wedding.blush,
        'wedding-sage': designSystem.colors.wedding.sage,
        'wedding-navy': designSystem.colors.wedding.navy,
        'wedding-cream': designSystem.colors.wedding.cream,
        wedding: designSystem.colors.wedding,
        // Override default Tailwind colors with our semantic colors
        green: {
          500: designSystem.colors.success,
        },
        yellow: {
          500: designSystem.colors.warning,
        },
        red: {
          500: designSystem.colors.error,
        },
        blue: {
          500: designSystem.colors.info,
        },
      },

      // Spacing system
      spacing: designSystem.spacing,

      // Border radius
      borderRadius: designSystem.borderRadius,

      // Box shadows
      boxShadow: designSystem.boxShadow,

      // Animation
      transitionDuration: designSystem.animation.duration,
      transitionTimingFunction: designSystem.animation.easing,

      // Layout
      maxWidth: {
        container: designSystem.layout.container.maxWidth,
      },

      // Breakpoints
      screens: designSystem.breakpoints,
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}

export default config