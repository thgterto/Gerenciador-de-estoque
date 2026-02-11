import { PaletteMode } from '@mui/material';
import { ThemeOptions } from '@mui/material/styles';

// Precision Brutalist Theme
// Core concept: Technical, raw, data-first.
// Inspiration: Industrial control panels, terminal interfaces.

export const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: '#1e293b', // Deep Technical Slate (Slate 800)
      light: '#334155', // Slate 700
      dark: '#0f172a', // Slate 900
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FF4500', // International Orange (High visibility accent)
      light: '#ff7043',
      dark: '#c41c00',
      contrastText: '#ffffff',
    },
    background: {
      default: mode === 'light' ? '#f1f5f9' : '#0f172a', // Slate 100 / Slate 900
      paper: mode === 'light' ? '#ffffff' : '#1e293b',
    },
    text: {
      primary: mode === 'light' ? '#0f172a' : '#f8fafc', // Slate 900 / Slate 50
      secondary: mode === 'light' ? '#475569' : '#94a3b8', // Slate 600 / Slate 400
    },
    divider: mode === 'light' ? '#e2e8f0' : '#334155', // Slate 200 / Slate 700
    success: {
        main: '#10b981', // Emerald 500
    },
    warning: {
        main: '#f59e0b', // Amber 500
    },
    error: {
        main: '#ef4444', // Red 500
    },
    info: {
        main: '#3b82f6', // Blue 500
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
      letterSpacing: '-0.01em',
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
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      fontSize: '0.875rem',
    },
    button: {
      fontFamily: '"JetBrains Mono", monospace', // Monospaced actions
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    overline: {
        fontFamily: '"JetBrains Mono", monospace',
        fontWeight: 500,
    },
    caption: {
        fontFamily: '"JetBrains Mono", monospace',
    }
  },
  shape: {
    borderRadius: 0, // Sharp corners
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0, // Sharp
          borderWidth: 1,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
            borderWidth: 1,
          },
        },
        contained: {
             // Solid technical feel
        },
        outlined: {
            borderWidth: 1,
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0, // Sharp
          backgroundImage: 'none',
          boxShadow: mode === 'light'
            ? '0 0 0 1px rgba(0,0,0,0.05), 0 1px 3px 0 rgba(0,0,0,0.1)'
            : '0 0 0 1px rgba(255,255,255,0.1)',
        },
      },
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                borderRadius: 0,
                backgroundImage: 'none',
            }
        }
    },
    MuiChip: {
        styleOverrides: {
            root: {
                borderRadius: 0, // Sharp chips
                fontFamily: '"JetBrains Mono", monospace',
                fontWeight: 500,
            }
        }
    },
    MuiTableCell: {
        styleOverrides: {
            root: {
                fontFamily: '"JetBrains Mono", monospace', // Data in mono
                fontSize: '0.8125rem',
            },
            head: {
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.05em',
                color: mode === 'light' ? '#64748b' : '#94a3b8',
            }
        }
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
      styleOverrides: {
        root: {
            '& .MuiOutlinedInput-root': {
                borderRadius: 0,
            }
        }
      }
    },
  },
});
