import { PaletteMode } from '@mui/material';
import { ThemeOptions } from '@mui/material/styles';

export const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode values
          primary: {
            main: '#1976d2', // Google Blue or similar
          },
          secondary: {
            main: '#9c27b0',
          },
          background: {
             default: '#f8f9fa', // Slightly off-white for Google feel
             paper: '#ffffff',
          }
        }
      : {
          // Dark mode values
          primary: {
            main: '#90caf9',
          },
          secondary: {
            main: '#ce93d8',
          },
          background: {
            default: '#121212',
            paper: '#1e1e1e',
          },
        }),
  },
  typography: {
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
    button: {
      textTransform: 'none', // Google Material 3 tends to avoid uppercase buttons
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // More rounded like MD3
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
  },
});
