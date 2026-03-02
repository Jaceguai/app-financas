import LottieView from 'lottie-react-native';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PurpleDogWalking from '../../assets/animations/Purple dog walking.json';
import { useTheme } from '../theme';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { isDark } = useTheme();

  useEffect(() => {
    // Navega automaticamente após 3 segundos
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-slate-900">
        <View style={{ width: 300, height: 300 }}>
          <LottieView
            source={PurpleDogWalking}
            autoPlay
            loop
            style={{ width: '100%', height: '100%' }}
          />
        </View>

        <Text className="text-5xl font-extrabold text-gray-900 dark:text-slate-100 mt-8">
          Finanças Pro
        </Text>

        <Text className="text-lg text-gray-600 dark:text-slate-400 mt-3 text-center px-8">
          Gerencie suas finanças em equipe ou sozinho
        </Text>

        <View className="mt-12 flex-row gap-2">
          <View className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" />
          <View className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" />
          <View className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" />
        </View>
      </View>
    </SafeAreaView>
  );
};
