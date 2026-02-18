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
        // Orbital Theme
        orbital: {
            bg: '#09090b',      // Deepest background (Zinc 950)
            surface: '#18181b', // Card background (Zinc 900)
            border: '#27272a',  // Borders (Zinc 800)
            accent: '#06b6d4',  // Cyan 500 (Primary Action)
            hover: '#0891b2',   // Cyan 600
            text: '#f4f4f5',    // Primary Text (Zinc 100)
            subtext: '#a1a1aa', // Secondary Text (Zinc 400)
            success: '#10b981', // Emerald 500
            warning: '#f59e0b', // Amber 500
            danger: '#ef4444',  // Red 500
        },
        // Legacy Support (Mapping to Orbital)
        primary: {
            DEFAULT: '#06b6d4',
            hover: '#0891b2',
            light: '#22d3ee',
            foreground: '#09090b'
        },
        secondary: {
            DEFAULT: '#a1a1aa',
            hover: '#71717a',
            light: '#d4d4d8',
            foreground: '#09090b'
        },
        background: {
           DEFAULT: '#09090b',
           light: '#ffffff', // For legacy light mode if needed, but we focus on dark orbital
           dark: '#09090b'
        },
        surface: {
           DEFAULT: '#18181b',
           light: '#f4f4f5',
           dark: '#18181b'
        },
        border: {
           DEFAULT: '#27272a',
           light: '#e4e4e7',
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
