import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useSavingsDeposits, useSavingsGoals, useSavingsGoalTransactions } from '../../hooks/useSupabaseQuery';
import { useTheme } from '../../theme';
import { formatCurrency } from '../../utils/formatters';

type FilterType = 'all' | 'deposits' | 'withdrawals';

type TimelineItem = {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  description: string;
  date: string;
};

export const SavingsGoalDetailScreen: React.FC<{ route?: any; onGoBack?: () => void }> = ({ route, onGoBack }) => {
  const { isDark } = useTheme();
  const { workspace } = useWorkspace();
  const goalId: string | undefined = route?.params?.goalId;
  const goalName: string = route?.params?.goalName || 'Meta';

  const [filter, setFilter] = useState<FilterType>('all');

  const { data: savingsGoals = [] } = useSavingsGoals(workspace?.id);
  const { data: deposits = [] } = useSavingsDeposits(goalId);
  const { data: withdrawals = [] } = useSavingsGoalTransactions(goalId);

  const goal = savingsGoals.find(g => g.id === goalId);
  const progress = goal
    ? Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100)
    : 0;

  const allItems = useMemo<TimelineItem[]>(() => {
    const depositItems: TimelineItem[] = deposits.map(d => ({
      id: d.id,
      type: 'deposit',
      amount: Number(d.amount),
      description: 'Depósito',
      date: d.created_at,
    }));

    const withdrawalItems: TimelineItem[] = withdrawals.map(w => ({
      id: w.id,
      type: 'withdrawal',
      amount: Number(w.amount),
      description: w.description,
      date: w.transaction_date,
    }));

    return [...depositItems, ...withdrawalItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [deposits, withdrawals]);

  const filteredItems = useMemo<TimelineItem[]>(() => {
    if (filter === 'deposits') return allItems.filter(i => i.type === 'deposit');
    if (filter === 'withdrawals') return allItems.filter(i => i.type === 'withdrawal');
    return allItems;
  }, [allItems, filter]);

  const totalDeposits = deposits.reduce((s, d) => s + Number(d.amount), 0);
  const totalWithdrawals = withdrawals.reduce((s, w) => s + Number(w.amount), 0);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filterLabels: Record<FilterType, string> = {
    all: 'Todos',
    deposits: 'Depósitos',
    withdrawals: 'Retiradas',
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
      <View className="flex-row items-center p-4 border-b border-gray-200 dark:border-slate-700 gap-3">
        {onGoBack && (
          <TouchableOpacity onPress={onGoBack}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#111827'} />
          </TouchableOpacity>
        )}
        <Text className="text-lg font-bold text-gray-900 dark:text-slate-100 flex-1" numberOfLines={1}>
          {goalName}
        </Text>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={() => (
          <View className="p-4">
            {/* Progress card */}
            {goal && (
              <View className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 border border-gray-200 dark:border-slate-700">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm font-semibold text-gray-500 dark:text-slate-400">Progresso da meta</Text>
                  <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">{progress.toFixed(0)}%</Text>
                </View>
                <View className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                  <View
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </View>
                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Atual</Text>
                    <Text className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(Number(goal.current_amount))}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Meta</Text>
                    <Text className="text-xl font-bold text-gray-900 dark:text-slate-100">
                      {formatCurrency(Number(goal.target_amount))}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Stats cards */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-200 dark:border-green-800">
                <Ionicons name="arrow-down-circle-outline" size={20} color="#16a34a" />
                <Text className="text-xs text-green-700 dark:text-green-400 mt-1 mb-0.5">Total depositado</Text>
                <Text className="text-base font-bold text-green-700 dark:text-green-400">
                  {formatCurrency(totalDeposits)}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-slate-500">
                  {deposits.length} depósito{deposits.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <View className="flex-1 bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 border border-orange-200 dark:border-orange-800">
                <Ionicons name="arrow-up-circle-outline" size={20} color="#ea580c" />
                <Text className="text-xs text-orange-700 dark:text-orange-400 mt-1 mb-0.5">Total retirado</Text>
                <Text className="text-base font-bold text-orange-700 dark:text-orange-400">
                  {formatCurrency(totalWithdrawals)}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-slate-500">
                  {withdrawals.length} retirada{withdrawals.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {/* Filter tabs */}
            <View className="flex-row bg-gray-200 dark:bg-slate-700 rounded-xl p-1 mb-4">
              {(['all', 'deposits', 'withdrawals'] as FilterType[]).map(f => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  className={`flex-1 py-2 rounded-lg items-center ${filter === f ? 'bg-white dark:bg-slate-600' : ''}`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      filter === f ? 'text-gray-900 dark:text-slate-100' : 'text-gray-500 dark:text-slate-400'
                    }`}
                  >
                    {filterLabels[f]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {filteredItems.length === 0 && (
              <View className="items-center py-12">
                <Ionicons name="wallet-outline" size={48} color={isDark ? '#64748b' : '#9ca3af'} />
                <Text className="text-sm text-gray-500 dark:text-slate-400 mt-3 text-center">
                  Nenhum registro encontrado
                </Text>
              </View>
            )}
          </View>
        )}
        renderItem={({ item }) => (
          <View className="mx-4 mb-3 bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
            <View className="flex-row items-center gap-3">
              <View
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  item.type === 'deposit'
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-orange-100 dark:bg-orange-900/30'
                }`}
              >
                <Ionicons
                  name={item.type === 'deposit' ? 'arrow-down' : 'arrow-up'}
                  size={18}
                  color={item.type === 'deposit' ? '#16a34a' : '#ea580c'}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                  {item.description}
                </Text>
                <Text className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  {formatDate(item.date)}
                </Text>
              </View>
              <Text
                className={`text-base font-bold ${
                  item.type === 'deposit'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`}
              >
                {item.type === 'deposit' ? '+' : '-'}{formatCurrency(item.amount)}
              </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};
