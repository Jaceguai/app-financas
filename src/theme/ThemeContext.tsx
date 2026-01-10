/**
 * Theme Context and Provider
 * Manages theme state and provides theme to all components
 */

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, lightTheme, darkTheme, ThemeMode } from './theme';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  themeMode: ThemeMode | 'auto';
  setThemeMode: (mode: ThemeMode | 'auto') => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode | 'auto'>('auto');

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto')) {
        setThemeModeState(savedTheme as ThemeMode | 'auto');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode | 'auto') => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Determine actual theme based on mode
  const isDark = themeMode === 'auto' 
    ? systemColorScheme === 'dark' 
    : themeMode === 'dark';
  
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
