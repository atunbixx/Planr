// Animation System - New York Magazine Theme
// Sophisticated, subtle animations that enhance the editorial experience

export const animations = {
  // Timing functions - sophisticated easing curves
  easing: {
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',      // Smooth, natural feeling
    snappy: 'cubic-bezier(0.4, 0, 0.6, 1)',      // Quick, responsive
    gentle: 'cubic-bezier(0.25, 0.1, 0.25, 1)',  // Very gentle, elegant
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Subtle bounce
    linear: 'linear'                               // Linear for specific cases
  },
  
  // Duration scale - editorial pacing
  duration: {
    instant: '0ms',      // Immediate
    fast: '150ms',       // Quick feedback
    normal: '200ms',     // Standard interactions
    slow: '300ms',       // Deliberate transitions
    slower: '500ms',     // Dramatic effects
    slowest: '800ms'     // Hero animations
  },
  
  // Common animation presets
  smooth: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  gentle: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
  snappy: 'all 0.15s cubic-bezier(0.4, 0, 0.6, 1)',
  
  // Specific property animations
  transform: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  opacity: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  colors: 'color 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Interactive element animations
  hover: {
    card: {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    
    button: {
      transform: 'translateY(-1px)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    
    navigation: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },
  
  // Focus animations for accessibility
  focus: {
    outline: {
      boxShadow: '0 0 0 4px rgba(0, 0, 0, 0.1)',
      transition: 'box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    
    input: {
      borderColor: '#000000',
      boxShadow: '0 0 0 4px rgba(0, 0, 0, 0.1)',
      transition: 'border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },
  
  // Loading animations
  loading: {
    spin: {
      animation: 'spin 1s linear infinite'
    },
    
    pulse: {
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    },
    
    fade: {
      animation: 'fade 1.5s ease-in-out infinite alternate'
    }
  },
  
  // Page transition animations
  pageTransition: {
    fadeIn: {
      opacity: 0,
      animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards'
    },
    
    slideUp: {
      transform: 'translateY(20px)',
      opacity: 0,
      animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards'
    }
  },
  
  // Micro-interactions
  microInteractions: {
    buttonPress: {
      transform: 'translateY(1px)',
      transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.6, 1)'
    },
    
    cardPress: {
      transform: 'scale(0.98)',
      transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.6, 1)'
    },
    
    iconBounce: {
      transform: 'scale(1.1)',
      transition: 'transform 0.15s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  }
}

// Keyframe animations
export const keyframes = `
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  @keyframes fade {
    0% {
      opacity: 0.4;
    }
    100% {
      opacity: 1;
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes slideInFromTop {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes slideInFromBottom {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`

// Animation utility functions
export const createAnimation = (
  property: string,
  duration: keyof typeof animations.duration,
  easing: keyof typeof animations.easing = 'smooth'
) => {
  return `${property} ${animations.duration[duration]} ${animations.easing[easing]}`
}

export const createHoverAnimation = (
  transform?: string,
  duration: keyof typeof animations.duration = 'normal'
) => ({
  transition: `all ${animations.duration[duration]} ${animations.easing.smooth}`,
  '&:hover': {
    transform: transform || 'translateY(-2px)'
  }
})

// Reduced motion support for accessibility
export const reducedMotion = `
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`

// CSS custom properties for animations
export const animationCSSVariables = `
  :root {
    --animation-smooth: ${animations.smooth};
    --animation-gentle: ${animations.gentle};
    --animation-snappy: ${animations.snappy};
    --duration-fast: ${animations.duration.fast};
    --duration-normal: ${animations.duration.normal};
    --duration-slow: ${animations.duration.slow};
    --easing-smooth: ${animations.easing.smooth};
    --easing-gentle: ${animations.easing.gentle};
    --easing-snappy: ${animations.easing.snappy};
  }
`

export default animations