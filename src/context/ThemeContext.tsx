
import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light';

interface ThemeContextType {
  theme: ThemeMode;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Sync with Tailwind class - Always Force Light
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    localStorage.removeItem('LC_THEME'); // Clear legacy preference
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'light' }}>
        {children}
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
