import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme } from 'nativewind';
import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, ThemeMode, darkTheme, lightTheme } from './theme';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  themeMode: ThemeMode | 'auto';
  setThemeMode: (mode: ThemeMode | 'auto') => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_mode';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode | 'auto'>('auto');
  const [manualColorScheme, setManualColorScheme] = useState<'light' | 'dark' | null>(null);
  const [isReady, setIsReady] = useState(false);

  const effectiveColorScheme = manualColorScheme || (themeMode === 'auto' ? systemColorScheme : themeMode) || 'light';

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);

        if (saved === 'light' || saved === 'dark' || saved === 'auto') {
          setThemeModeState(saved as ThemeMode | 'auto');

          if (saved === 'light') {
            setManualColorScheme('light');
          } else if (saved === 'dark') {
            setManualColorScheme('dark');
          } else {
            setManualColorScheme(null);
          }
        } else {
          setManualColorScheme(null);
        }
      } catch {
        // Failed to load saved theme
      } finally {
        setIsReady(true);
      }
    };

    loadTheme();
  }, []);

  useEffect(() => {
    if (isReady) {
      colorScheme.set(effectiveColorScheme);
    }
  }, [effectiveColorScheme, isReady]);

  const setThemeMode = async (mode: ThemeMode | 'auto') => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);

      if (mode === 'light') {
        setManualColorScheme('light');
      } else if (mode === 'dark') {
        setManualColorScheme('dark');
      } else {
        setManualColorScheme(null);
      }
    } catch {
      // Failed to persist theme
    }
  };

  const isDark = effectiveColorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  if (!isReady) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark, themeMode, setThemeMode, toggleTheme }}>
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
