import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  userName: string;
  totalSpent: number;
  color: string;
}

export const UserExpenseCard: React.FC<Props> = ({ userName, totalSpent, color }) => {
  return (
    <View className="bg-white dark:bg-slate-800 rounded-xl p-4 flex-1 mx-1 shadow-md">
      <View className="flex-row items-center mb-2">
        <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }} />
        <Text className="text-gray-600 dark:text-gray-400 text-sm font-medium">{userName}</Text>
      </View>
      <Text className="text-2xl font-bold text-gray-900 dark:text-white">R$ {totalSpent.toFixed(2)}</Text>
      <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total gasto</Text>
    </View>
  );
};
