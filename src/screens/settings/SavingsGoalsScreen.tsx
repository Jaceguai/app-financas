import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast } from '../../components/Toast';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAddSavingsGoal, useDeleteSavingsGoal, useDepositToGoal } from '../../hooks/useSupabaseMutations';
import { useSavingsGoals } from '../../hooks/useSupabaseQuery';
import { DepositoMetaFormData, MetaFormData, depositoMetaSchema, metaSchema } from '../../schemas';
import { useTheme } from '../../theme';
import { formatCurrency, formatCurrencyInput, parseCurrency } from '../../utils/formatters';

export const SavingsGoalsScreen: React.FC<{ onGoBack?: () => void }> = ({ onGoBack }) => {
  const { isDark } = useTheme();
  const { workspace } = useWorkspace();
  const navigation = useNavigation();
  const { data: savingsGoals = [] } = useSavingsGoals(workspace?.id);
  const addSavingsGoal = useAddSavingsGoal();
  const depositToGoal = useDepositToGoal();
  const deleteSavingsGoal = useDeleteSavingsGoal();

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as const });
  const [hideValues, setHideValues] = useState(false);
  const [depositModal, setDepositModal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState('');

  const metaForm = useForm<MetaFormData>({
    resolver: zodResolver(metaSchema),
    defaultValues: { nome: '', objetivo: '', atual: '' },
  });

  const depositForm = useForm<DepositoMetaFormData>({
    resolver: zodResolver(depositoMetaSchema),
    defaultValues: { valor: '' },
  });

  const handleAddGoal = metaForm.handleSubmit(async (data) => {
    if (!workspace) return;
    try {
      const objetivo = parseCurrency(data.objetivo);
      const atual = data.atual && data.atual.trim() !== '' ? parseCurrency(data.atual) : 0;
      await addSavingsGoal.mutateAsync({
        workspace_id: workspace.id,
        name: data.nome.trim(),
        target_amount: objetivo,
        current_amount: atual,
      });
      metaForm.reset({ nome: '', objetivo: '', atual: '' });
      setToast({ visible: true, message: 'Meta criada!', type: 'success' });
    } catch {
      setToast({ visible: true, message: 'Erro ao criar meta', type: 'success' });
    }
  });

  const handleDeposit = depositForm.handleSubmit(async (data) => {
    try {
      const val = parseCurrency(data.valor);
      await depositToGoal.mutateAsync({ id: selectedGoalId, amount: val });
      setToast({ visible: true, message: 'Depósito realizado!', type: 'success' });
      setDepositModal(false);
      depositForm.reset();
    } catch {
      setToast({ visible: true, message: 'Erro ao depositar', type: 'success' });
    }
  });

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Remover Meta', `Deseja excluir "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSavingsGoal.mutateAsync(id);
            setToast({ visible: true, message: 'Meta removida', type: 'success' });
          } catch {
            setToast({ visible: true, message: 'Erro ao remover', type: 'success' });
          }
        },
      },
    ]);
  };

  const openDepositModal = (goalId: string) => {
    setSelectedGoalId(goalId);
    setDepositModal(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={() => setToast({ ...toast, visible: false })} />

      <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
        {onGoBack && (
          <TouchableOpacity onPress={onGoBack}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#111827'} />
          </TouchableOpacity>
        )}
        <Text className="text-lg font-bold text-gray-900 dark:text-slate-100">Metas de Poupança</Text>
        <TouchableOpacity onPress={() => setHideValues(!hideValues)}>
          <Ionicons name={hideValues ? 'eye-off' : 'eye'} size={22} color={isDark ? '#9ca3af' : '#374151'} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="p-4">
          <View className="rounded-xl p-4 mb-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <Text className="text-base font-bold mb-3 text-gray-900 dark:text-slate-100">Nova Meta</Text>

            <Controller
              control={metaForm.control}
              name="nome"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className={`border rounded-xl p-3.5 text-base mb-3 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${
                    metaForm.formState.errors.nome ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'
                  }`}
                  placeholder="Nome da meta (ex: Viagem)"
                  placeholderTextColor="#9ca3af"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {metaForm.formState.errors.nome && (
              <Text className="text-red-500 text-xs -mt-1 mb-2 ml-1">{metaForm.formState.errors.nome.message}</Text>
            )}

            <Controller
              control={metaForm.control}
              name="objetivo"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className={`border rounded-xl p-3.5 text-base mb-3 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${
                    metaForm.formState.errors.objetivo ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'
                  }`}
                  placeholder="Valor objetivo (R$)"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={(text) => onChange(formatCurrencyInput(text))}
                />
              )}
            />
            {metaForm.formState.errors.objetivo && (
              <Text className="text-red-500 text-xs -mt-1 mb-2 ml-1">{metaForm.formState.errors.objetivo.message}</Text>
            )}

            <Controller
              control={metaForm.control}
              name="atual"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="border rounded-xl p-3.5 text-base mb-3 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600"
                  placeholder="Valor atual (opcional)"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={(text) => onChange(formatCurrencyInput(text))}
                />
              )}
            />

            <TouchableOpacity
              onPress={handleAddGoal}
              disabled={addSavingsGoal.isPending}
              className={`rounded-xl py-4 items-center bg-blue-500 ${addSavingsGoal.isPending ? 'opacity-60' : ''}`}
            >
              <Text className="text-white text-base font-bold">
                {addSavingsGoal.isPending ? 'Criando...' : '+ Criar Meta'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-sm font-bold mb-3 text-gray-500 dark:text-slate-400">
            {savingsGoals.length} {savingsGoals.length === 1 ? 'meta cadastrada' : 'metas cadastradas'}
          </Text>

          {savingsGoals.map((goal) => {
            const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
            return (
              <TouchableOpacity
                key={goal.id}
                activeOpacity={0.85}
                onPress={() => (navigation as any).navigate('SavingsGoalDetail', { goalId: goal.id, goalName: goal.name })}
                className="p-4 mb-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 dark:text-slate-100">
                      {goal.name}
                    </Text>
                    <Text className="text-sm mt-1 text-gray-500 dark:text-slate-400">
                      Meta: {formatCurrency(Number(goal.target_amount), hideValues)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(goal.id, goal.name)}
                    disabled={deleteSavingsGoal.isPending}
                    className="p-2"
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                <View className="mb-2">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(Number(goal.current_amount), hideValues)}
                    </Text>
                    <Text className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                      {progress.toFixed(0)}%
                    </Text>
                  </View>
                  <View className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </View>
                </View>

                <View className="flex-row gap-2 mt-2">
                  <TouchableOpacity
                    onPress={() => openDepositModal(goal.id)}
                    className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20"
                  >
                    <Ionicons name="add-circle" size={18} color="#3b82f6" />
                    <Text className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                      Depositar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => (navigation as any).navigate('SavingsGoalDetail', { goalId: goal.id, goalName: goal.name })}
                    className="flex-row items-center justify-center gap-1 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-slate-700"
                  >
                    <Ionicons name="time-outline" size={16} color={isDark ? '#94a3b8' : '#6b7280'} />
                    <Text className="text-gray-600 dark:text-slate-400 font-semibold text-sm">
                      Histórico
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}

          {savingsGoals.length === 0 && (
            <View className="items-center py-12">
              <Ionicons name="trending-up-outline" size={64} color={isDark ? '#64748b' : '#9ca3af'} />
              <Text className="text-base font-semibold mt-4 text-gray-900 dark:text-slate-100">
                Nenhuma meta cadastrada
              </Text>
              <Text className="text-sm mt-2 text-gray-500 dark:text-slate-400">
                Crie metas de poupança para seus objetivos
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={depositModal} animationType="fade" transparent onRequestClose={() => setDepositModal(false)}>
        <Pressable className="flex-1 bg-black/50 justify-center items-center" onPress={() => setDepositModal(false)}>
          <Pressable className="bg-white dark:bg-slate-800 rounded-2xl p-6 mx-4 w-full max-w-sm" onPress={(e) => e.stopPropagation()}>
            <Text className="text-xl font-bold mb-4 text-gray-900 dark:text-slate-100">Adicionar Depósito</Text>

            <Controller
              control={depositForm.control}
              name="valor"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className={`border rounded-xl p-3.5 text-base mb-3 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${
                    depositForm.formState.errors.valor ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'
                  }`}
                  placeholder="Valor do depósito (R$)"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={(text) => onChange(formatCurrencyInput(text))}
                />
              )}
            />
            {depositForm.formState.errors.valor && (
              <Text className="text-red-500 text-xs -mt-1 mb-2 ml-1">{depositForm.formState.errors.valor.message}</Text>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setDepositModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-slate-600"
              >
                <Text className="text-center font-semibold text-gray-700 dark:text-slate-300">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeposit}
                disabled={depositToGoal.isPending}
                className={`flex-1 py-3 rounded-xl bg-blue-500 ${depositToGoal.isPending ? 'opacity-60' : ''}`}
              >
                <Text className="text-center font-semibold text-white">
                  {depositToGoal.isPending ? 'Depositando...' : 'Depositar'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};
