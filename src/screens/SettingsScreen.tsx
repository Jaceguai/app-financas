import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    Text, TextInput, TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import {
    useAddFixedExpense,
    useAddIncome,
    useAddSavingsGoal,
    useDeleteFixedExpense,
    useDeleteIncome,
    useDeleteSavingsGoal,
    useDepositToGoal,
    useUpdateConfig,
} from '../hooks/useSupabaseMutations';
import { useFixedExpenses, useIncomes, useSavingsGoals, useWorkspaceConfig } from '../hooks/useSupabaseQuery';
import {
    ConfigFormData,
    DepositoMetaFormData,
    FixedExpenseFormData,
    MetaFormData,
    RendaFormData,
    configSchema,
    depositoMetaSchema,
    fixedExpenseSchema,
    metaSchema,
    rendaSchema,
} from '../schemas';
import { useTheme } from '../theme';
import { formatCurrency, formatCurrencyInput, parseCurrency as parseCurrencyUtil } from '../utils/formatters';
import { getIconColor } from '../utils/iconColors';
import { MembersScreen } from './workspace/MembersScreen';

export const SettingsScreen: React.FC = () => {
  const { theme, isDark, themeMode, setThemeMode } = useTheme();
  const { signOut } = useAuth();
  const { workspace, members, currentMember, leaveWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const { data: fixedExpenses = [] } = useFixedExpenses(workspace?.id);
  const { data: incomes = [] } = useIncomes(workspace?.id);
  const { data: savingsGoals = [] } = useSavingsGoals(workspace?.id);
  const { data: config = [] } = useWorkspaceConfig(workspace?.id);

  const addFixedExpense = useAddFixedExpense();
  const deleteFixedExpenseMut = useDeleteFixedExpense();
  const addIncome = useAddIncome();
  const deleteIncomeMut = useDeleteIncome();
  const addSavingsGoal = useAddSavingsGoal();
  const depositToGoal = useDepositToGoal();
  const deleteSavingsGoalMut = useDeleteSavingsGoal();
  const updateConfig = useUpdateConfig();

  const extraConfig = config.find(c => c.key === 'extraGastosVariaveis');
  const extraGastosVariaveis = extraConfig ? Number(extraConfig.value) || 1000 : 1000;

  const rendaTotal = incomes.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalFixos = fixedExpenses.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false, message: '', type: 'success',
  });
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hideRendaValues, setHideRendaValues] = useState(false);
  const [hideFixosValues, setHideFixosValues] = useState(false);
  const [hideMetasValues, setHideMetasValues] = useState(false);
  const [depositModal, setDepositModal] = useState(false);
  const [depositId, setDepositId] = useState('');
  const [showMembers, setShowMembers] = useState(false);

  const rendaForm = useForm<RendaFormData>({
    resolver: zodResolver(rendaSchema),
    defaultValues: { descricao: '', valor: '', responsibleMemberId: currentMember?.id },
  });

  const fixedForm = useForm<FixedExpenseFormData>({
    resolver: zodResolver(fixedExpenseSchema),
    defaultValues: { descricao: '', valor: '', responsibleMemberId: undefined, paymentMethod: 'debit' },
  });

  const metaForm = useForm<MetaFormData>({
    resolver: zodResolver(metaSchema),
    defaultValues: { nome: '', objetivo: '', atual: '' },
  });

  const depositForm = useForm<DepositoMetaFormData>({
    resolver: zodResolver(depositoMetaSchema),
    defaultValues: { valor: '' },
  });

  const configForm = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: { extraGastosVariaveis: String(extraGastosVariaveis) },
  });

  const getMemberName = (memberId: string | null) => {
    if (!memberId) return 'Todos';
    return members.find(m => m.id === memberId)?.display_name || 'Desconhecido';
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ visible: true, message, type });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] }),
      queryClient.invalidateQueries({ queryKey: ['incomes'] }),
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] }),
      queryClient.invalidateQueries({ queryKey: ['workspace_settings'] }),
    ]);
    setRefreshing(false);
    showToast('Dados atualizados!', 'success');
  };

  const handleAddSalario = rendaForm.handleSubmit(async (data) => {
    if (!workspace) return;
    setLoadingAction('salary');
    Keyboard.dismiss();
    try {
      const valor = parseCurrencyUtil(data.valor);
      await addIncome.mutateAsync({
        workspace_id: workspace.id,
        description: data.descricao.trim(),
        amount: valor,
        responsible_member_id: data.responsibleMemberId || null,
      });
      rendaForm.reset();
      showToast('Renda salva!', 'success');
    } catch { showToast('Erro ao salvar.', 'error'); }
    finally { setLoadingAction(null); }
  });

  const handleAddFixo = fixedForm.handleSubmit(async (data) => {
    if (!workspace) return;
    setLoadingAction('fixed');
    Keyboard.dismiss();
    try {
      const valor = parseCurrencyUtil(data.valor);
      await addFixedExpense.mutateAsync({
        workspace_id: workspace.id,
        description: data.descricao.trim(),
        amount: valor,
        responsible_member_id: data.responsibleMemberId || null,
        payment_method: data.paymentMethod,
      });
      fixedForm.reset();
      showToast('Gasto fixo salvo!', 'success');
    } catch { showToast('Erro ao salvar.', 'error'); }
    finally { setLoadingAction(null); }
  });

  const handleAddMeta = metaForm.handleSubmit(async (data) => {
    if (!workspace) return;
    setLoadingAction('meta');
    Keyboard.dismiss();
    try {
      const objetivo = parseCurrencyUtil(data.objetivo);
      const atual = data.atual && data.atual.trim() !== '' ? parseCurrencyUtil(data.atual) : 0;
      await addSavingsGoal.mutateAsync({
        workspace_id: workspace.id,
        name: data.nome.trim(),
        target_amount: objetivo,
        current_amount: atual,
      });
      metaForm.reset();
      showToast('Meta criada!', 'success');
    } catch { showToast('Erro ao criar meta.', 'error'); }
    finally { setLoadingAction(null); }
  });

  const handleSaveConfig = configForm.handleSubmit(async (data) => {
    if (!workspace) return;
    setLoadingAction('config');
    Keyboard.dismiss();
    try {
      const num = parseCurrencyUtil(data.extraGastosVariaveis);
      await updateConfig.mutateAsync({
        workspaceId: workspace.id,
        key: 'extraGastosVariaveis',
        value: String(num),
      });
      showToast('Limite atualizado!', 'success');
    } catch { showToast('Erro ao atualizar.', 'error'); }
    finally { setLoadingAction(null); }
  });

  const handleDeposit = depositForm.handleSubmit(async (data) => {
    setLoadingAction('deposit');
    try {
      const val = parseCurrencyUtil(data.valor);
      await depositToGoal.mutateAsync({ id: depositId, amount: val });
      showToast('Depósito realizado!', 'success');
      setDepositModal(false);
      depositForm.reset();
    } catch { showToast('Falha no depósito.', 'error'); }
    finally { setLoadingAction(null); }
  });

  const handleDeleteItem = (id: string, name: string, deleteFn: { mutateAsync: (id: string) => Promise<any> }) => {
    Alert.alert('Remover', `Excluir "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          setLoadingAction(`delete-${id}`);
          try {
            await deleteFn.mutateAsync(id);
            showToast('Item removido.', 'success');
          } catch { showToast('Erro ao remover.', 'error'); }
          finally { setLoadingAction(null); }
        },
      },
    ]);
  };

  const handleSignOut = () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const handleLeaveWorkspace = () => {
    Alert.alert('Sair do Workspace', 'Você poderá entrar novamente com o código de convite.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => leaveWorkspace() },
    ]);
  };

  if (showMembers) {
    return <MembersScreen onGoBack={() => setShowMembers(false)} />;
  }

  const inputCls = (hasError: boolean) =>
    `border rounded-lg p-3 text-base mb-2.5 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${hasError ? 'border-red-500 border-2' : 'border-gray-200 dark:border-slate-600'}`;

  const ResponsibleSelector = ({ value, onChange }: { value?: string; onChange: (v?: string) => void }) => (
    <View className="flex-row gap-2 mb-3 flex-wrap">
      <TouchableOpacity
        className={`flex-1 min-w-[80px] py-2 rounded-md items-center justify-center border ${!value ? 'bg-blue-500 border-blue-500' : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'}`}
        onPress={() => onChange(undefined)}
      >
        <Text className={!value ? 'text-white text-sm font-semibold' : 'text-gray-500 dark:text-slate-400 text-sm font-medium'}>Todos</Text>
      </TouchableOpacity>
      {members.map(m => (
        <TouchableOpacity
          key={m.id}
          className={`flex-1 min-w-[80px] py-2 rounded-md items-center justify-center border ${value === m.id ? 'bg-blue-500 border-blue-500' : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'}`}
          onPress={() => onChange(m.id)}
        >
          <Text className={value === m.id ? 'text-white text-sm font-semibold' : 'text-gray-500 dark:text-slate-400 text-sm font-medium'}>{m.display_name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900" edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={() => setToast({ ...toast, visible: false })} />

        {/* Deposit Modal */}
        <Modal visible={depositModal} transparent animationType="fade" onRequestClose={() => setDepositModal(false)}>
          <View className="flex-1 justify-center items-center p-5" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <View className="w-full max-w-[340px] rounded-2xl p-6 border bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
              <Text className="text-xl font-bold mb-4 text-center text-gray-900 dark:text-slate-100">Depositar na Meta</Text>
              <Controller
                control={depositForm.control}
                name="valor"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    className={inputCls(!!depositForm.formState.errors.valor)}
                    placeholder="Valor (R$)"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={(text) => onChange(formatCurrencyInput(text))}
                    autoFocus
                  />
                )}
              />
              {depositForm.formState.errors.valor && (
                <Text className="text-red-500 text-xs -mt-1 mb-2 ml-1">{depositForm.formState.errors.valor.message}</Text>
              )}
              <View className="flex-row gap-3 mt-4">
                <TouchableOpacity className="flex-1 p-3 rounded-lg items-center border bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600" onPress={() => setDepositModal(false)}>
                  <Text className="font-semibold text-gray-500 dark:text-slate-400">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 p-3 rounded-lg items-center bg-emerald-500" onPress={handleDeposit} disabled={loadingAction === 'deposit'}>
                  {loadingAction === 'deposit' ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Confirmar</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <ScrollView
          contentContainerClassName="pb-5"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2196f3" colors={['#2196f3']} />
          }
        >
          {/* Workspace Section */}
          <View className="mx-4 mt-4 p-4 rounded-2xl border shadow-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <Text className="text-lg font-extrabold mb-1 text-gray-900 dark:text-slate-100">Workspace</Text>
            {workspace && (
              <>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm font-semibold text-gray-500 dark:text-slate-400">{workspace.name}</Text>
                  <Text className="text-sm text-gray-400 dark:text-slate-500">Código: {workspace.invite_code}</Text>
                </View>
                <TouchableOpacity className="p-3 rounded-lg items-center mt-1 bg-blue-500 dark:bg-blue-600" onPress={() => setShowMembers(true)}>
                  <Text className="text-white font-bold text-base">Gerenciar Membros ({members.length})</Text>
                </TouchableOpacity>
                <TouchableOpacity className="p-3 rounded-lg items-center mt-2 bg-red-500" onPress={handleLeaveWorkspace}>
                  <Text className="text-white font-bold text-base">Sair do Workspace</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Appearance */}
          <View className="mx-4 mt-4 p-4 rounded-2xl border shadow-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <Text className="text-lg font-extrabold mb-1 text-gray-900 dark:text-slate-100">Aparência</Text>
            <Text className="text-sm font-semibold mb-1.5 mt-0.5 text-gray-500 dark:text-slate-400">Tema do Aplicativo</Text>
            <View className="flex-row gap-2 mb-3">
              <TouchableOpacity
                className={`flex-1 py-2 rounded-md items-center justify-center flex-row border ${themeMode === 'light' ? 'bg-blue-500 border-blue-500' : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'}`}
                onPress={() => setThemeMode('light')}
              >
                <Ionicons name="sunny" size={18} color={themeMode === 'light' ? '#ffffff' : (isDark ? '#9ca3af' : '#374151')} style={{marginRight: 6}} />
                <Text className={themeMode === 'light' ? 'text-white text-sm font-semibold' : 'text-gray-500 dark:text-slate-400 text-sm font-medium'}>Claro</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2 rounded-md items-center justify-center flex-row border ${themeMode === 'dark' ? 'bg-blue-500 border-blue-500' : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'}`}
                onPress={() => setThemeMode('dark')}
              >
                <Ionicons name="moon" size={18} color={themeMode === 'dark' ? '#ffffff' : (isDark ? '#9ca3af' : '#374151')} style={{marginRight: 6}} />
                <Text className={themeMode === 'dark' ? 'text-white text-sm font-semibold' : 'text-gray-500 dark:text-slate-400 text-sm font-medium'}>Escuro</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2 rounded-md items-center justify-center flex-row border ${themeMode === 'auto' ? 'bg-blue-500 border-blue-500' : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'}`}
                onPress={() => setThemeMode('auto')}
              >
                <Ionicons name="phone-portrait" size={18} color={themeMode === 'auto' ? '#ffffff' : (isDark ? '#9ca3af' : '#374151')} style={{marginRight: 6}} />
                <Text className={themeMode === 'auto' ? 'text-white text-sm font-semibold' : 'text-gray-500 dark:text-slate-400 text-sm font-medium'}>Auto</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Incomes */}
          <View className="mx-4 mt-4 p-4 rounded-2xl border shadow-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-extrabold text-gray-900 dark:text-slate-100">Rendas Mensais</Text>
              <TouchableOpacity onPress={() => setHideRendaValues(!hideRendaValues)} className="p-1">
                <Ionicons name={hideRendaValues ? 'eye-off' : 'eye'} size={20} color={isDark ? '#9ca3af' : '#374151'} />
              </TouchableOpacity>
            </View>
            <Text className="text-sm font-semibold mb-3 text-emerald-500 dark:text-emerald-400">Total Atual: {formatCurrency(rendaTotal, hideRendaValues)}</Text>
            <View className="mb-3">
              <Controller control={rendaForm.control} name="descricao"
                render={({ field: { onChange, value } }) => (
                  <TextInput className={inputCls(!!rendaForm.formState.errors.descricao)}
                    placeholder="Descrição" placeholderTextColor="#9ca3af" value={value} onChangeText={onChange} />
                )} />
              {rendaForm.formState.errors.descricao && <Text className="text-red-500 text-xs -mt-1 mb-2 ml-1">{rendaForm.formState.errors.descricao.message}</Text>}

              <Controller control={rendaForm.control} name="valor"
                render={({ field: { onChange, value } }) => (
                  <TextInput className={inputCls(!!rendaForm.formState.errors.valor)}
                    placeholder="Valor (R$)" placeholderTextColor="#9ca3af" keyboardType="numeric" value={value}
                    onChangeText={(text) => onChange(formatCurrencyInput(text))} />
                )} />
              {rendaForm.formState.errors.valor && <Text className="text-red-500 text-xs -mt-1 mb-2 ml-1">{rendaForm.formState.errors.valor.message}</Text>}

              <Text className="text-sm font-semibold mb-1.5 mt-0.5 text-gray-500 dark:text-slate-400">Responsável</Text>
              <Controller control={rendaForm.control} name="responsibleMemberId"
                render={({ field: { onChange, value } }) => (
                  <ResponsibleSelector value={value} onChange={onChange} />
                )} />

              <TouchableOpacity className={`p-3 rounded-lg items-center mt-1 bg-blue-500 dark:bg-blue-600 ${loadingAction === 'salary' ? 'opacity-60' : ''}`} onPress={handleAddSalario} disabled={loadingAction === 'salary'}>
                {loadingAction === 'salary' ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">+ Adicionar Renda</Text>}
              </TouchableOpacity>
            </View>
            <View className="max-h-56 rounded-xl p-1 border border-gray-200 dark:border-slate-600">
              <ScrollView nestedScrollEnabled>
                {incomes.map((r) => (
                  <View key={r.id} className="flex-row justify-between items-center p-3 border-b border-gray-200 dark:border-slate-700 rounded-lg mb-0.5">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900 dark:text-slate-100">{r.description}</Text>
                      <Text className="text-sm mt-0.5 text-gray-500 dark:text-slate-400">{formatCurrency(Number(r.amount), hideRendaValues)} - {getMemberName(r.responsible_member_id)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteItem(r.id, r.description, deleteIncomeMut)} disabled={loadingAction === `delete-${r.id}`}>
                      {loadingAction === `delete-${r.id}` ? <ActivityIndicator size="small" color={getIconColor('error', isDark)} /> : <Ionicons name="trash-outline" size={22} color={getIconColor('error', isDark)} />}
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Fixed Expenses */}
          <View className="mx-4 mt-4 p-4 rounded-2xl border shadow-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-extrabold text-gray-900 dark:text-slate-100">Gastos Fixos</Text>
              <TouchableOpacity onPress={() => setHideFixosValues(!hideFixosValues)} className="p-1">
                <Ionicons name={hideFixosValues ? 'eye-off' : 'eye'} size={20} color={isDark ? '#9ca3af' : '#374151'} />
              </TouchableOpacity>
            </View>
            <Text className="text-sm font-semibold mb-3 text-red-500">Total Comprometido: {formatCurrency(totalFixos, hideFixosValues)}</Text>
            <View className="mb-3">
              <Controller control={fixedForm.control} name="descricao"
                render={({ field: { onChange, value } }) => (
                  <TextInput className={inputCls(!!fixedForm.formState.errors.descricao)}
                    placeholder="Descrição" placeholderTextColor="#9ca3af" value={value} onChangeText={onChange} />
                )} />
              {fixedForm.formState.errors.descricao && <Text className="text-red-500 text-xs -mt-1 mb-2 ml-1">{fixedForm.formState.errors.descricao.message}</Text>}

              <Controller control={fixedForm.control} name="valor"
                render={({ field: { onChange, value } }) => (
                  <TextInput className={inputCls(!!fixedForm.formState.errors.valor)}
                    placeholder="Valor (R$)" placeholderTextColor="#9ca3af" keyboardType="numeric" value={value}
                    onChangeText={(text) => onChange(formatCurrencyInput(text))} />
                )} />
              {fixedForm.formState.errors.valor && <Text className="text-red-500 text-xs -mt-1 mb-2 ml-1">{fixedForm.formState.errors.valor.message}</Text>}

              <Text className="text-sm font-semibold mb-1.5 mt-0.5 text-gray-500 dark:text-slate-400">Responsável / Método</Text>
              <Controller control={fixedForm.control} name="responsibleMemberId"
                render={({ field: { onChange, value } }) => (
                  <ResponsibleSelector value={value} onChange={onChange} />
                )} />

              <Controller control={fixedForm.control} name="paymentMethod"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row gap-2 mb-3">
                    <TouchableOpacity
                      className={`flex-1 py-2 rounded-md items-center justify-center border ${value === 'debit' ? 'bg-blue-500 border-blue-500' : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'}`}
                      onPress={() => onChange('debit')}
                    >
                      <Text className={value === 'debit' ? 'text-white text-sm font-semibold' : 'text-gray-500 dark:text-slate-400 text-sm font-medium'}>Débito</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className={`flex-1 py-2 rounded-md items-center justify-center border ${value === 'credit' ? 'bg-amber-500 border-amber-500' : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'}`}
                      onPress={() => onChange('credit')}
                    >
                      <Text className={value === 'credit' ? 'text-white text-sm font-semibold' : 'text-gray-500 dark:text-slate-400 text-sm font-medium'}>Crédito</Text>
                    </TouchableOpacity>
                  </View>
                )} />

              <TouchableOpacity className={`p-3 rounded-lg items-center mt-1 bg-blue-500 dark:bg-blue-600 ${loadingAction === 'fixed' ? 'opacity-60' : ''}`} onPress={handleAddFixo} disabled={loadingAction === 'fixed'}>
                {loadingAction === 'fixed' ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">+ Adicionar Fixo</Text>}
              </TouchableOpacity>
            </View>
            <View className="max-h-56 rounded-xl p-1 border border-gray-200 dark:border-slate-600">
              <ScrollView nestedScrollEnabled>
                {fixedExpenses.map((r) => (
                  <View key={r.id} className="flex-row justify-between items-center p-3 border-b border-gray-200 dark:border-slate-700 rounded-lg mb-0.5">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900 dark:text-slate-100">{r.description}</Text>
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-sm text-gray-500 dark:text-slate-400">{formatCurrency(Number(r.amount), hideFixosValues)}</Text>
                        <View className={`px-1.5 py-0.5 rounded ml-1.5 ${r.payment_method === 'credit' ? 'bg-orange-50' : 'bg-blue-50'}`}>
                          <Text className="text-[10px] font-bold text-gray-600">{r.payment_method === 'credit' ? 'Crédito' : 'Débito'}</Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteItem(r.id, r.description, deleteFixedExpenseMut)} disabled={loadingAction === `delete-${r.id}`}>
                      {loadingAction === `delete-${r.id}` ? <ActivityIndicator size="small" color={getIconColor('error', isDark)} /> : <Ionicons name="trash-outline" size={22} color={getIconColor('error', isDark)} />}
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Savings Goals */}
          <View className="mx-4 mt-4 p-4 rounded-2xl border shadow-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-extrabold text-gray-900 dark:text-slate-100">Metas de Poupança</Text>
              <TouchableOpacity onPress={() => setHideMetasValues(!hideMetasValues)} className="p-1">
                <Ionicons name={hideMetasValues ? 'eye-off' : 'eye'} size={20} color={isDark ? '#9ca3af' : '#374151'} />
              </TouchableOpacity>
            </View>
            <View className="mb-3">
              <Controller control={metaForm.control} name="nome"
                render={({ field: { onChange, value } }) => (
                  <TextInput className={inputCls(!!metaForm.formState.errors.nome)}
                    placeholder="Nome da meta" placeholderTextColor="#9ca3af" value={value} onChangeText={onChange} />
                )} />
              {metaForm.formState.errors.nome && <Text className="text-red-500 text-xs -mt-1 mb-2 ml-1">{metaForm.formState.errors.nome.message}</Text>}

              <View className="flex-row gap-2.5">
                <Controller control={metaForm.control} name="objetivo"
                  render={({ field: { onChange, value } }) => (
                    <TextInput className={`${inputCls(!!metaForm.formState.errors.objetivo)} flex-1`}
                      placeholder="Alvo (R$)" placeholderTextColor="#9ca3af" keyboardType="numeric" value={value}
                      onChangeText={(text) => onChange(formatCurrencyInput(text))} />
                  )} />
                <Controller control={metaForm.control} name="atual"
                  render={({ field: { onChange, value } }) => (
                    <TextInput className={`${inputCls(!!metaForm.formState.errors.atual)} flex-1`}
                      placeholder="Atual (R$)" placeholderTextColor="#9ca3af" keyboardType="numeric" value={value}
                      onChangeText={(text) => onChange(formatCurrencyInput(text))} />
                  )} />
              </View>
              {(metaForm.formState.errors.objetivo || metaForm.formState.errors.atual) && (
                <Text className="text-red-500 text-xs -mt-1 mb-2 ml-1">{metaForm.formState.errors.objetivo?.message || metaForm.formState.errors.atual?.message}</Text>
              )}

              <TouchableOpacity className={`p-3 rounded-lg items-center mt-1 bg-blue-500 dark:bg-blue-600 ${loadingAction === 'meta' ? 'opacity-60' : ''}`} onPress={handleAddMeta} disabled={loadingAction === 'meta'}>
                {loadingAction === 'meta' ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">+ Criar Meta</Text>}
              </TouchableOpacity>
            </View>
            <View className="max-h-56 rounded-xl p-1 border border-gray-200 dark:border-slate-600">
              <ScrollView nestedScrollEnabled>
                {savingsGoals.map((p) => {
                  const percent = (Number(p.target_amount) || 0) > 0 ? ((Number(p.current_amount) || 0) / (Number(p.target_amount) || 1)) * 100 : 0;
                  return (
                    <View key={p.id} className="flex-row justify-between items-center p-3 border-b border-gray-200 dark:border-slate-700 rounded-lg mb-0.5">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-900 dark:text-slate-100">{p.name}</Text>
                        <Text className="text-sm mt-0.5 text-gray-500 dark:text-slate-400">
                          {formatCurrency(Number(p.current_amount), hideMetasValues)} / {formatCurrency(Number(p.target_amount), hideMetasValues)}
                          <Text className="text-emerald-500"> ({hideMetasValues ? '---' : percent.toFixed(0)}%)</Text>
                        </Text>
                      </View>
                      <View className="flex-row gap-3">
                        <TouchableOpacity onPress={() => { setDepositId(p.id); setDepositModal(true); }}>
                          <Ionicons name="add-circle" size={28} color={getIconColor('success', isDark)} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteItem(p.id, p.name, deleteSavingsGoalMut)} disabled={loadingAction === `delete-${p.id}`}>
                          {loadingAction === `delete-${p.id}` ? <ActivityIndicator size="small" color={getIconColor('error', isDark)} /> : <Ionicons name="trash-outline" size={22} color={getIconColor('error', isDark)} />}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Config */}
          <View className="mx-4 mt-4 p-4 rounded-2xl border shadow-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <Text className="text-lg font-extrabold mb-1 text-gray-900 dark:text-slate-100">Configurações</Text>
            <Text className="text-sm font-semibold mb-1.5 mt-0.5 text-gray-500 dark:text-slate-400">Teto de Gastos Variáveis</Text>
            <View className="flex-row gap-2.5">
              <Controller control={configForm.control} name="extraGastosVariaveis"
                render={({ field: { onChange, value } }) => (
                  <TextInput className={`${inputCls(!!configForm.formState.errors.extraGastosVariaveis)} flex-1 mb-0`}
                    placeholderTextColor="#9ca3af" keyboardType="numeric" value={value}
                    onChangeText={(text) => onChange(formatCurrencyInput(text))} />
                )} />
              <TouchableOpacity className={`w-24 p-3 rounded-lg items-center justify-center bg-emerald-500 ${loadingAction === 'config' ? 'opacity-60' : ''}`} onPress={handleSaveConfig} disabled={loadingAction === 'config'}>
                {loadingAction === 'config' ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Salvar</Text>}
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Out */}
          <View className="mx-4 mt-4 mb-8">
            <TouchableOpacity className="p-3 rounded-lg items-center bg-red-500" onPress={handleSignOut}>
              <Text className="text-white font-bold text-base">Sair da Conta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
