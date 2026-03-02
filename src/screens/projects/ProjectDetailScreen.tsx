import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useProjectTransactions, useProjects } from '../../hooks/useSupabaseQuery';
import { useTheme } from '../../theme';
import { formatCurrency } from '../../utils/formatters';
import { Transaction } from '../../types';

export const ProjectDetailScreen: React.FC<{ route?: any; onGoBack?: () => void }> = ({ route, onGoBack }) => {
  const { isDark } = useTheme();
  const { workspace, members } = useWorkspace();
  const projectId = route?.params?.projectId;
  const projectName = route?.params?.projectName || 'Projeto';

  const { data: projects = [] } = useProjects(workspace?.id);
  const { data: transactions = [], isLoading } = useProjectTransactions(projectId);

  const project = projects.find(p => p.id === projectId);

  const getMemberName = (userId: string) => {
    return members.find(m => m.user_id === userId)?.display_name || 'Desconhecido';
  };

  const stats = useMemo(() => {
    const total = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const debitTotal = transactions.filter(t => t.payment_method !== 'credit').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const creditTotal = transactions.filter(t => t.payment_method === 'credit').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const installmentCount = transactions.filter(t => t.installment_total && t.installment_total > 1).length;

    // Group by category
    const byCategory: Record<string, number> = {};
    transactions.forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + (Number(t.amount) || 0);
    });
    const categories = Object.entries(byCategory)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Group by member
    const byMember: Record<string, number> = {};
    transactions.forEach(t => {
      const name = getMemberName(t.user_id);
      byMember[name] = (byMember[name] || 0) + (Number(t.amount) || 0);
    });
    const memberBreakdown = Object.entries(byMember)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    return { total, debitTotal, creditTotal, installmentCount, categories, memberBreakdown };
  }, [transactions, members]);

  const budgetProgress = project?.budget ? (stats.total / Number(project.budget)) * 100 : null;

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const date = new Date(item.transaction_date);
    const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const memberName = getMemberName(item.user_id);
    const isCredit = item.payment_method === 'credit';
    const isInstallment = item.installment_total && item.installment_total > 1;
    const isLastInstallment = isInstallment && item.installment_current === item.installment_total;

    return (
      <View className="p-3 mb-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-gray-900 dark:text-slate-100">{item.description}</Text>
            <View className="flex-row items-center gap-2 mt-1">
              <Text className="text-xs text-gray-400 dark:text-slate-500">{item.category}</Text>
              {isInstallment && (
                <View className={`px-1.5 py-0.5 rounded ${isLastInstallment ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                  <Text className={`text-[10px] font-bold ${isLastInstallment ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {item.installment_current}/{item.installment_total}x
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Text className="text-sm font-bold text-red-500">-{formatCurrency(Number(item.amount))}</Text>
        </View>
        <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
          <View className="flex-row items-center gap-2">
            <Text className="text-[10px] text-gray-400 dark:text-slate-500">{formattedDate}</Text>
            <View className={`flex-row items-center px-1.5 py-0.5 rounded ${isCredit ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
              <Ionicons name={isCredit ? 'card' : 'wallet'} size={10} color={isCredit ? '#f59e0b' : '#3b82f6'} style={{ marginRight: 2 }} />
              <Text className={`text-[10px] font-semibold ${isCredit ? 'text-amber-500' : 'text-blue-500'}`}>
                {isCredit ? 'Crédito' : 'Débito/Pix'}
              </Text>
            </View>
          </View>
          <Text className="text-[10px] font-medium text-blue-500 dark:text-blue-400">{memberName}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
      <View className="flex-row items-center p-4 border-b border-gray-200 dark:border-slate-700">
        {onGoBack && (
          <TouchableOpacity onPress={onGoBack} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#111827'} />
          </TouchableOpacity>
        )}
        <View className="flex-row items-center flex-1 gap-3">
          {project && (
            <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: project.color + '20' }}>
              <Ionicons name={project.icon as any} size={20} color={project.color} />
            </View>
          )}
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900 dark:text-slate-100" numberOfLines={1}>{projectName}</Text>
            <Text className="text-xs text-gray-400 dark:text-slate-500">{transactions.length} transações</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="mb-4">
            {/* Total Card */}
            <View className="rounded-xl p-4 mb-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
              <Text className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500 mb-1">Total Gasto</Text>
              <Text className="text-3xl font-bold text-red-500">{formatCurrency(stats.total)}</Text>

              {budgetProgress !== null && project?.budget && (
                <View className="mt-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-gray-400 dark:text-slate-500">
                      Orçamento: {formatCurrency(Number(project.budget))}
                    </Text>
                    <Text className={`text-xs font-bold ${budgetProgress > 100 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {budgetProgress.toFixed(0)}%
                    </Text>
                  </View>
                  <View className="h-2.5 rounded-full bg-gray-200 dark:bg-slate-600 overflow-hidden">
                    <View
                      className={`h-full rounded-full ${budgetProgress > 100 ? 'bg-red-500' : budgetProgress > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Breakdown */}
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1 rounded-xl p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Ionicons name="wallet" size={14} color="#3b82f6" />
                  <Text className="text-xs text-gray-400 dark:text-slate-500">Débito/Pix</Text>
                </View>
                <Text className="text-base font-bold text-gray-900 dark:text-slate-100">{formatCurrency(stats.debitTotal)}</Text>
              </View>
              <View className="flex-1 rounded-xl p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Ionicons name="card" size={14} color="#f59e0b" />
                  <Text className="text-xs text-gray-400 dark:text-slate-500">Crédito</Text>
                </View>
                <Text className="text-base font-bold text-gray-900 dark:text-slate-100">{formatCurrency(stats.creditTotal)}</Text>
              </View>
            </View>

            {stats.installmentCount > 0 && (
              <View className="rounded-xl p-3 mb-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="layers" size={16} color="#f59e0b" />
                  <Text className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    {stats.installmentCount} transações parceladas neste projeto
                  </Text>
                </View>
              </View>
            )}

            {/* Category breakdown */}
            {stats.categories.length > 0 && (
              <View className="rounded-xl p-4 mb-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                <Text className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500 mb-2">Por Categoria</Text>
                {stats.categories.map((cat) => (
                  <View key={cat.name} className="flex-row justify-between py-1.5">
                    <Text className="text-sm text-gray-600 dark:text-slate-300">{cat.name}</Text>
                    <Text className="text-sm font-semibold text-gray-900 dark:text-slate-100">{formatCurrency(cat.amount)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Member breakdown */}
            {stats.memberBreakdown.length > 1 && (
              <View className="rounded-xl p-4 mb-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                <Text className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500 mb-2">Por Membro</Text>
                {stats.memberBreakdown.map((m) => (
                  <View key={m.name} className="flex-row justify-between py-1.5">
                    <Text className="text-sm text-gray-600 dark:text-slate-300">{m.name}</Text>
                    <Text className="text-sm font-semibold text-gray-900 dark:text-slate-100">{formatCurrency(m.amount)}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2 mt-1">
              Transações ({transactions.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center py-8">
            <Ionicons name="receipt-outline" size={48} color={isDark ? '#64748b' : '#9ca3af'} />
            <Text className="text-sm mt-3 text-gray-500 dark:text-slate-400">
              {isLoading ? 'Carregando...' : 'Nenhuma transação neste projeto'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};
