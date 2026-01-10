/**
 * Color palette definitions for light and dark themes
 * Following a consistent design system
 */

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryDark: string;
  primaryLight: string;
  
  // Secondary colors
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  
  // Accent colors
  accent: string;
  accentDark: string;
  accentLight: string;
  
  // Status colors
  success: string;
  error: string;
  warning: string;
  info: string;
  
  // Background colors
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceSecondary: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // Border colors
  border: string;
  borderLight: string;
  borderDark: string;
  
  // Input colors
  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;
  
  // Tab bar colors
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  
  // Shadow
  shadow: string;
}

export const lightColors: ThemeColors = {
  // Primary colors
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  primaryLight: '#60a5fa',
  
  // Secondary colors
  secondary: '#10b981',
  secondaryDark: '#059669',
  secondaryLight: '#34d399',
  
  // Accent colors
  accent: '#f59e0b',
  accentDark: '#d97706',
  accentLight: '#fbbf24',
  
  // Status colors
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  
  // Background colors
  background: '#fafafa',
  backgroundSecondary: '#f3f4f6',
  surface: '#ffffff',
  surfaceSecondary: '#f9fafb',
  
  // Text colors
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textInverse: '#ffffff',
  
  // Border colors
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  borderDark: '#d1d5db',
  
  // Input colors
  inputBackground: '#f9fafb',
  inputBorder: '#e5e7eb',
  inputPlaceholder: '#9ca3af',
  
  // Tab bar colors
  tabBarBackground: '#ffffff',
  tabBarActive: '#10b981',
  tabBarInactive: '#6b7280',
  
  // Shadow
  shadow: '#000000',
};

export const darkColors: ThemeColors = {
  // Primary colors
  primary: '#60a5fa',
  primaryDark: '#3b82f6',
  primaryLight: '#93c5fd',
  
  // Secondary colors
  secondary: '#34d399',
  secondaryDark: '#10b981',
  secondaryLight: '#6ee7b7',
  
  // Accent colors
  accent: '#fbbf24',
  accentDark: '#f59e0b',
  accentLight: '#fcd34d',
  
  // Status colors
  success: '#34d399',
  error: '#f87171',
  warning: '#fbbf24',
  info: '#60a5fa',
  
  // Background colors
  background: '#0f172a',
  backgroundSecondary: '#1e293b',
  surface: '#1e293b',
  surfaceSecondary: '#334155',
  
  // Text colors
  textPrimary: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textTertiary: '#94a3b8',
  textInverse: '#0f172a',
  
  // Border colors
  border: '#334155',
  borderLight: '#475569',
  borderDark: '#1e293b',
  
  // Input colors
  inputBackground: '#334155',
  inputBorder: '#475569',
  inputPlaceholder: '#94a3b8',
  
  // Tab bar colors
  tabBarBackground: '#1e293b',
  tabBarActive: '#34d399',
  tabBarInactive: '#94a3b8',
  
  // Shadow
  shadow: '#000000',
};
