'use client';

import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = 'jcs_theme';
const THEME_CHANGE_EVENT = 'jcs-theme-change';

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

function subscribeToTheme(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  window.addEventListener('storage', onStoreChange);
  mediaQuery.addEventListener('change', onStoreChange);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
    window.removeEventListener('storage', onStoreChange);
    mediaQuery.removeEventListener('change', onStoreChange);
  };
}

function saveTheme(theme: Theme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // The current session still uses the selected theme if storage is unavailable.
  }
  applyTheme(theme);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
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
