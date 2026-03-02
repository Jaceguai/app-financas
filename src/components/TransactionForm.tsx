import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAddTransaction } from '../hooks/useSupabaseMutations';
import { useProjects } from '../hooks/useSupabaseQuery';
import { TransactionFormData, transactionSchema } from '../schemas';
import { useTheme } from '../theme';
import { CategorySelector } from './CategorySelector';
import { Toast } from './Toast';

export const TransactionForm: React.FC = () => {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const { isDark } = useTheme();
  const addTransaction = useAddTransaction();
  const { data: projects = [] } = useProjects(workspace?.id);
  const activeProjects = projects.filter(p => p.is_active !== false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false, message: '', type: 'info',
  });

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { value: '', description: '', category: 'Alimentação', paymentMethod: 'debit', installments: 1 },
  });

  const paymentMethod = watch('paymentMethod');
  const installments = watch('installments') || 1;

  useEffect(() => {
    if (addTransaction.isSuccess) {
      reset();
      setSelectedProjectId(null);
      addTransaction.reset();
      setToast({ visible: true, message: 'Transação registrada!', type: 'success' });
      setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
    }
  }, [addTransaction.isSuccess]);

  useEffect(() => {
    if (addTransaction.isError) {
      setToast({ visible: true, message: 'Erro ao registrar transação.', type: 'error' });
    }
  }, [addTransaction.isError]);

  const formatCurrency = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    const amount = parseFloat(numbers) / 100;
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseValue = (formattedValue: string): number => parseFloat(formattedValue.replace(/\D/g, '')) / 100;

  const onSubmit = (data: TransactionFormData) => {
    if (!workspace || !user) return;
    addTransaction.mutate({
      workspace_id: workspace.id,
      user_id: user.id,
      description: data.description.trim(),
      amount: parseValue(data.value),
      category: data.category,
      payment_method: data.paymentMethod,
      installments: data.paymentMethod === 'credit' ? data.installments : undefined,
      project_id: selectedProjectId,
    });
  };

  return (
    <>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={() => setToast(t => ({ ...t, visible: false }))} />

      <View className="mx-4 mt-6">
        <Text className="text-base font-semibold mb-3 text-gray-700 dark:text-gray-300">Valor</Text>
        <Controller
          control={control}
          name="value"
          render={({ field: { onChange, value } }) => (
            <View className={`rounded-xl p-4 border shadow-sm bg-white dark:bg-slate-800 ${errors.value ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-700'}`}>
              <Text className="text-sm mb-2 text-gray-500 dark:text-gray-400">R$</Text>
              <TextInput
                className="text-3xl font-bold text-primary-500 dark:text-primary-400"
                value={value}
                onChangeText={(text) => onChange(formatCurrency(text))}
                keyboardType="numeric"
                placeholder="0,00"
                placeholderTextColor="#9ca3af"
              />
            </View>
          )}
        />
        {errors.value && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.value.message}</Text>}
      </View>

      <View className="mx-4 mt-6">
        <Text className="text-base font-semibold mb-3 text-gray-700 dark:text-gray-300">Forma de Pagamento</Text>
        <Controller
          control={control}
          name="paymentMethod"
          render={({ field: { onChange, value } }) => (
            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 py-3.5 rounded-lg items-center border-2 ${
                  value === 'debit'
                    ? 'bg-blue-500 dark:bg-blue-600 border-blue-500 dark:border-blue-600'
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                }`}
                onPress={() => onChange('debit')}
              >
                <Text className={`font-semibold text-sm ${value === 'debit' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  Débito / Pix
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3.5 rounded-lg items-center border-2 ${
                  value === 'credit'
                    ? 'bg-amber-500 dark:bg-amber-600 border-amber-500 dark:border-amber-600'
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                }`}
                onPress={() => onChange('credit')}
              >
                <Text className={`font-semibold text-sm ${value === 'credit' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  Crédito (Fatura)
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      {paymentMethod === 'credit' && (
        <View className="mx-4 mt-6">
          <Text className="text-base font-semibold mb-3 text-gray-700 dark:text-gray-300">Parcelas</Text>
          <View className="rounded-xl p-4 border shadow-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Ionicons name="card-outline" size={20} color="#f59e0b" />
                <Text className="text-base font-bold text-gray-900 dark:text-white">
                  {installments}x
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={() => setValue('installments', Math.max(1, installments - 1))}
                  className="w-9 h-9 rounded-lg items-center justify-center bg-gray-100 dark:bg-slate-700"
                >
                  <Ionicons name="remove" size={20} color="#9ca3af" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setValue('installments', Math.min(48, installments + 1))}
                  className="w-9 h-9 rounded-lg items-center justify-center bg-gray-100 dark:bg-slate-700"
                >
                  <Ionicons name="add" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => setValue('installments', n)}
                  className={`px-4 py-2 rounded-lg border ${
                    installments === n
                      ? 'bg-amber-500 dark:bg-amber-600 border-amber-500 dark:border-amber-600'
                      : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'
                  }`}
                >
                  <Text className={`text-sm font-semibold ${installments === n ? 'text-white' : 'text-gray-600 dark:text-slate-300'}`}>
                    {n}x
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      <View className="mx-4 mt-6">
        <Text className="text-base font-semibold mb-3 text-gray-700 dark:text-gray-300">Descrição</Text>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className={`rounded-xl p-4 text-base border shadow-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                errors.description ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-700'
              }`}
              value={value}
              onChangeText={onChange}
              placeholder="Ex: Supermercado"
              placeholderTextColor="#9ca3af"
            />
          )}
        />
        {errors.description && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.description.message}</Text>}
      </View>

      <Controller
        control={control}
        name="category"
        render={({ field: { onChange, value } }) => (
          <CategorySelector selectedCategory={value} onSelectCategory={onChange} />
        )}
      />

      {activeProjects.length > 0 && (
        <View className="mx-4 mt-6">
          <Text className="text-base font-semibold mb-3 text-gray-700 dark:text-gray-300">Projeto (opcional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            <TouchableOpacity
              onPress={() => setSelectedProjectId(null)}
              className={`flex-row items-center px-4 py-2.5 rounded-xl border gap-2 ${
                selectedProjectId === null
                  ? 'bg-gray-700 dark:bg-gray-200 border-gray-700 dark:border-gray-200'
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
              }`}
            >
              <Ionicons name="close-circle" size={16} color={selectedProjectId === null ? (isDark ? '#111827' : '#ffffff') : (isDark ? '#94a3b8' : '#6b7280')} />
              <Text className={`text-xs font-semibold ${selectedProjectId === null ? 'text-white dark:text-gray-900' : 'text-gray-600 dark:text-slate-300'}`}>
                Nenhum
              </Text>
            </TouchableOpacity>
            {activeProjects.map((proj) => (
              <TouchableOpacity
                key={proj.id}
                onPress={() => setSelectedProjectId(proj.id)}
                className={`flex-row items-center px-4 py-2.5 rounded-xl border gap-2 ${
                  selectedProjectId === proj.id
                    ? 'border-transparent'
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                }`}
                style={selectedProjectId === proj.id ? { backgroundColor: proj.color } : {}}
              >
                <Ionicons
                  name={proj.icon as any}
                  size={16}
                  color={selectedProjectId === proj.id ? '#ffffff' : proj.color}
                />
                <Text className={`text-xs font-semibold ${selectedProjectId === proj.id ? 'text-white' : 'text-gray-600 dark:text-slate-300'}`}>
                  {proj.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View className="mx-4 mt-6">
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={addTransaction.isPending}
          className={`rounded-xl py-4 ${
            addTransaction.isPending
              ? 'bg-gray-400 dark:bg-gray-600'
              : 'bg-primary-500 dark:bg-primary-600'
          }`}
        >
          {addTransaction.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-center text-lg font-bold">Confirmar Gasto</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
};
