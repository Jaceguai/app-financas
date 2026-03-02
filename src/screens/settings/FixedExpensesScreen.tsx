import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast } from '../../components/Toast';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAddFixedExpense, useDeleteFixedExpense } from '../../hooks/useSupabaseMutations';
import { useFixedExpenses } from '../../hooks/useSupabaseQuery';
import { FixedExpenseFormData, fixedExpenseSchema } from '../../schemas';
import { useTheme } from '../../theme';
import { formatCurrency, formatCurrencyInput, parseCurrency } from '../../utils/formatters';

export const FixedExpensesScreen: React.FC<{ onGoBack?: () => void }> = ({ onGoBack }) => {
  const { isDark } = useTheme();
  const { workspace, currentMember, members } = useWorkspace();
  const { data: fixedExpenses = [], isLoading } = useFixedExpenses(workspace?.id);
  const addFixedExpense = useAddFixedExpense();
  const deleteFixedExpense = useDeleteFixedExpense();

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as const });
  const [hideValues, setHideValues] = useState(false);

  const fixedForm = useForm<FixedExpenseFormData>({
    resolver: zodResolver(fixedExpenseSchema),
    defaultValues: { descricao: '', valor: '', responsibleMemberId: undefined, paymentMethod: 'debit' },
  });

  const totalFixos = fixedExpenses.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const handleAddFixed = fixedForm.handleSubmit(async (data) => {
    if (!workspace) return;
    try {
      const valor = parseCurrency(data.valor);
      await addFixedExpense.mutateAsync({
        workspace_id: workspace.id,
        description: data.descricao.trim(),
        amount: valor,
        responsible_member_id: data.responsibleMemberId || null,
        payment_method: data.paymentMethod,
      });
      fixedForm.reset({ descricao: '', valor: '', responsibleMemberId: undefined, paymentMethod: 'debit' });
      setToast({ visible: true, message: 'Gasto fixo adicionado!', type: 'success' });
    } catch {
      setToast({ visible: true, message: 'Erro ao adicionar gasto fixo', type: 'success' });
    }
  });

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Remover Gasto Fixo', `Deseja excluir "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFixedExpense.mutateAsync(id);
            setToast({ visible: true, message: 'Gasto fixo removido', type: 'success' });
          } catch {
            setToast({ visible: true, message: 'Erro ao remover', type: 'success' });
          }
        },
      },
    ]);
  };

  const getMemberName = (memberId: string | null) => {
    if (!memberId) return 'Todos';
    return members.find(m => m.id === memberId)?.display_name || 'Desconhecido';
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
        <Text className="text-lg font-bold text-gray-900 dark:text-slate-100">Gastos Fixos</Text>
        <TouchableOpacity onPress={() => setHideValues(!hideValues)}>
          <Ionicons name={hideValues ? 'eye-off' : 'eye'} size={22} color={isDark ? '#9ca3af' : '#374151'} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="p-4">
          <View className="rounded-xl p-4 mb-4 bg-red-50 dark:bg-red-900/20">
            <Text className="text-sm text-red-600 dark:text-red-400 mb-1">Total de Gastos Fixos</Text>
            <Text className="text-2xl font-bold text-red-700 dark:text-red-300">
              {formatCurrency(totalFixos, hideValues)}
            </Text>
          </View>

          <View className="rounded-xl p-4 mb-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <Text className="text-base font-bold mb-3 text-gray-900 dark:text-slate-100">Novo Gasto Fixo</Text>

            <Controller
              control={fixedForm.control}
              name="descricao"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className={`border rounded-xl p-3.5 text-base mb-3 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${
                    fixedForm.formState.errors.descricao ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'
                  }`}
                  placeholder="Descrição (ex: Aluguel)"
                  placeholderTextColor="#9ca3af"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {fixedForm.formState.errors.descricao && (
              <Text className="text-red-500 text-xs -mt-1 mb-2 ml-1">{fixedForm.formState.errors.descricao.message}</Text>
            )}

            <Controller
              control={fixedForm.control}
              name="valor"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className={`border rounded-xl p-3.5 text-base mb-3 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${
                    fixedForm.formState.errors.valor ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'
                  }`}
                  placeholder="Valor (R$)"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={(text) => onChange(formatCurrencyInput(text))}
                />
              )}
            />
            {fixedForm.formState.errors.valor && (
              <Text className="text-red-500 text-xs -mt-1 mb-2 ml-1">{fixedForm.formState.errors.valor.message}</Text>
            )}

            <Text className="text-sm font-semibold mb-2 text-gray-700 dark:text-slate-300">Método de Pagamento</Text>
            <Controller
              control={fixedForm.control}
              name="paymentMethod"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row gap-2 mb-3">
                  <TouchableOpacity
                    onPress={() => onChange('debit')}
                    className={`flex-1 py-3 rounded-lg border ${
                      value === 'debit'
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'
                    }`}
                  >
                    <Text className={`text-center font-semibold ${value === 'debit' ? 'text-white' : 'text-gray-700 dark:text-slate-300'}`}>
                      Débito
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onChange('credit')}
                    className={`flex-1 py-3 rounded-lg border ${
                      value === 'credit'
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'
                    }`}
                  >
                    <Text className={`text-center font-semibold ${value === 'credit' ? 'text-white' : 'text-gray-700 dark:text-slate-300'}`}>
                      Crédito
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            />

            <Text className="text-sm font-semibold mb-2 text-gray-700 dark:text-slate-300">Responsável</Text>
            <Controller
              control={fixedForm.control}
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
              onPress={handleAddFixed}
              disabled={addFixedExpense.isPending}
              className={`rounded-xl py-4 items-center bg-red-500 ${addFixedExpense.isPending ? 'opacity-60' : ''}`}
            >
              <Text className="text-white text-base font-bold">
                {addFixedExpense.isPending ? 'Adicionando...' : '+ Adicionar Gasto Fixo'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-sm font-bold mb-3 text-gray-500 dark:text-slate-400">
            {fixedExpenses.length} {fixedExpenses.length === 1 ? 'gasto cadastrado' : 'gastos cadastrados'}
          </Text>

          {fixedExpenses.map((expense) => (
            <View
              key={expense.id}
              className="flex-row items-center justify-between p-4 mb-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
            >
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 dark:text-slate-100">
                  {expense.description}
                </Text>
                <Text className="text-sm mt-1 text-red-600 dark:text-red-400 font-semibold">
                  {formatCurrency(Number(expense.amount), hideValues)}
                </Text>
                <View className="flex-row items-center gap-2 mt-1">
                  <Text className="text-xs text-gray-500 dark:text-slate-400">
                    {expense.payment_method === 'credit' ? '💳 Crédito' : '💰 Débito'}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-slate-400">
                    • {getMemberName(expense.responsible_member_id)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(expense.id, expense.description)}
                disabled={deleteFixedExpense.isPending}
                className="p-2"
              >
                <Ionicons name="trash-outline" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}

          {fixedExpenses.length === 0 && (
            <View className="items-center py-12">
              <Ionicons name="card-outline" size={64} color={isDark ? '#64748b' : '#9ca3af'} />
              <Text className="text-base font-semibold mt-4 text-gray-900 dark:text-slate-100">
                Nenhum gasto fixo cadastrado
              </Text>
              <Text className="text-sm mt-2 text-gray-500 dark:text-slate-400">
                Adicione seus gastos mensais fixos
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
