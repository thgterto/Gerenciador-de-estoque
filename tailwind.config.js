/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Orbital Theme - Using CSS Variables for Light/Dark mode
        orbital: {
            bg: 'var(--color-orbital-bg)',
            surface: 'var(--color-orbital-surface)',
            border: 'var(--color-orbital-border)',
            accent: 'var(--color-orbital-accent)',
            hover: 'var(--color-orbital-hover)',
            text: 'var(--color-orbital-text)',
            subtext: 'var(--color-orbital-subtext)',
            success: 'var(--color-orbital-success)',
            warning: 'var(--color-orbital-warning)',
            danger: 'var(--color-orbital-danger)',
        },
        // Legacy Support (Mapping to Orbital)
        primary: {
            DEFAULT: 'var(--color-orbital-accent)',
            hover: 'var(--color-orbital-hover)',
            light: '#22d3ee',
            foreground: 'var(--color-orbital-bg)'
        },
        secondary: {
            DEFAULT: 'var(--color-orbital-subtext)',
            hover: '#71717a',
            light: '#d4d4d8',
            foreground: 'var(--color-orbital-bg)'
        },
        background: {
           DEFAULT: 'var(--color-orbital-bg)',
           light: '#f8fafc',
           dark: '#09090b'
        },
        surface: {
           DEFAULT: 'var(--color-orbital-surface)',
           light: '#ffffff',
           dark: '#18181b'
        },
        border: {
           DEFAULT: 'var(--color-orbital-border)',
           light: '#e2e8f0',
           dark: '#27272a'
        }
      },
      fontFamily: { 
        sans: ['"Inter"', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'none': '0',
        'sm': '0', // Force sharp
        'DEFAULT': '0', // Force sharp
        'md': '0', // Force sharp
        'lg': '0', // Force sharp
        'xl': '0', // Force sharp
        '2xl': '0', // Force sharp
        '3xl': '0', // Force sharp
        'full': '9999px', // Keep pill shape for badges/avatars
      },
      boxShadow: {
        'glow': '0 0 15px rgba(6, 182, 212, 0.3)',
        'glow-sm': '0 0 8px rgba(6, 182, 212, 0.2)',
        'glow-lg': '0 0 25px rgba(6, 182, 212, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scanline: {
            '0%': { transform: 'translateY(-100%)' },
            '100%': { transform: 'translateY(100%)' }
        }
      }
    },
  },
  plugins: [],
}
