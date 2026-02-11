/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Soft Modern / Clean SaaS Palette
        primary: {
            DEFAULT: '#005a7e', // Deep Blue
            hover: '#004a66',
            light: '#E0F2F7',
            foreground: '#FFFFFF'
        },
        secondary: {
            DEFAULT: '#96b400', // Olive/Lime
            hover: '#7a9400',
            light: '#F4F9CC',
            foreground: '#FFFFFF'
        },
        accent: {
            DEFAULT: '#ff681a', // Orange Red
            hover: '#e65000',
            light: '#FFF0E6'
        },
        cta: {
            DEFAULT: '#ff681a', // Orange Red
            hover: '#e65000',
        },
        background: {
           DEFAULT: '#F9FAFB',  // Light Gray (Cool)
           light: '#FFFFFF',
           dark: '#111827'      // Gray 900
        },
        surface: {
           DEFAULT: '#FFFFFF',  // White for cards
           light: '#FFFFFF',
           dark: '#1F2937'      // Gray 800
        },
        text: {
           DEFAULT: '#1F2937',  // Gray 800
           main: '#111827',     // Gray 900
           secondary: '#4B5563', // Gray 600
           light: '#9CA3AF',     // Gray 400
           inverse: '#FFFFFF'
        },
        sidebar: {
            DEFAULT: '#1A1C1E', // Deep Charcoal/Gunmetal
            hover: '#2C2E33',
            active: '#2C2E33',
            border: '#2C2E33'
        },
        border: {
           light: '#E5E7EB',    // Gray 200
           DEFAULT: '#D1D5DB',  // Gray 300
           dark: '#374151'      // Gray 700
        },

        // Semantic Colors
        success: {
            DEFAULT: '#10B981', // Emerald 500
            bg: '#ECFDF5',
            text: '#065F46'
        },
        warning: {
            DEFAULT: '#F59E0B', // Amber 500
            bg: '#FFFBEB',
            text: '#92400E'
        },
        danger: {
            DEFAULT: '#EF4444', // Red 500
            bg: '#FEF2F2',
            text: '#991B1B'
        },
        info: {
            DEFAULT: '#3B82F6', // Blue 500
            bg: '#EFF6FF',
            text: '#1E40AF'
        }
      },
      fontFamily: { 
        sans: ['"Inter"', '"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Roboto Mono"', 'monospace'],
        display: ['"Space Grotesk"', 'sans-serif']
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      boxShadow: {
        'none': 'none',
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'soft': '0 8px 30px rgba(0,0,0,0.04)', // Added for subtle depth
        'soft-lg': '0 15px 40px rgba(0,0,0,0.08)', // Added for deeper elements
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        'DEFAULT': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-left': 'slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
