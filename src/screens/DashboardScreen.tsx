import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MonthSelector, getCurrentMonth } from '../components/MonthSelector';
import { ProgressBar } from '../components/ProgressBar';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useFixedExpenses, useIncomes, useSavingsGoals, useTransactions } from '../hooks/useSupabaseQuery';
import { useFinanceStore } from '../store/useFinanceStore';
import { useTheme } from '../theme';
import { formatCurrency } from '../utils/formatters';
import { getIconColor } from '../utils/iconColors';

export default function DashboardScreen() {
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const { workspace, members } = useWorkspace();
  const { hideValues } = useFinanceStore();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [localHideValues, setLocalHideValues] = useState(hideValues);

  const { data: transactions = [], isLoading: txLoading } = useTransactions(workspace?.id, selectedMonth);
  const { data: fixedExpenses = [] } = useFixedExpenses(workspace?.id);
  const { data: incomes = [] } = useIncomes(workspace?.id);
  const { data: savingsGoals = [] } = useSavingsGoals(workspace?.id);

  const rendaTotal = incomes.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const gastosFixosDebit = fixedExpenses
    .filter(r => r.payment_method !== 'credit')
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const gastosMesDebit = transactions
    .filter(t => t.payment_method !== 'credit')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const invoiceFixed = fixedExpenses
    .filter(r => r.payment_method === 'credit')
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const invoiceVariable = transactions
    .filter(t => t.payment_method === 'credit')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const invoiceTotal = invoiceFixed + invoiceVariable;
  const restante = rendaTotal - gastosFixosDebit - gastosMesDebit - invoiceTotal;
  const patrimonioTotal = savingsGoals.reduce((sum, p) => sum + (Number(p.current_amount) || 0), 0);

  const memberSpending = members.map(member => ({
    ...member,
    total: transactions
      .filter(t => t.user_id === member.user_id)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
  }));

  // Agrupar parcelas ativas no mês selecionado
  const installmentItems = transactions
    .filter(t => t.installment_id && t.installment_total && t.installment_total > 1)
    .map(t => ({
      installment_id: t.installment_id!,
      description: t.description,
      category: t.category,
      amount_per_installment: Number(t.amount) || 0,
      current: t.installment_current || 1,
      total: t.installment_total || 1,
      remaining: (t.installment_total || 1) - (t.installment_current || 1),
      total_remaining_amount: ((t.installment_total || 1) - (t.installment_current || 1)) * (Number(t.amount) || 0),
      isLast: t.installment_current === t.installment_total,
      member_name: members.find(m => m.user_id === t.user_id)?.display_name || '',
    }));

  const onRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['transactions'] });
    await queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
    await queryClient.invalidateQueries({ queryKey: ['incomes'] });
    await queryClient.invalidateQueries({ queryKey: ['savings_goals'] });
  };

  const memberColors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900" edges={['left', 'right', 'bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-5"
        refreshControl={<RefreshControl refreshing={txLoading} onRefresh={onRefresh} tintColor="#2196f3" colors={['#2196f3']} />}
      >
       <View
       className='mb-4'>
         <MonthSelector
          selectedMonth={selectedMonth}
          onChangeMonth={setSelectedMonth}
          compact
          hideValues={localHideValues}
          onToggleHide={() => setLocalHideValues(!localHideValues)}
        />
       </View>

        {/* Monthly Balance */}
        <View className="rounded-xl p-4 mb-4 border shadow-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <Text className="text-lg font-bold mb-3 text-gray-900 dark:text-slate-100">Balanço Mensal</Text>
          <View className="flex-row justify-between py-2 items-center">
            <Text className="text-base text-gray-500 dark:text-slate-400">Entradas (Renda):</Text>
            <Text className="text-base text-gray-900 dark:text-slate-100">{formatCurrency(rendaTotal, localHideValues)}</Text>
          </View>
          <View className="flex-row justify-between py-2 items-center">
            <Text className="text-base text-gray-500 dark:text-slate-400">Saídas (Débito):</Text>
            <Text className="text-base text-red-500">- {formatCurrency(gastosFixosDebit + gastosMesDebit, localHideValues)}</Text>
          </View>
          <View className="flex-row justify-between py-2 items-center">
            <Text className="text-base text-amber-500">Comprometido (Fatura):</Text>
            <Text className="text-base text-amber-500">- {formatCurrency(invoiceTotal, localHideValues)}</Text>
          </View>
          <View className="flex-row justify-between pt-3 mt-2 items-center border-t border-gray-200 dark:border-slate-700">
            <Text className="text-base font-semibold text-gray-900 dark:text-slate-100">Livre para Gastar:</Text>
            <Text className={`text-lg font-bold ${restante >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {formatCurrency(restante, localHideValues)}
            </Text>
          </View>
        </View>

        {/* Invoice Details */}
        <View className="rounded-xl p-4 mb-4 border border-l-4 border-l-amber-500 shadow-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center gap-2">
              <Ionicons name="card" size={24} color={getIconColor('warning', isDark)} />
              <Text className="text-lg font-bold text-gray-900 dark:text-slate-100">Detalhes da Fatura</Text>
            </View>
            <Text className="text-xl font-bold text-amber-500 dark:text-amber-400">{formatCurrency(invoiceTotal, localHideValues)}</Text>
          </View>
          <View className="h-px my-2 bg-gray-200 dark:bg-slate-700" />
          <View className="flex-row justify-between py-1">
            <Text className="text-sm text-gray-500 dark:text-slate-400">Fixos (Assinaturas):</Text>
            <Text className="text-sm font-semibold text-gray-900 dark:text-slate-100">{formatCurrency(invoiceFixed, localHideValues)}</Text>
          </View>
          <View className="flex-row justify-between py-1">
            <Text className="text-sm text-gray-500 dark:text-slate-400">Variáveis (Compras):</Text>
            <Text className="text-sm font-semibold text-gray-900 dark:text-slate-100">{formatCurrency(invoiceVariable, localHideValues)}</Text>
          </View>
        </View>

        {/* Installments Tracking */}
        {installmentItems.length > 0 && (
          <View className="rounded-xl p-4 mb-4 border border-l-4 border-l-purple-500 shadow-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="layers" size={22} color={isDark ? '#a78bfa' : '#8b5cf6'} />
              <Text className="text-lg font-bold text-gray-900 dark:text-slate-100">Compras Parceladas</Text>
              <View className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Text className="text-xs font-bold text-purple-600 dark:text-purple-400">{installmentItems.length}</Text>
              </View>
            </View>

            <View className="flex-row justify-between items-center mb-3 px-1">
              <Text className="text-xs text-gray-400 dark:text-slate-500">Total parcelas no mês:</Text>
              <Text className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(installmentItems.reduce((sum, i) => sum + i.amount_per_installment, 0), localHideValues)}
              </Text>
            </View>

            {installmentItems.map((item, index) => {
              const progress = item.current / item.total;
              return (
                <View
                  key={`${item.installment_id}-${index}`}
                  className={`p-3 rounded-xl mb-2 ${item.isLast ? 'bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800' : 'bg-gray-50 dark:bg-slate-700/50'}`}
                >
                  <View className="flex-row justify-between items-start mb-1">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900 dark:text-slate-100">{item.description}</Text>
                      <Text className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{item.category} · {item.member_name}</Text>
                    </View>
                    <Text className="text-sm font-bold text-gray-900 dark:text-slate-100">
                      {formatCurrency(item.amount_per_installment, localHideValues)}/mês
                    </Text>
                  </View>

                  {/* Progress bar */}
                  <View className="h-2 rounded-full bg-gray-200 dark:bg-slate-600 mt-2 mb-1.5 overflow-hidden">
                    <View
                      className={`h-full rounded-full ${item.isLast ? 'bg-emerald-500' : 'bg-purple-500'}`}
                      style={{ width: `${Math.min(progress * 100, 100)}%` }}
                    />
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className={`text-xs font-bold ${item.isLast ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400'}`}>
                      {item.isLast ? '✓ Última parcela!' : `${item.current}/${item.total} · faltam ${item.remaining}`}
                    </Text>
                    {!item.isLast && (
                      <Text className="text-xs text-gray-400 dark:text-slate-500">
                        Restante: {formatCurrency(item.total_remaining_amount, localHideValues)}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Total Patrimony */}
        <View className="rounded-xl p-4 mb-4 border shadow-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <Text className="text-lg font-bold mb-3 text-gray-900 dark:text-slate-100">Patrimônio Total</Text>
          <Text className="text-3xl font-bold text-center text-emerald-500 dark:text-emerald-400">{formatCurrency(patrimonioTotal, localHideValues)}</Text>
        </View>

        {/* Savings Goals */}
        <View className="rounded-xl p-4 mb-4 border shadow-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <Text className="text-lg font-bold mb-3 text-gray-900 dark:text-slate-100">Metas de Poupança</Text>
          {savingsGoals.length === 0 ? (
            <Text className="text-center py-4 text-gray-400 dark:text-slate-500">Nenhuma meta cadastrada</Text>
          ) : (
            savingsGoals.map((meta) => (
              <View key={meta.id} className="mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm font-semibold text-gray-900 dark:text-slate-100">{meta.name}</Text>
                  <Text className="text-sm text-gray-500 dark:text-slate-400">
                    {formatCurrency(Number(meta.current_amount) || 0, localHideValues)} / {formatCurrency(Number(meta.target_amount) || 0, localHideValues)}
                  </Text>
                </View>
                <ProgressBar
                  progress={(Number(meta.target_amount) || 0) > 0 ? (Number(meta.current_amount) || 0) / (Number(meta.target_amount) || 1) : 0}
                  showLabels={false}
                />
              </View>
            ))
          )}
        </View>

        {/* Member Spending */}
        <View className="rounded-xl p-4 mb-4 border shadow-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <Text className="text-lg font-bold mb-3 text-gray-900 dark:text-slate-100">Consumo Total</Text>
          {memberSpending.map((member) => (
            <View key={member.id} className="flex-row justify-between py-2 items-center">
              <Text className="text-base text-gray-500 dark:text-slate-400">{member.display_name}:</Text>
              <Text className="text-base text-gray-900 dark:text-slate-100">{formatCurrency(member.total, localHideValues)}</Text>
            </View>
          ))}
          {memberSpending.length > 0 && (
            <>
              <View className="flex-row h-6 rounded-full overflow-hidden mt-3">
                {memberSpending.map((member, index) => (
                  <View
                    key={member.id}
                    style={{
                      flex: member.total || 1,
                      backgroundColor: memberColors[index % memberColors.length],
                      borderTopLeftRadius: index === 0 ? 12 : 0,
                      borderBottomLeftRadius: index === 0 ? 12 : 0,
                      borderTopRightRadius: index === memberSpending.length - 1 ? 12 : 0,
                      borderBottomRightRadius: index === memberSpending.length - 1 ? 12 : 0,
                    }}
                  />
                ))}
              </View>
              <View className="flex-row justify-center gap-6 mt-3 flex-wrap">
                {memberSpending.map((member, index) => (
                  <View key={member.id} className="flex-row items-center gap-1.5">
                    <View className="w-3 h-3 rounded-full" style={{ backgroundColor: memberColors[index % memberColors.length] }} />
                    <Text className="text-xs text-gray-500 dark:text-slate-400">{member.display_name}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        <View className="h-5" />
      </ScrollView>
    </SafeAreaView>
  );
}
