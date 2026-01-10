/**
 * Main theme configuration
 * Combines colors, spacing, and typography
 */

import { lightColors, darkColors, ThemeColors } from './colors';
import { spacing, Spacing } from './spacing';
import { typography, Typography } from './typography';

export interface Theme {
  colors: ThemeColors;
  spacing: Spacing;
  typography: Typography;
  isDark: boolean;
}

export const lightTheme: Theme = {
  colors: lightColors,
  spacing,
  typography,
  isDark: false,
};

export const darkTheme: Theme = {
  colors: darkColors,
  spacing,
  typography,
  isDark: true,
};

export type ThemeMode = 'light' | 'dark';
