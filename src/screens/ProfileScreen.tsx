import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useFixedExpenses, useIncomes, useSavingsGoals } from '../hooks/useSupabaseQuery';
import { useTheme } from '../theme';
import { formatCurrency } from '../utils/formatters';
import { getIconColor } from '../utils/iconColors';

export const ProfileScreen: React.FC = () => {
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();
  const { workspace, currentMember, members, leaveWorkspace, leaveCurrentWorkspace, deleteWorkspace, refreshMembers } = useWorkspace();
  const { data: fixedExpenses = [] } = useFixedExpenses(workspace?.id);
  const { data: incomes = [] } = useIncomes(workspace?.id);
  const { data: savingsGoals = [] } = useSavingsGoals(workspace?.id);

  const [hideValues, setHideValues] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshMembers(),
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] }),
      queryClient.invalidateQueries({ queryKey: ['incomes'] }),
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] }),
    ]);
    setRefreshing(false);
  };

  const displayName = user?.user_metadata?.display_name || currentMember?.display_name || 'Usuário';
  const email = user?.email || '';

  const totalRendas = incomes.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalFixos = fixedExpenses.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalMetas = savingsGoals.reduce((sum, g) => sum + (Number(g.target_amount) || 0), 0);
  const totalEconomizado = savingsGoals.reduce((sum, g) => sum + (Number(g.current_amount) || 0), 0);

  const handleSignOut = () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  // Volta para a lista de workspaces (continua membro)
  const handleSwitchWorkspace = () => {
    Alert.alert(
      'Trocar Workspace',
      'Você continuará como membro deste workspace e poderá voltar a qualquer momento.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Trocar',
          onPress: () => leaveWorkspace(), // Só limpa o estado local
        },
      ]
    );
  };

  // Sai definitivamente do workspace (remove dos membros)
  const handleLeaveWorkspace = () => {
    Alert.alert(
      'Sair Definitivamente',
      'Você será removido deste workspace. Para voltar, precisará usar o código de convite novamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair Definitivamente',
          style: 'destructive',
          onPress: async () => {
            const { error } = await leaveCurrentWorkspace();
            if (error) {
              Alert.alert('Erro', error);
            }
          },
        },
      ]
    );
  };

  const handleDeleteWorkspace = () => {
    const otherMembers = members.filter(m => m.user_id !== user?.id);
    const memberWarning = otherMembers.length > 0
      ? `\n\n⚠️ Este workspace tem ${otherMembers.length} outro${otherMembers.length > 1 ? 's' : ''} membro${otherMembers.length > 1 ? 's' : ''} (${otherMembers.map(m => m.display_name).join(', ')}) que perderão acesso imediatamente.`
      : '';

    Alert.alert(
      'Excluir Workspace',
      `ATENÇÃO: Isso irá excluir TODOS os dados do workspace (transações, rendas, gastos fixos, metas). Esta ação não pode ser desfeita!${memberWarning}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir Tudo',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteWorkspace();
            if (error) {
              Alert.alert('Erro', error);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
      >
        <View className="p-4">
          <View className="items-center mb-6 mt-4">
            <View className="w-24 h-24 rounded-full items-center justify-center bg-blue-500 dark:bg-blue-400 mb-4">
              <Text className="text-white text-4xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900 dark:text-slate-100">{displayName}</Text>
            <Text className="text-sm text-gray-500 dark:text-slate-400 mt-1">{email}</Text>
            {currentMember && (
              <View className="flex-row items-center gap-2 mt-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Ionicons name="shield-checkmark" size={16} color={getIconColor('primary', isDark)} />
                <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {currentMember.role === 'owner' ? 'Dono' : 'Membro'}
                </Text>
              </View>
            )}
          </View>

          {workspace && (
            <View className="rounded-xl p-4 mb-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-bold text-gray-900 dark:text-slate-100">Workspace Atual</Text>
                <TouchableOpacity onPress={() => setHideValues(!hideValues)}>
                  <Ionicons name={hideValues ? 'eye-off' : 'eye'} size={20} color={isDark ? '#9ca3af' : '#374151'} />
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center gap-2 mb-4">
                <Ionicons name="people" size={20} color={getIconColor('primary', isDark)} />
                <Text className="text-base font-semibold text-gray-900 dark:text-slate-100">{workspace.name}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-sm text-gray-500 dark:text-slate-400">Código:</Text>
                <Text className="text-base font-bold tracking-wider text-blue-600 dark:text-blue-400">
                  {workspace.invite_code}
                </Text>
              </View>
              <View className="flex-row items-center gap-2 mt-2">
                <Ionicons name="people-outline" size={16} color={isDark ? '#9ca3af' : '#374151'} />
                <Text className="text-sm text-gray-500 dark:text-slate-400">
                  {members.length} {members.length === 1 ? 'membro' : 'membros'}
                </Text>
              </View>
            </View>
          )}

          <Text className="text-xs font-bold uppercase tracking-wider mb-3 text-gray-400 dark:text-slate-500">
            Resumo Financeiro
          </Text>

          <View className="rounded-xl p-4 mb-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full items-center justify-center bg-emerald-100 dark:bg-emerald-900/30">
                  <Ionicons name="cash" size={22} color={getIconColor('success', isDark)} />
                </View>
                <View>
                  <Text className="text-sm text-emerald-600 dark:text-emerald-400">Total de Rendas</Text>
                  <Text className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(totalRendas, hideValues)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View className="rounded-xl p-4 mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full items-center justify-center bg-red-100 dark:bg-red-900/30">
                  <Ionicons name="card" size={22} color={getIconColor('error', isDark)} />
                </View>
                <View>
                  <Text className="text-sm text-red-600 dark:text-red-400">Total de Gastos Fixos</Text>
                  <Text className="text-xl font-bold text-red-700 dark:text-red-300">
                    {formatCurrency(totalFixos, hideValues)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View className="rounded-xl p-4 mb-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full items-center justify-center bg-blue-100 dark:bg-blue-900/30">
                  <Ionicons name="trending-up" size={22} color={getIconColor('primary', isDark)} />
                </View>
                <View>
                  <Text className="text-sm text-blue-600 dark:text-blue-400">Metas de Poupança</Text>
                  <Text className="text-xl font-bold text-blue-700 dark:text-blue-300">
                    {formatCurrency(totalMetas, hideValues)}
                  </Text>
                  <Text className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                    Economizado: {formatCurrency(totalEconomizado, hideValues)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View className="rounded-xl p-4 mb-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-900/50">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full items-center justify-center bg-purple-100 dark:bg-purple-900/30">
                  <Ionicons name="wallet" size={22} color={getIconColor('purple', isDark)} />
                </View>
                <View>
                  <Text className="text-sm text-purple-600 dark:text-purple-400">Saldo Disponível</Text>
                  <Text className="text-xl font-bold text-purple-700 dark:text-purple-300">
                    {formatCurrency(totalRendas - totalFixos, hideValues)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <Text className="text-xs font-bold uppercase tracking-wider mb-3 mt-6 text-gray-400 dark:text-slate-500">
            Workspace
          </Text>

          {/* Trocar workspace (volta para lista) */}
          <TouchableOpacity
            onPress={handleSwitchWorkspace}
            className="flex-row items-center justify-between p-4 mb-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-blue-100 dark:bg-blue-900/30">
                <Ionicons name="swap-horizontal" size={22} color={getIconColor('primary', isDark)} />
              </View>
              <View>
                <Text className="text-base font-semibold text-gray-900 dark:text-slate-100">
                  Trocar Workspace
                </Text>
                <Text className="text-xs text-gray-500 dark:text-slate-400">
                  Ver outros workspaces
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
          </TouchableOpacity>

          {/* Sair definitivamente (apenas membro) */}
          {currentMember?.role !== 'owner' && (
            <TouchableOpacity
              onPress={handleLeaveWorkspace}
              className="flex-row items-center justify-between p-4 mb-3 rounded-xl bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-900/50"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full items-center justify-center bg-orange-100 dark:bg-orange-900/30">
                  <Ionicons name="exit-outline" size={22} color={getIconColor('warning', isDark)} />
                </View>
                <View>
                  <Text className="text-base font-semibold text-orange-600 dark:text-orange-400">
                    Sair do Workspace
                  </Text>
                  <Text className="text-xs text-orange-500 dark:text-orange-400/70">
                    Deixar de ser membro
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={getIconColor('warning', isDark)} />
            </TouchableOpacity>
          )}

          {/* Excluir workspace (apenas dono) */}
          {currentMember?.role === 'owner' && (
            <TouchableOpacity
              onPress={handleDeleteWorkspace}
              className="flex-row items-center justify-between p-4 mb-3 rounded-xl bg-white dark:bg-slate-800 border border-red-300 dark:border-red-900/50"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full items-center justify-center bg-red-100 dark:bg-red-900/30">
                  <Ionicons name="trash-outline" size={22} color={getIconColor('error', isDark)} />
                </View>
                <View>
                  <Text className="text-base font-semibold text-red-600 dark:text-red-400">
                    Excluir Workspace
                  </Text>
                  <Text className="text-xs text-red-500 dark:text-red-400/70">
                    Remove todos os dados permanentemente
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={getIconColor('error', isDark)} />
            </TouchableOpacity>
          )}

          <Text className="text-xs font-bold uppercase tracking-wider mb-3 mt-6 text-gray-400 dark:text-slate-500">
            Conta
          </Text>

          <TouchableOpacity
            onPress={handleSignOut}
            className="flex-row items-center justify-between p-4 mb-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-gray-100 dark:bg-slate-700">
                <Ionicons name="log-out-outline" size={22} color={isDark ? '#9ca3af' : '#6b7280'} />
              </View>
              <Text className="text-base font-semibold text-gray-700 dark:text-slate-300">
                Sair da Conta
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
          </TouchableOpacity>

          <View className="items-center mt-8 mb-4">
            <Text className="text-xs text-gray-400 dark:text-slate-500">
              App Finanças v1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
