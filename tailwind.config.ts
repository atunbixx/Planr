import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        luxury: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Wedding theme colors
        wedding: {
          background: {
            primary: '#faf9f7',
            secondary: '#ffffff',
            muted: '#f9fafb',
          },
          sage: {
            DEFAULT: '#7a9b7f',
            hover: '#6a8b6f',
            light: '#8aab8f',
            dark: '#5a7b5f',
          },
          brown: {
            DEFAULT: '#5a524a',
            hover: '#4a423a',
            light: '#6a625a',
            dark: '#3a322a',
          },
        },
        
        // Existing theme colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'luxury-sm': 'var(--luxury-border-radius-sm)',
        'luxury': 'var(--luxury-border-radius)',
        'luxury-md': 'var(--luxury-border-radius-md)',
        'luxury-lg': 'var(--luxury-border-radius-lg)',
        'luxury-xl': 'var(--luxury-border-radius-xl)',
      },
      spacing: {
        'luxury-xs': 'var(--luxury-spacing-xs)',
        'luxury-sm': 'var(--luxury-spacing-sm)',
        'luxury-md': 'var(--luxury-spacing-md)',
        'luxury-lg': 'var(--luxury-spacing-lg)',
        'luxury-xl': 'var(--luxury-spacing-xl)',
        'luxury-2xl': 'var(--luxury-spacing-2xl)',
      },
      boxShadow: {
        'luxury-sm': 'var(--luxury-shadow-sm)',
        'luxury': 'var(--luxury-shadow)',
        'luxury-md': 'var(--luxury-shadow-md)',
        'luxury-lg': 'var(--luxury-shadow-lg)',
        'luxury-xl': 'var(--luxury-shadow-xl)',
      },
      backgroundImage: {
        'luxury-gradient-primary': 'var(--luxury-gradient-primary)',
        'luxury-gradient-secondary': 'var(--luxury-gradient-secondary)',
        'luxury-gradient-card': 'var(--luxury-gradient-card)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "luxury-fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "luxury-scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "luxury-fade-in": "luxury-fade-in 0.3s ease-out",
        "luxury-scale-in": "luxury-scale-in 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config