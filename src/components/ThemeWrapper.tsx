import React from 'react';
import { View } from 'react-native';
// Note que não precisamos importar useColorScheme aqui para a lógica da classe

interface ThemeWrapperProps {
  children: React.ReactNode;
}

export const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ children }) => {
  // Apenas use as classes do tailwind.
  // O NativeWind aplicará o estilo dark: automaticamente quando o setColorScheme mudar.
  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      {children}
    </View>
  );
};
