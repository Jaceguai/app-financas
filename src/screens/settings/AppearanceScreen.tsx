import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { getIconColor } from '../../utils/iconColors';

export const AppearanceScreen: React.FC<{ onGoBack?: () => void }> = ({ onGoBack }) => {
  const { theme, isDark, toggleTheme, themeMode, setThemeMode } = useTheme();
  const { colorScheme } = useColorScheme();

  const handleToggle = async () => {
    console.log('Tema atual:', isDark ? 'escuro' : 'claro');
    await toggleTheme();
    console.log('Tema alterado para:', !isDark ? 'escuro' : 'claro');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
        {onGoBack && (
          <TouchableOpacity onPress={onGoBack}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#111827'} />
          </TouchableOpacity>
        )}
        <Text className="text-lg font-bold text-gray-900 dark:text-slate-100">Aparência</Text>
        <View className="w-6" />
      </View>

      <View className="p-4">

        <Text className="text-sm font-bold uppercase tracking-wider mb-3 text-gray-400 dark:text-slate-500">
          Tema
        </Text>

        <View className="space-y-2">
          <TouchableOpacity
            onPress={() => setThemeMode('light')}
            className={`flex-row items-center justify-between p-4 rounded-xl border ${
              themeMode === 'light'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
            }`}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-amber-100 dark:bg-amber-900/30">
                <Ionicons name="sunny" size={22} color={getIconColor('warning', isDark)} />
              </View>
              <View className="ml-3">
                <Text className="text-base font-semibold text-gray-900 dark:text-slate-100">
                  Modo Claro
                </Text>
                <Text className="text-sm text-gray-500 dark:text-slate-400">
                  Sempre usar tema claro
                </Text>
              </View>
            </View>
            {themeMode === 'light' && (
              <Ionicons name="checkmark-circle" size={24} color={getIconColor('primary', isDark)} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setThemeMode('dark')}
            className={`flex-row items-center justify-between p-4 rounded-xl border mt-3 ${
              themeMode === 'dark'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
            }`}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-indigo-100 dark:bg-indigo-900/30">
                <Ionicons name="moon" size={22} color={getIconColor('primary', isDark)} />
              </View>
              <View className="ml-3">
                <Text className="text-base font-semibold text-gray-900 dark:text-slate-100">
                  Modo Escuro
                </Text>
                <Text className="text-sm text-gray-500 dark:text-slate-400">
                  Sempre usar tema escuro
                </Text>
              </View>
            </View>
            {themeMode === 'dark' && (
              <Ionicons name="checkmark-circle" size={24} color={getIconColor('primary', isDark)} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setThemeMode('auto')}
            className={`flex-row items-center justify-between p-4 rounded-xl border mt-3 ${
              themeMode === 'auto'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
            }`}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-purple-100 dark:bg-purple-900/30">
                <Ionicons name="phone-portrait" size={22} color={getIconColor('purple', isDark)} />
              </View>
              <View className="ml-3">
                <Text className="text-base font-semibold text-gray-900 dark:text-slate-100">
                  Automático
                </Text>
                <Text className="text-sm text-gray-500 dark:text-slate-400">
                  Seguir configuração do sistema
                </Text>
              </View>
            </View>
            {themeMode === 'auto' && (
              <Ionicons name="checkmark-circle" size={24} color={getIconColor('primary', isDark)} />
            )}
          </TouchableOpacity>
        </View>

        <View className="mt-8 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={20} color={getIconColor('primary', isDark)} />
            <Text className="flex-1 ml-2 text-sm text-gray-700 dark:text-slate-300">
              O tema é aplicado automaticamente em todo o aplicativo e é salvo nas suas preferências.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};
