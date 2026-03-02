import React from 'react';
import { Text, View } from 'react-native';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useTransactions as useTransactionsQuery, useWorkspaceConfig } from '../hooks/useSupabaseQuery';

interface SummaryCardProps {
  month: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ month }) => {
  const { workspace } = useWorkspace();

  const { data: transactions = [] } = useTransactionsQuery(workspace?.id, month);
  const { data: config = [] } = useWorkspaceConfig(workspace?.id);

  const extraConfig = config.find(c => c.key === 'extraGastosVariaveis');
  const limite = extraConfig ? Number(extraConfig.value) || 0 : 1000;

  const transacoesLazer = transactions.filter(t =>
    t.category && t.category.trim().toLowerCase() === 'lazer'
  );

  const totalSpent = transacoesLazer.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const percentage = limite > 0 ? Math.min((totalSpent / limite) * 100, 100) : 0;
  const isOverBudget = totalSpent > limite;

  return (
    <View className="rounded-xl p-4 mx-4 mt-4 border border-gray-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
      <Text className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
        Orçamento de Lazer
      </Text>

      <View className="flex-row justify-between mb-3">
        <View>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            Gasto em Lazer
          </Text>
          <Text className={`text-2xl font-bold ${isOverBudget ? 'text-red-500 dark:text-red-400' : 'text-primary-500 dark:text-primary-400'}`}>
            R$ {totalSpent.toFixed(2)}
          </Text>
          <Text className="text-xs mt-0.5 text-gray-500 dark:text-gray-400">
            (Débito + Crédito)
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            Teto Definido
          </Text>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            R$ {limite.toFixed(2)}
          </Text>
        </View>
      </View>

      <View className="h-3 rounded-full overflow-hidden flex-row bg-gray-200 dark:bg-slate-600">
        <View
          className={`h-3 rounded-full ${isOverBudget ? 'bg-red-500 dark:bg-red-400' : 'bg-primary-500 dark:bg-primary-400'}`}
          style={{ flex: percentage / 100 }}
        />
      </View>

      <Text className="text-xs mt-2 text-center text-gray-500 dark:text-gray-400">
        {percentage.toFixed(1)}% do teto utilizado
      </Text>
    </View>
  );
};
