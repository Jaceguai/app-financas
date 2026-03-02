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

  // Determina o colorScheme efetivo
  const effectiveColorScheme = manualColorScheme || (themeMode === 'auto' ? systemColorScheme : themeMode) || 'light';

  // Carrega o tema salvo
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        console.log('📂 Tema salvo:', saved);

        if (saved === 'light' || saved === 'dark' || saved === 'auto') {
          setThemeModeState(saved as ThemeMode | 'auto');

          if (saved === 'light') {
            setManualColorScheme('light');
          } else if (saved === 'dark') {
            setManualColorScheme('dark');
          } else {
            // Auto: não define manual, usa o sistema
            setManualColorScheme(null);
          }
        } else {
          // Primeira vez: usa auto (sistema)
          setManualColorScheme(null);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsReady(true);
      }
    };

    loadTheme();
  }, []);

  // Sincroniza com NativeWind usando colorScheme.set()
  useEffect(() => {
    if (isReady) {
      console.log('🔄 Aplicando colorScheme.set():', effectiveColorScheme);
      colorScheme.set(effectiveColorScheme);
    }
  }, [effectiveColorScheme, isReady]);

  const setThemeMode = async (mode: ThemeMode | 'auto') => {
    try {
      console.log('🎨 Mudando tema para:', mode);

      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);

      if (mode === 'light') {
        console.log('☀️ Aplicando tema CLARO');
        setManualColorScheme('light');
      } else if (mode === 'dark') {
        console.log('🌙 Aplicando tema ESCURO');
        setManualColorScheme('dark');
      } else {
        console.log('📱 Modo AUTO - seguindo sistema');
        setManualColorScheme(null);
      }
    } catch (error) {
      console.error('❌ Error setting theme:', error);
    }
  };

  const isDark = effectiveColorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  // Debug: Log do estado atual
  console.log('🎨 ThemeProvider - effectiveColorScheme:', effectiveColorScheme, '| isDark:', isDark, '| themeMode:', themeMode);

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
