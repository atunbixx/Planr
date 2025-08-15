/**
 * Wedding Theme Configuration
 * Consistent design system based on the overview page styling
 */

export const weddingTheme = {
  // Color Palette
  colors: {
    // Background colors
    background: {
      primary: '#faf9f7', // Warm off-white background
      secondary: '#ffffff', // Card backgrounds
      muted: '#f9fafb', // Subtle backgrounds
    },
    
    // Brand colors
    sage: {
      DEFAULT: '#7a9b7f', // Primary sage green
      hover: '#6a8b6f', // Darker sage for hover
      light: '#8aab8f', // Lighter sage
      dark: '#5a7b5f', // Darker sage
    },
    
    brown: {
      DEFAULT: '#5a524a', // Primary brown
      hover: '#4a423a', // Darker brown for hover
      light: '#6a625a', // Lighter brown
      dark: '#3a322a', // Darker brown
    },
    
    // Text colors
    text: {
      primary: '#111827', // gray-900
      secondary: '#4b5563', // gray-600
      muted: '#6b7280', // gray-500
      light: '#9ca3af', // gray-400
    },
    
    // Status colors
    status: {
      success: '#7a9b7f', // Sage green for success
      warning: '#d97706', // Amber for warnings
      error: '#dc2626', // Red for errors
      info: '#3b82f6', // Blue for info
    },
    
    // Border and divider colors
    border: {
      DEFAULT: '#e5e7eb', // gray-200
      light: '#f3f4f6', // gray-100
      dark: '#d1d5db', // gray-300
    }
  },
  
  // Typography
  typography: {
    // Font families
    fonts: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      heading: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
    },
    
    // Font sizes with line heights
    sizes: {
      // Headers - Light weight, uppercase, wide tracking
      hero: {
        size: 'text-6xl', // 60px
        weight: 'font-light',
        tracking: 'tracking-wide',
        transform: 'uppercase',
      },
      h1: {
        size: 'text-5xl', // 48px
        weight: 'font-light',
        tracking: 'tracking-wide',
        transform: 'uppercase',
      },
      h2: {
        size: 'text-4xl', // 36px
        weight: 'font-light',
        tracking: 'tracking-wide',
        transform: 'uppercase',
      },
      h3: {
        size: 'text-2xl', // 24px
        weight: 'font-light',
        tracking: 'tracking-wide',
        transform: 'uppercase',
      },
      
      // Section headers - Small, uppercase, extra wide tracking
      sectionHeader: {
        size: 'text-xs',
        weight: 'font-medium',
        tracking: 'tracking-[0.2em]',
        transform: 'uppercase',
      },
      
      // Body text - Light weight
      body: {
        size: 'text-base',
        weight: 'font-light',
      },
      bodyLarge: {
        size: 'text-lg',
        weight: 'font-light',
      },
      bodySmall: {
        size: 'text-sm',
        weight: 'font-light',
      },
      
      // Metrics - Large numbers
      metric: {
        size: 'text-4xl',
        weight: 'font-light',
      },
      metricLarge: {
        size: 'text-5xl',
        weight: 'font-light',
      },
      metricSmall: {
        size: 'text-3xl',
        weight: 'font-light',
      },
    }
  },
  
  // Spacing System
  spacing: {
    page: {
      x: 'px-4 sm:px-6 lg:px-8', // Responsive page padding
      y: 'py-6 sm:py-8 lg:py-12', // Responsive vertical padding
      container: 'px-8 py-12', // Standard container padding
    },
    
    card: {
      sm: 'p-4 sm:p-6 lg:p-8', // Small card padding
      md: 'p-4 sm:p-8 lg:p-12', // Medium card padding
      lg: 'p-8 sm:p-12 lg:p-16', // Large card padding
    },
    
    section: {
      sm: 'mb-4 sm:mb-6 lg:mb-8', // Small section margin
      md: 'mb-6 sm:mb-8 lg:mb-12', // Medium section margin
      lg: 'mb-8 sm:mb-12 lg:mb-16', // Large section margin
    },
    
    gap: {
      sm: 'gap-3 sm:gap-4 lg:gap-6', // Small gap
      md: 'gap-4 sm:gap-6 lg:gap-8', // Medium gap
      lg: 'gap-6 sm:gap-8 lg:gap-12', // Large gap
    }
  },
  
  // Component Styles
  components: {
    // Card styles
    card: {
      base: 'bg-white rounded-sm shadow-sm',
      hover: 'hover:shadow-md transition-shadow',
      padding: 'p-4 sm:p-6 lg:p-8',
    },
    
    // Button styles
    button: {
      // Primary button (sage green)
      primary: 'bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white rounded-sm font-light tracking-wider uppercase',
      
      // Secondary button (brown outline)
      secondary: 'border-[#5a524a] text-[#5a524a] hover:bg-[#5a524a] hover:text-white rounded-sm font-light tracking-wider uppercase',
      
      // Ghost button
      ghost: 'text-[#7a9b7f] hover:bg-gray-50 rounded-sm font-light tracking-wider uppercase',
      
      // Link button
      link: 'text-[#7a9b7f] font-light hover:underline',
      
      // Sizes
      sizes: {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-xs sm:text-sm',
        lg: 'px-6 sm:px-8 lg:px-10 py-3 sm:py-4 text-sm sm:text-base',
      }
    },
    
    // Progress bar styles
    progress: {
      bar: 'h-1 bg-gray-100',
      fill: 'bg-[#7a9b7f]',
    },
    
    // Input styles
    input: {
      base: 'border-gray-200 rounded-sm font-light focus:border-[#7a9b7f] focus:ring-[#7a9b7f]',
    },
    
    // Badge/Tag styles
    badge: {
      success: 'bg-[#7a9b7f]/10 text-[#7a9b7f]',
      warning: 'bg-amber-50 text-amber-600',
      error: 'bg-red-50 text-red-600',
      info: 'bg-blue-50 text-blue-600',
      neutral: 'bg-gray-100 text-gray-600',
    }
  },
  
  // Utility classes for consistent styling
  utilities: {
    // Headers
    heroHeader: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-wide text-gray-900 uppercase',
    pageHeader: 'text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide text-gray-900 uppercase',
    sectionHeader: 'text-xs font-medium tracking-[0.2em] text-gray-500 uppercase',
    
    // Text
    bodyText: 'text-sm sm:text-base font-light text-gray-600',
    mutedText: 'text-sm font-light text-gray-500',
    
    // Containers
    pageContainer: 'min-h-screen bg-[#faf9f7] w-full',
    contentContainer: 'w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12',
    
    // Cards
    statCard: 'bg-white p-4 sm:p-6 lg:p-8 rounded-sm shadow-sm text-center hover:shadow-md transition-shadow',
    contentCard: 'bg-white p-4 sm:p-8 lg:p-12 rounded-sm shadow-sm',
  }
}

// Export individual parts for easier access
export const colors = weddingTheme.colors
export const typography = weddingTheme.typography
export const spacing = weddingTheme.spacing
export const components = weddingTheme.components
export const utilities = weddingTheme.utilities

// Helper function to apply theme classes
export const themeClasses = {
  heroHeader: () => utilities.heroHeader,
  pageHeader: () => utilities.pageHeader,
  sectionHeader: () => utilities.sectionHeader,
  bodyText: () => utilities.bodyText,
  mutedText: () => utilities.mutedText,
  pageContainer: () => utilities.pageContainer,
  contentContainer: () => utilities.contentContainer,
  statCard: () => utilities.statCard,
  contentCard: () => utilities.contentCard,
  
  button: (variant: 'primary' | 'secondary' | 'ghost' | 'link' = 'primary', size: 'sm' | 'md' | 'lg' = 'md') => {
    return `${components.button[variant]} ${components.button.sizes[size]}`
  },
  
  card: (hover = true) => {
    return hover ? `${components.card.base} ${components.card.hover}` : components.card.base
  },
  
  badge: (status: 'success' | 'warning' | 'error' | 'info' | 'neutral' = 'neutral') => {
    return components.badge[status]
  }
}