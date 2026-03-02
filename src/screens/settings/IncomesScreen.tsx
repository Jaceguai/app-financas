import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast } from '../../components/Toast';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAddIncome, useDeleteIncome } from '../../hooks/useSupabaseMutations';
import { useIncomes } from '../../hooks/useSupabaseQuery';
import { RendaFormData, rendaSchema } from '../../schemas';
import { useTheme } from '../../theme';
import { formatCurrency, formatCurrencyInput, parseCurrency } from '../../utils/formatters';

export const IncomesScreen: React.FC<{ onGoBack?: () => void }> = ({ onGoBack }) => {
  const { isDark } = useTheme();
  const { workspace, currentMember, members } = useWorkspace();
  const { data: incomes = [], isLoading } = useIncomes(workspace?.id);
  const addIncome = useAddIncome();
  const deleteIncome = useDeleteIncome();

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as const });
  const [hideValues, setHideValues] = useState(false);

  const rendaForm = useForm<RendaFormData>({
    resolver: zodResolver(rendaSchema),
    defaultValues: { descricao: '', valor: '', responsibleMemberId: currentMember?.id },
  });

  const rendaTotal = incomes.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const getMemberName = (memberId: string | null) => {
    if (!memberId) return 'Todos';
    return members.find(m => m.id === memberId)?.display_name || 'Desconhecido';
  };

  const handleAddIncome = rendaForm.handleSubmit(async (data) => {
    if (!workspace) return;
    try {
      const valor = parseCurrency(data.valor);
      await addIncome.mutateAsync({
        workspace_id: workspace.id,
        description: data.descricao.trim(),
        amount: valor,
        responsible_member_id: data.responsibleMemberId || null,
      });
      rendaForm.reset({ descricao: '', valor: '', responsibleMemberId: currentMember?.id });
      setToast({ visible: true, message: 'Renda adicionada!', type: 'success' });
    } catch {
      setToast({ visible: true, message: 'Erro ao adicionar renda', type: 'success' });
    }
  });

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Remover Renda', `Deseja excluir "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteIncome.mutateAsync(id);
            setToast({ visible: true, message: 'Renda removida', type: 'success' });
          } catch {
            setToast({ visible: true, message: 'Erro ao remover', type: 'success' });
          }
        },
      },
    ]);
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
        <Text className="text-lg font-bold text-gray-900 dark:text-slate-100">Rendas Mensais</Text>
        <TouchableOpacity onPress={() => setHideValues(!hideValues)}>
          <Ionicons name={hideValues ? 'eye-off' : 'eye'} size={22} color={isDark ? '#9ca3af' : '#374151'} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="p-4">
          <View className="rounded-xl p-4 mb-4 bg-emerald-50 dark:bg-emerald-900/20">
            <Text className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">Total de Rendas</Text>
            <Text className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(rendaTotal, hideValues)}
            </Text>
          </View>

          <View className="rounded-xl p-4 mb-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <Text className="text-base font-bold mb-3 text-gray-900 dark:text-slate-100">Nova Renda</Text>

            <Controller
              control={rendaForm.control}
              name="descricao"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className={`border rounded-xl p-3.5 text-base mb-3 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${
                    rendaForm.formState.errors.descricao ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'
                  }`}
                  placeholder="Descrição (ex: Salário)"
                  placeholderTextColor="#9ca3af"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {rendaForm.formState.errors.descricao && (
              <Text className="text-red-500 text-xs -mt-1 mb-2 ml-1">{rendaForm.formState.errors.descricao.message}</Text>
            )}

            <Controller
              control={rendaForm.control}
              name="valor"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className={`border rounded-xl p-3.5 text-base mb-3 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${
                    rendaForm.formState.errors.valor ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'
                  }`}
                  placeholder="Valor (R$)"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={(text) => onChange(formatCurrencyInput(text))}
                />
              )}
            />
            {rendaForm.formState.errors.valor && (
              <Text className="text-red-500 text-xs -mt-1 mb-2 ml-1">{rendaForm.formState.errors.valor.message}</Text>
            )}

            <Text className="text-sm font-semibold mb-2 text-gray-700 dark:text-slate-300">Responsável</Text>
            <Controller
              control={rendaForm.control}
              name="responsibleMemberId"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row flex-wrap gap-2 mb-3">
                  <TouchableOpacity
                    onPress={() => onChange(undefined)}
                    className={`px-4 py-2.5 rounded-lg border ${
                      !value
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'
                    }`}
                  >
                    <Text className={!value ? 'text-white font-semibold' : 'text-gray-700 dark:text-slate-300'}>
                      Todos
                    </Text>
                  </TouchableOpacity>
                  {members.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => onChange(m.id)}
                      className={`px-4 py-2.5 rounded-lg border ${
                        value === m.id
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'
                      }`}
                    >
                      <Text className={value === m.id ? 'text-white font-semibold' : 'text-gray-700 dark:text-slate-300'}>
                        {m.display_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />

            <TouchableOpacity
              onPress={handleAddIncome}
              disabled={addIncome.isPending}
              className={`rounded-xl py-4 items-center bg-emerald-500 ${addIncome.isPending ? 'opacity-60' : ''}`}
            >
              <Text className="text-white text-base font-bold">
                {addIncome.isPending ? 'Adicionando...' : '+ Adicionar Renda'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-sm font-bold mb-3 text-gray-500 dark:text-slate-400">
            {incomes.length} {incomes.length === 1 ? 'renda cadastrada' : 'rendas cadastradas'}
          </Text>

          {incomes.map((income) => (
            <View
              key={income.id}
              className="flex-row items-center justify-between p-4 mb-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
            >
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 dark:text-slate-100">
                  {income.description}
                </Text>
                <Text className="text-sm mt-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  {formatCurrency(Number(income.amount), hideValues)}
                </Text>
                <Text className="text-xs mt-1 text-gray-500 dark:text-slate-400">
                  {getMemberName(income.responsible_member_id)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(income.id, income.description)}
                disabled={deleteIncome.isPending}
                className="p-2"
              >
                <Ionicons name="trash-outline" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}

          {incomes.length === 0 && (
            <View className="items-center py-12">
              <Ionicons name="cash-outline" size={64} color={isDark ? '#64748b' : '#9ca3af'} />
              <Text className="text-base font-semibold mt-4 text-gray-900 dark:text-slate-100">
                Nenhuma renda cadastrada
              </Text>
              <Text className="text-sm mt-2 text-gray-500 dark:text-slate-400">
                Adicione suas fontes de renda mensal
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
