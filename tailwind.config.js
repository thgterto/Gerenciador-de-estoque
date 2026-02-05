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
        // Maestro Design System - High Contrast / Brutalist
        primary: {
            DEFAULT: '#CCFF00', // Acid Green
            hover: '#B3E600',   // Slightly darker acid green
            light: '#ECFCCB',   // Lime 100
            foreground: '#000000' // Text on primary
        },
        secondary: {
            DEFAULT: '#FF4500', // Signal Orange
            hover: '#CC3700',
            light: '#FFEDD5',
            foreground: '#FFFFFF'
        },
        cta: {
            DEFAULT: '#FF4500', // Signal Orange
            hover: '#CC3700',
        },
        background: {
           DEFAULT: '#F5F5F5',  // Neutral 100
           light: '#FFFFFF',
           dark: '#0A0A0A'      // Nearly Black
        },
        surface: {
           light: '#FFFFFF',
           dark: '#171717'      // Neutral 900
        },
        text: {
           DEFAULT: '#0A0A0A',  // Neutral 950
           main: '#0A0A0A',
           secondary: '#525252', // Neutral 600
           light: '#A3A3A3',     // Neutral 400
           inverse: '#FFFFFF'
        },
        sidebar: '#000000',     // Black

        border: {
           light: '#E5E5E5',    // Neutral 200
           DEFAULT: '#000000',  // Raw Black Border
           dark: '#FFFFFF'      // Raw White Border (for dark mode)
        },

        // Semantic Colors
        success: {
            DEFAULT: '#00CC00', // Sharp Green
            bg: '#F0FDF4',
            text: '#006600'
        },
        warning: {
            DEFAULT: '#FFCC00', // Sharp Yellow
            bg: '#FEFCE8',
            text: '#854D0E'
        },
        danger: {
            DEFAULT: '#8B0000', // Deep Red
            bg: '#FEF2F2',
            text: '#8B0000'
        },
        info: {
            DEFAULT: '#0000FF', // Pure Blue
            bg: '#EFF6FF',
            text: '#0000CC'
        }
      },
      fontFamily: { 
        sans: ['"Space Grotesk"', 'Exo', 'sans-serif'],
        mono: ['"Roboto Mono"', 'monospace'],
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
        'sm': '2px 2px 0px 0px rgba(0,0,0,1)', // Hard Shadow
        'md': '4px 4px 0px 0px rgba(0,0,0,1)', // Hard Shadow
        'lg': '6px 6px 0px 0px rgba(0,0,0,1)', // Hard Shadow
        'xl': '8px 8px 0px 0px rgba(0,0,0,1)', // Hard Shadow
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out forwards', // Faster
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards', // Snappier
        'slide-left': 'slideLeft 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
