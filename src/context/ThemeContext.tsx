import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, CssBaseline, PaletteMode } from '@mui/material';
import { getDesignTokens } from '../theme';

interface ThemeContextType {
  theme: PaletteMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<PaletteMode>(() => {
    // Check local storage or system preference on mount
    const savedTheme = localStorage.getItem('LC_THEME');
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme as PaletteMode;
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Sync with Tailwind dark mode class
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('LC_THEME', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Generate MUI Theme
  const muiTheme = useMemo(() => createTheme(getDesignTokens(theme)), [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
