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
        // Precision Brutalist Palette
        primary: {
            DEFAULT: '#1e293b', // Deep Technical Slate
            hover: '#334155',
            light: '#f1f5f9',
            foreground: '#FFFFFF'
        },
        secondary: {
            DEFAULT: '#FF4500', // International Orange
            hover: '#cc3700',
            light: '#ffe0d6',
            foreground: '#FFFFFF'
        },
        accent: {
            DEFAULT: '#FF4500',
            hover: '#cc3700',
        },
        background: {
           DEFAULT: '#f1f5f9',  // Slate 100
           light: '#FFFFFF',
           dark: '#0f172a'      // Slate 900
        },
        surface: {
           DEFAULT: '#FFFFFF',
           dark: '#1e293b'      // Slate 800
        },
        text: {
           DEFAULT: '#0f172a',  // Slate 900
           secondary: '#475569', // Slate 600
           light: '#94a3b8',     // Slate 400
           inverse: '#FFFFFF'
        },
        border: {
           light: '#e2e8f0',    // Slate 200
           DEFAULT: '#cbd5e1',  // Slate 300
           dark: '#334155'      // Slate 700
        },
      },
      fontFamily: { 
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Space Grotesk"', 'sans-serif']
      },
      borderRadius: {
        'none': '0',
        'sm': '0px',
        'DEFAULT': '0px', // Sharp by default
        'md': '2px', // Very slight rounding for some elements
        'lg': '4px',
        'xl': '8px',
        'full': '9999px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
