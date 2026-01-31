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
        // Revamped Design System - "Scientific Teal" Theme
        primary: {
            DEFAULT: '#0D9488', // Teal 600
            hover: '#0F766E',   // Teal 700
            light: '#F0FDFA',   // Teal 50
        },
        secondary: {
            DEFAULT: '#2DD4BF', // Teal 400
            hover: '#14B8A6',   // Teal 500
            light: '#CCFBF1',   // Teal 100
        },
        cta: {
            DEFAULT: '#F97316', // Orange 500 (Kept for contrast)
            hover: '#EA580C',   // Orange 600
        },
        background: {
           DEFAULT: '#F8FAFC',  // Slate 50 (Clean professional background)
           light: '#FFFFFF',
           dark: '#0F172A'      // Slate 900
        },
        text: {
           DEFAULT: '#0F172A',  // Slate 900
           main: '#0F172A',
           secondary: '#334155', // Slate 700
           light: '#94A3B8'      // Slate 400
        },

        // Legacy/Support Colors
        surface: {
           light: '#FFFFFF',
           dark: '#1E293B'      // Slate 800
        },
        sidebar: '#0F172A',     // Slate 900
        border: {
           light: '#E2E8F0',    // Slate 200
           DEFAULT: '#CBD5E1',  // Slate 300
           dark: '#475569'      // Slate 600
        },

        // Semantic Colors
        success: {
            DEFAULT: '#10B981',
            bg: '#ECFDF5',
            text: '#047857'
        },
        warning: {
            DEFAULT: '#F59E0B',
            bg: '#FFFBEB',
            text: '#B45309'
        },
        danger: {
            DEFAULT: '#EF4444',
            bg: '#FEF2F2',
            text: '#B91C1C'
        },
        info: {
            DEFAULT: '#0EA5E9', // Sky 500
            bg: '#F0F9FF',
            text: '#0369A1'
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
        'sm': '0 1px 2px rgba(0,0,0,0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'slide-left': 'slideLeft 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(15px)' },
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
