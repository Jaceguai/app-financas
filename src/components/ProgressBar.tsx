import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  current?: number;
  total?: number;
  progress?: number;
  color?: string;
  showLabels?: boolean;
}

export const ProgressBar: React.FC<Props> = ({
  current,
  total,
  progress,
  color,
  showLabels = true,
}) => {
  let percentageCalc: number;
  let safeCurrent: number;
  let safeTotal: number;

  if (progress !== undefined) {
    percentageCalc = progress * 100;
    safeCurrent = 0;
    safeTotal = 0;
  } else {
    safeCurrent = Number(current) || 0;
    safeTotal = Number(total) || 0;
    percentageCalc = safeTotal > 0 ? (safeCurrent / safeTotal) * 100 : 0;
  }

  const visualPercentage = Math.min(percentageCalc, 100);
  const isOverBudget = percentageCalc > 100;

  return (
    <View className="w-full">
      {showLabels && current !== undefined && total !== undefined && (
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm text-gray-500 dark:text-slate-400">
            R$ {safeCurrent.toFixed(2)} / R$ {safeTotal.toFixed(2)}
          </Text>
          <Text className={`text-sm font-semibold ${isOverBudget ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
            {percentageCalc.toFixed(1)}%
          </Text>
        </View>
      )}

      <View className="h-3 rounded-full overflow-hidden flex-row w-full bg-gray-100 dark:bg-slate-600">
        <View
          className={`h-3 rounded-full ${isOverBudget ? 'bg-red-500 dark:bg-red-400' : 'bg-emerald-500 dark:bg-emerald-400'}`}
          style={{ flex: visualPercentage / 100 || 0 }}
        />
      </View>

      {isOverBudget && showLabels && (
        <Text className="text-xs mt-1 font-bold text-red-500 dark:text-red-400">
          Orçamento excedido!
        </Text>
      )}
    </View>
  );
};
