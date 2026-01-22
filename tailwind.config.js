/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}", // Captura App.tsx, index.tsx na raiz
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
            DEFAULT: '#903A40',
            hover: '#732e33',
            light: '#FDF2F3',
        },
        secondary: {
            DEFAULT: '#6797A1',
            hover: '#547D85',
            light: '#F0F7F8',
        },
        background: {
           light: '#E6E7E8',
           dark: '#1D1D27'
        },
        surface: {
           light: '#FCFCFC',
           dark: '#293141'
        },
        sidebar: '#293141',
        border: {
           light: '#DCDDDC',
           DEFAULT: '#ADBABD',
           dark: '#565259'
        },
        text: {
           main: '#1D1D27',
           secondary: '#565259',
           light: '#ADBABD'
        },
        // Cores Semânticas para Badges e Alertas
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
        sans: ['Inter', 'sans-serif'], 
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Inter', 'sans-serif']
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