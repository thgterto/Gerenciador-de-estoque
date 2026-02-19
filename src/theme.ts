import { PaletteMode } from '@mui/material';
import { ThemeOptions } from '@mui/material/styles';

export const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode values matching tailwind.config.js
          primary: {
            main: '#005a7e', // Deep Blue
            light: '#E0F2F7',
            contrastText: '#FFFFFF',
          },
          secondary: {
            main: '#96b400', // Olive/Lime
            light: '#F4F9CC',
            contrastText: '#FFFFFF',
          },
          error: {
            main: '#EF4444', // Red 500
          },
          warning: {
            main: '#F59E0B', // Amber 500
          },
          info: {
            main: '#3B82F6', // Blue 500
          },
          success: {
            main: '#10B981', // Emerald 500
          },
          background: {
             default: '#F9FAFB', // Cool Gray
             paper: '#FFFFFF',
          },
          text: {
            primary: '#111827', // Gray 900
            secondary: '#4B5563', // Gray 600
          }
        }
      : {
          // Dark mode values matching tailwind.config.js
          primary: {
            main: '#005a7e', // Deep Blue (consistent)
            light: '#004a66',
            contrastText: '#FFFFFF',
          },
          secondary: {
            main: '#96b400',
            light: '#7a9400',
            contrastText: '#FFFFFF',
          },
          background: {
            default: '#111827', // Gray 900
            paper: '#1F2937',   // Gray 800
          },
          text: {
            primary: '#F3F4F6', // Gray 100
            secondary: '#9CA3AF', // Gray 400
          },
        }),
  },
  typography: {
    fontFamily: '"Inter", "Space Grotesk", sans-serif',
    h1: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
    },
    h3: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 500,
    },
    h6: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 500,
    },
    button: {
      fontFamily: '"Inter", sans-serif',
      textTransform: 'none',
      fontWeight: 500,
    },
    body1: {
      fontFamily: '"Inter", sans-serif',
    },
    body2: {
      fontFamily: '"Inter", sans-serif',
    },
  },
  shape: {
    borderRadius: 8, // Matches tailwind rounded-lg (0.5rem = 8px)
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // Tailwind shadow-md
          },
        },
        containedPrimary: {
           '&:hover': {
             backgroundColor: '#004a66', // darker hover
           }
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Matches tailwind rounded-xl
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // Tailwind shadow-sm
          border: '1px solid #E5E7EB', // Tailwind gray-200
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Remove default MUI dark mode overlay
        }
      }
    }
  },
});
