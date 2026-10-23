'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = 'jcs_theme';

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function getThemeSnapshot(): Theme {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Fall back to the operating system preference when storage is unavailable.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getServerThemeSnapshot(): Theme {
  return 'light';
}

function saveTheme(theme: Theme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // The current session still uses the selected theme if storage is unavailable.
  }
  applyTheme(theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getServerThemeSnapshot);

  useEffect(() => {
    const initialTheme = getThemeSnapshot();
    setTheme(initialTheme);
    applyTheme(initialTheme);

    const syncStoredTheme = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const nextTheme = getThemeSnapshot();
      setTheme(nextTheme);
      applyTheme(nextTheme);
    };
    const syncSystemTheme = (event: MediaQueryListEvent) => {
      try {
        if (window.localStorage.getItem(STORAGE_KEY)) return;
      } catch {
        // Follow the system preference when storage is unavailable.
      }
      const nextTheme = event.matches ? 'dark' : 'light';
      setTheme(nextTheme);
      applyTheme(nextTheme);
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    window.addEventListener('storage', syncStoredTheme);
    mediaQuery.addEventListener('change', syncSystemTheme);
    return () => {
      window.removeEventListener('storage', syncStoredTheme);
      mediaQuery.removeEventListener('change', syncSystemTheme);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    saveTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
