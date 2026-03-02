/**
 * Cores dos ícones que se adaptam ao dark mode
 * Use estas cores ao invés de hex fixos para ícones do Ionicons
 */

export const iconColors = {
  // Cores primárias
  primary: {
    light: '#3b82f6',
    dark: '#60a5fa',
  },
  // Cores de sucesso (verde/emerald)
  success: {
    light: '#10b981',
    dark: '#34d399',
  },
  // Cores de erro (vermelho)
  error: {
    light: '#ef4444',
    dark: '#f87171',
  },
  // Cores de warning (laranja)
  warning: {
    light: '#f97316',
    dark: '#fb923c',
  },
  // Cores roxas
  purple: {
    light: '#a855f7',
    dark: '#c084fc',
  },
  // Cores de texto
  text: {
    primary: {
      light: '#111827',
      dark: '#f9fafb',
    },
    secondary: {
      light: '#6b7280',
      dark: '#9ca3af',
    },
  },
  // Branco (para ícones em botões)
  white: '#ffffff',
};

/**
 * Helper para pegar a cor do ícone baseado no tema
 */
export const getIconColor = (
  colorKey: 'primary' | 'success' | 'error' | 'warning' | 'purple',
  isDark: boolean
): string => {
  const color = iconColors[colorKey];
  return isDark ? color.dark : color.light;
};
