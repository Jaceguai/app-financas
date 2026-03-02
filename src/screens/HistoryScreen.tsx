import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MonthSelector, getCurrentMonth } from '../components/MonthSelector';
import { CATEGORIES } from '../constants/categories';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useTransactions as useTransactionsQuery } from '../hooks/useSupabaseQuery';
import { useTheme } from '../theme';
import { Transaction } from '../types';

export const HistoryScreen: React.FC = () => {
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const { workspace, members } = useWorkspace();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const { data: transactions = [], isLoading } = useTransactionsQuery(workspace?.id, selectedMonth);

  const [filterCategory, setFilterCategory] = useState<string>('Todas');
  const [filterUser, setFilterUser] = useState<string>('Todos');
  const [filterPayment, setFilterPayment] = useState<'all' | 'debit' | 'credit'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [refreshing, setRefreshing] = useState(false);

  const getMemberName = (userId: string) => {
    return members.find(m => m.user_id === userId)?.display_name || 'Desconhecido';
  };

  const uniqueUsers = useMemo(() => {
    const userIds = new Set(transactions.map(t => t.user_id));
    const userNames = Array.from(userIds).map(id => ({
      id,
      name: getMemberName(id),
    }));
    return [{ id: 'Todos', name: 'Todos' }, ...userNames];
  }, [transactions, members]);

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];
    if (filterCategory !== 'Todas') filtered = filtered.filter(t => t.category === filterCategory);
    if (filterUser !== 'Todos') filtered = filtered.filter(t => t.user_id === filterUser);
    if (filterPayment !== 'all') filtered = filtered.filter(t => t.payment_method === filterPayment);
    filtered.sort((a, b) => {
      const dateA = new Date(a.transaction_date).getTime();
      const dateB = new Date(b.transaction_date).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return filtered;
  }, [transactions, filterCategory, filterUser, filterPayment, sortOrder]);

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['transactions'] });
    setRefreshing(false);
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const date = new Date(item.transaction_date);
    const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const memberName = getMemberName(item.user_id);
    const isCredit = item.payment_method === 'credit';
    const isInstallment = item.installment_total && item.installment_total > 1;
    const isLastInstallment = isInstallment && item.installment_current === item.installment_total;
    const remaining = isInstallment ? (item.installment_total! - item.installment_current!) : 0;

    return (
      <View className="rounded-xl p-4 mb-3 border shadow-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900 dark:text-slate-100">{item.description}</Text>
            <View className="flex-row items-center gap-2 mt-1">
              <Text className="text-sm text-gray-400 dark:text-slate-500">{item.category}</Text>
              {isInstallment && (
                <View className={`flex-row items-center px-2 py-0.5 rounded ${isLastInstallment ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                  <Text className={`text-xs font-bold ${isLastInstallment ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {isLastInstallment ? '✓ Última parcela' : `${item.installment_current}/${item.installment_total}x · faltam ${remaining}`}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Text className="text-lg font-bold text-red-500 dark:text-red-400">-R$ {Number(item.amount).toFixed(2)}</Text>
        </View>
        <View className="flex-row justify-between items-end mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
          <View className="gap-1.5">
            <Text className="text-xs text-gray-400 dark:text-slate-500">{formattedDate} às {formattedTime}</Text>
            <View className={`flex-row items-center self-start px-2 py-0.5 rounded ${isCredit ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
              <Ionicons name={isCredit ? 'card' : 'wallet'} size={12} color={isCredit ? '#f59e0b' : '#3b82f6'} style={{marginRight: 4}} />
              <Text className={`text-xs font-semibold ${isCredit ? 'text-amber-500 dark:text-amber-400' : 'text-primary-500 dark:text-primary-400'}`}>
                {isCredit ? 'Crédito' : 'Débito/Pix'}
              </Text>
            </View>
          </View>
          <View className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20">
            <Text className="text-xs font-medium text-blue-500 dark:text-blue-400">{memberName}</Text>
          </View>
        </View>
      </View>
    );
  };

  const FilterChip = ({ active, icon, label, onPress }: { active: boolean; icon: string; label: string; onPress: () => void }) => (
    <TouchableOpacity
      className={`flex-row items-center px-4 py-2.5 rounded-xl border gap-2 ${
        active
          ? 'bg-blue-500 dark:bg-blue-600 border-blue-500 dark:border-blue-600'
          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
      }`}
      onPress={onPress}
    >
      <Ionicons name={icon as any} size={14} color={active ? '#ffffff' : (isDark ? '#94a3b8' : '#6b7280')} />
      <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-gray-600 dark:text-slate-300'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900" edges={['left', 'right', 'bottom']}>
      <View className="p-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900 dark:text-slate-100">Histórico</Text>
        <Text className="text-sm mt-1 text-gray-500 dark:text-slate-400">
          {filteredAndSortedTransactions.length} de {transactions.length} transações
        </Text>
      </View>

      <MonthSelector selectedMonth={selectedMonth} onChangeMonth={setSelectedMonth} />

      <View className="py-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-4 gap-2">
          <FilterChip
            active={false}
            icon={sortOrder === 'newest' ? 'arrow-down' : 'arrow-up'}
            label={sortOrder === 'newest' ? 'Mais recentes' : 'Mais antigas'}
            onPress={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
          />
          <FilterChip
            active={filterCategory !== 'Todas'}
            icon="pricetag"
            label={filterCategory}
            onPress={() => {
              const categories = ['Todas', ...CATEGORIES];
              const currentIndex = categories.indexOf(filterCategory);
              setFilterCategory(categories[(currentIndex + 1) % categories.length]);
            }}
          />
          <FilterChip
            active={filterUser !== 'Todos'}
            icon="person"
            label={uniqueUsers.find(u => u.id === filterUser)?.name || 'Todos'}
            onPress={() => {
              const currentIndex = uniqueUsers.findIndex(u => u.id === filterUser);
              setFilterUser(uniqueUsers[(currentIndex + 1) % uniqueUsers.length].id);
            }}
          />
          <FilterChip
            active={filterPayment !== 'all'}
            icon={filterPayment === 'credit' ? 'card' : 'wallet'}
            label={filterPayment === 'all' ? 'Todos' : filterPayment === 'credit' ? 'Crédito' : 'Débito'}
            onPress={() => {
              const methods: Array<'all' | 'debit' | 'credit'> = ['all', 'debit', 'credit'];
              const currentIndex = methods.indexOf(filterPayment);
              setFilterPayment(methods[(currentIndex + 1) % methods.length]);
            }}
          />
        </ScrollView>
      </View>

      {filteredAndSortedTransactions.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8 gap-3">
          <Ionicons name="filter-outline" size={48} color={isDark ? '#64748b' : '#9ca3af'} />
          <Text className="text-center text-base mt-2 text-gray-400 dark:text-slate-500">
            {transactions.length === 0 ? 'Nenhuma transação registrada ainda.' : 'Nenhuma transação encontrada com esses filtros.'}
          </Text>
          <Text className="text-center text-sm mt-1 text-gray-400 dark:text-slate-500">
            {transactions.length === 0 ? 'Suas transações aparecerão aqui.' : 'Tente ajustar os filtros acima.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4 pt-2 pb-5"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2196f3"
              colors={['#2196f3']}
              progressBackgroundColor={isDark ? '#1e293b' : '#ffffff'}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};
