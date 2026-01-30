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
        // Design System Colors
        primary: {
            DEFAULT: '#7C3AED', // Purple 600
            hover: '#6D28D9',   // Purple 700 (Derived)
            light: '#F5F3FF',   // Purple 50 (Derived)
        },
        secondary: {
            DEFAULT: '#A78BFA', // Purple 400
            hover: '#8B5CF6',   // Purple 500 (Derived)
            light: '#EDE9FE',   // Purple 100 (Derived)
        },
        cta: {
            DEFAULT: '#F97316', // Orange 500
            hover: '#EA580C',   // Orange 600 (Derived)
        },
        background: {
           DEFAULT: '#FAF5FF',  // Purple 50
           light: '#FAF5FF',
           dark: '#1D1D27'      // Kept from old config
        },
        text: {
           DEFAULT: '#4C1D95',  // Purple 900
           main: '#4C1D95',
           secondary: '#6D28D9', // Purple 700 (Derived for contrast)
           light: '#A78BFA'      // Purple 400
        },

        // Legacy/Support Colors (kept for compatibility but shifted to theme)
        surface: {
           light: '#FFFFFF',
           dark: '#293141'
        },
        sidebar: '#1E1B4B',     // Purple 950 (Darker for sidebar)
        border: {
           light: '#E9D5FF',    // Purple 200
           DEFAULT: '#C084FC',  // Purple 400
           dark: '#4C1D95'      // Purple 900
        },

        // Cores Semânticas (Standard Tailwind Palette usually fine, but keeping custom)
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
            DEFAULT: '#3B82F6',
            bg: '#EFF6FF',
            text: '#1D4ED8'
        }
      },
      fontFamily: { 
        sans: ['Exo', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
        display: ['Exo', 'sans-serif']
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
        'md': '0 4px 6px rgba(0,0,0,0.1)',
        'lg': '0 10px 15px rgba(0,0,0,0.1)',
        'xl': '0 20px 25px rgba(0,0,0,0.15)',
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
