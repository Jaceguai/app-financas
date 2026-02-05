import React, { useState, useMemo } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, 
  ActivityIndicator, Modal, KeyboardAvoidingView, Platform, Keyboard, Alert, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '../theme';
import { useFinanceStore } from '../store/useFinanceStore';
import { sendFixedExpense, addSavingsGoal, sendRenda, updateSharedConfig, depositToMeta, deleteFixo, deleteMeta, deleteRenda, fetchDriveData } from '../services/api';
import { Poupanca, RendaFixa } from '../types';
import { Toast } from '../components/Toast';
import { formatCurrency, formatCurrencyInput, parseCurrency as parseCurrencyUtil } from '../utils/formatters';
import { 
  rendaSchema, RendaFormData,
  fixedExpenseSchema, FixedExpenseFormData,
  metaSchema, MetaFormData,
  depositoMetaSchema, DepositoMetaFormData,
  configSchema, ConfigFormData
} from '../schemas'; 

export const SettingsScreen: React.FC = () => {
  const { theme, themeMode, setThemeMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { 
    rendasFixas = [], poupancas = [], rendas = [], extraGastosVariaveis,
    addRendaFixa, removeRendaFixa, addPoupanca, removePoupanca, updatePoupanca,
    addRenda, removeRenda, setExtraGastosVariaveis, getRendaTotal, syncFromDrive
  } = useFinanceStore();

  const rendaTotal = getRendaTotal?.() || 0;
  const totalFixos = rendasFixas.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
  
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false, message: '', type: 'success'
  });
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hideRendaValues, setHideRendaValues] = useState(false);
  const [hideFixosValues, setHideFixosValues] = useState(false);
  const [hideMetasValues, setHideMetasValues] = useState(false);
  const [depositModal, setDepositModal] = useState(false);
  const [depositId, setDepositId] = useState('');

  const rendaForm = useForm<RendaFormData>({
    resolver: zodResolver(rendaSchema),
    defaultValues: { descricao: '', valor: '', responsavel: 'A' }
  });

  const fixedForm = useForm<FixedExpenseFormData>({
    resolver: zodResolver(fixedExpenseSchema),
    defaultValues: { descricao: '', valor: '', responsavel: 'Ambos', paymentMethod: 'debit' }
  });

  const metaForm = useForm<MetaFormData>({
    resolver: zodResolver(metaSchema),
    defaultValues: { nome: '', objetivo: '', atual: '' }
  });

  const depositForm = useForm<DepositoMetaFormData>({
    resolver: zodResolver(depositoMetaSchema),
    defaultValues: { valor: '' }
  });

  const configForm = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: { extraGastosVariaveis: String(extraGastosVariaveis || 1000) }
  });

  const responsavelLabel: Record<string, string> = { A: 'Eu', B: 'Esposa', Ambos: 'Ambos' };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ visible: true, message, type });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await fetchDriveData();
      syncFromDrive(data);
      showToast('Dados atualizados!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      showToast('Erro ao atualizar dados', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddSalario = rendaForm.handleSubmit(async (data) => {
    setLoadingAction('salary');
    Keyboard.dismiss();
    try {
      const valor = parseCurrencyUtil(data.valor);
      const novaRenda = { id: Date.now().toString(), descricao: data.descricao.trim(), valor, responsavel: data.responsavel };
      await sendRenda(novaRenda);
      addRenda(novaRenda);
      rendaForm.reset();
      showToast('Renda salva!', 'success');
    } catch (e) { showToast('Erro ao salvar.', 'error'); } 
    finally { setLoadingAction(null); }
  });

  const handleAddFixo = fixedForm.handleSubmit(async (data) => {
    setLoadingAction('fixed');
    Keyboard.dismiss();
    try {
      const valor = parseCurrencyUtil(data.valor);
      const novoFixo: RendaFixa = { id: Date.now().toString(), descricao: data.descricao.trim(), valor, responsavel: data.responsavel, paymentMethod: data.paymentMethod };
      await sendFixedExpense(novoFixo as any);
      addRendaFixa(novoFixo);
      fixedForm.reset();
      showToast('Gasto fixo salvo!', 'success');
    } catch (e) { showToast('Erro ao salvar.', 'error'); } 
    finally { setLoadingAction(null); }
  });

  const handleAddMeta = metaForm.handleSubmit(async (data) => {
    setLoadingAction('meta');
    Keyboard.dismiss();
    try {
      const objetivo = parseCurrencyUtil(data.objetivo);
      const atual = data.atual && data.atual.trim() !== '' ? parseCurrencyUtil(data.atual) : 0;
      const novaMeta: Poupanca = { id: Date.now().toString(), nome: data.nome.trim(), objetivo, atual };
      await addSavingsGoal(novaMeta);
      addPoupanca(novaMeta);
      metaForm.reset();
      showToast('Meta criada!', 'success');
    } catch (e) { showToast('Erro ao criar meta.', 'error'); } 
    finally { setLoadingAction(null); }
  });

  const handleSaveConfig = configForm.handleSubmit(async (data) => {
    setLoadingAction('config');
    Keyboard.dismiss();
    try {
      const num = parseCurrencyUtil(data.extraGastosVariaveis);
      await updateSharedConfig('extraGastosVariaveis', num);
      setExtraGastosVariaveis(num);
      showToast('Limite atualizado!', 'success');
    } catch (e) { showToast('Erro ao atualizar.', 'error'); } 
    finally { setLoadingAction(null); }
  });

  const handleDeposit = depositForm.handleSubmit(async (data) => {
    const meta = poupancas.find(p => p.id === depositId);
    if (!meta) return;
    setLoadingAction('deposit');
    try {
      const val = parseCurrencyUtil(data.valor);
      await depositToMeta(meta.nome, val);
      updatePoupanca(depositId, (Number(meta.atual) || 0) + val);
      showToast(`Depósito realizado!`, 'success');
      setDepositModal(false);
      depositForm.reset();
    } catch (e) { showToast('Falha no depósito.', 'error'); } 
    finally { setLoadingAction(null); }
  });

  const handleDeleteItem = (id: string, nome: string, apiDelete: (nome: string) => Promise<void>, storeRemove: (id: string) => void) => {
    Alert.alert('Remover', `Excluir "${nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
          setLoadingAction(`delete-${id}`);
          try {
            await apiDelete(nome);
            storeRemove(id);
            showToast('Item removido.', 'success');
          } catch { showToast('Erro ao remover.', 'error'); } 
          finally { setLoadingAction(null); }
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={() => setToast({ ...toast, visible: false })} />

      <Modal visible={depositModal} transparent animationType="fade" onRequestClose={() => setDepositModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Depositar na Meta</Text>
            <Controller
              control={depositForm.control}
              name="valor"
              render={({ field: { onChange, value } }) => (
                <TextInput 
                  style={[styles.input, depositForm.formState.errors.valor && { borderColor: '#ef4444', borderWidth: 2 }]} 
                  placeholder="Valor (R$)" 
                  placeholderTextColor={theme.colors.inputPlaceholder}
                  keyboardType="numeric" 
                  value={value} 
                  onChangeText={(text) => onChange(formatCurrencyInput(text))} 
                  autoFocus
                />
              )}
            />
            {depositForm.formState.errors.valor && (
              <Text style={styles.errorText}>{depositForm.formState.errors.valor.message}</Text>
            )}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setDepositModal(false)}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirm} onPress={handleDeposit} disabled={loadingAction === 'deposit'}>
                {loadingAction === 'deposit' ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnConfirmText}>Confirmar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 20 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aparência</Text>
          <Text style={styles.label}>Tema do Aplicativo</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity 
              style={[styles.btnResp, themeMode === 'light' && styles.btnRespActive]} 
              onPress={() => setThemeMode('light')}
            >
              <Ionicons name="sunny" size={18} color={themeMode === 'light' ? '#fff' : theme.colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={themeMode === 'light' ? styles.btnRespTextActive : styles.btnRespText}>Claro</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.btnResp, themeMode === 'dark' && styles.btnRespActive]} 
              onPress={() => setThemeMode('dark')}
            >
              <Ionicons name="moon" size={18} color={themeMode === 'dark' ? '#fff' : theme.colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={themeMode === 'dark' ? styles.btnRespTextActive : styles.btnRespText}>Escuro</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.btnResp, themeMode === 'auto' && styles.btnRespActive]} 
              onPress={() => setThemeMode('auto')}
            >
              <Ionicons name="phone-portrait" size={18} color={themeMode === 'auto' ? '#fff' : theme.colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={themeMode === 'auto' ? styles.btnRespTextActive : styles.btnRespText}>Auto</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.sectionTitle}>Rendas Mensais</Text>
            <TouchableOpacity onPress={() => setHideRendaValues(!hideRendaValues)} style={{ padding: 4 }}>
              <Ionicons 
                name={hideRendaValues ? 'eye-off' : 'eye'} 
                size={20} 
                color={theme.colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.totalText, { color: theme.colors.secondary }]}>Total Atual: {formatCurrency(rendaTotal, hideRendaValues)}</Text>
          <View style={styles.formGroup}>
            <Controller
              control={rendaForm.control}
              name="descricao"
              render={({ field: { onChange, value } }) => (
                <TextInput 
                  style={[styles.input, rendaForm.formState.errors.descricao && { borderColor: '#ef4444', borderWidth: 2 }]} 
                  placeholder="Descrição" 
                  placeholderTextColor={theme.colors.inputPlaceholder} 
                  value={value} 
                  onChangeText={onChange} 
                />
              )}
            />
            {rendaForm.formState.errors.descricao && (
              <Text style={styles.errorText}>{rendaForm.formState.errors.descricao.message}</Text>
            )}

            <Controller
              control={rendaForm.control}
              name="valor"
              render={({ field: { onChange, value } }) => (
                <TextInput 
                  style={[styles.input, rendaForm.formState.errors.valor && { borderColor: '#ef4444', borderWidth: 2 }]} 
                  placeholder="Valor (R$)" 
                  placeholderTextColor={theme.colors.inputPlaceholder} 
                  keyboardType="numeric" 
                  value={value} 
                  onChangeText={(text) => onChange(formatCurrencyInput(text))} 
                />
              )}
            />
            {rendaForm.formState.errors.valor && (
              <Text style={styles.errorText}>{rendaForm.formState.errors.valor.message}</Text>
            )}

            <Controller
              control={rendaForm.control}
              name="responsavel"
              render={({ field: { onChange, value } }) => (
                <View style={styles.btnRow}>
                  {(['A', 'B', 'Ambos'] as const).map((r) => (
                    <TouchableOpacity key={r} style={[styles.btnResp, value === r && styles.btnRespActive]} onPress={() => onChange(r)}>
                      <Text style={value === r ? styles.btnRespTextActive : styles.btnRespText}>{responsavelLabel[r]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />

            <TouchableOpacity style={styles.btnAdd} onPress={handleAddSalario} disabled={loadingAction === 'salary'}>
              {loadingAction === 'salary' ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnAddText}>+ Adicionar Renda</Text>}
            </TouchableOpacity>
          </View>
          <View style={styles.listContainer}>
            <ScrollView nestedScrollEnabled>
              {rendas.map((r) => (
                <View key={r.id} style={styles.item}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{r.descricao}</Text>
                    <Text style={styles.itemSub}>{formatCurrency(Number(r.valor), hideRendaValues)} • {responsavelLabel[r.responsavel]}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteItem(r.id, r.descricao, deleteRenda, removeRenda)} disabled={loadingAction === `delete-${r.id}`}>
                    {loadingAction === `delete-${r.id}` ? <ActivityIndicator size="small" color="#ef4444" /> : <Ionicons name="trash-outline" size={22} color="#ef4444" />}
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.sectionTitle}>Gastos Fixos</Text>
            <TouchableOpacity onPress={() => setHideFixosValues(!hideFixosValues)} style={{ padding: 4 }}>
              <Ionicons 
                name={hideFixosValues ? 'eye-off' : 'eye'} 
                size={20} 
                color={theme.colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.totalTextRed}>Total Comprometido: {formatCurrency(totalFixos, hideFixosValues)}</Text>
          <View style={styles.formGroup}>
            <Controller
              control={fixedForm.control}
              name="descricao"
              render={({ field: { onChange, value } }) => (
                <TextInput 
                  style={[styles.input, fixedForm.formState.errors.descricao && { borderColor: '#ef4444', borderWidth: 2 }]} 
                  placeholder="Descrição" 
                  placeholderTextColor={theme.colors.inputPlaceholder} 
                  value={value} 
                  onChangeText={onChange} 
                />
              )}
            />
            {fixedForm.formState.errors.descricao && (
              <Text style={styles.errorText}>{fixedForm.formState.errors.descricao.message}</Text>
            )}

            <Controller
              control={fixedForm.control}
              name="valor"
              render={({ field: { onChange, value } }) => (
                <TextInput 
                  style={[styles.input, fixedForm.formState.errors.valor && { borderColor: '#ef4444', borderWidth: 2 }]} 
                  placeholder="Valor (R$)" 
                  placeholderTextColor={theme.colors.inputPlaceholder} 
                  keyboardType="numeric" 
                  value={value} 
                  onChangeText={(text) => onChange(formatCurrencyInput(text))} 
                />
              )}
            />
            {fixedForm.formState.errors.valor && (
              <Text style={styles.errorText}>{fixedForm.formState.errors.valor.message}</Text>
            )}
            
            <Text style={styles.label}>Quem paga? / Método</Text>
            <Controller
              control={fixedForm.control}
              name="responsavel"
              render={({ field: { onChange, value } }) => (
                <View style={styles.btnRow}>
                  {(['A', 'B', 'Ambos'] as const).map((r) => (
                    <TouchableOpacity key={r} style={[styles.btnResp, value === r && styles.btnRespActive]} onPress={() => onChange(r)}>
                      <Text style={value === r ? styles.btnRespTextActive : styles.btnRespText}>{responsavelLabel[r]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />

            <Controller
              control={fixedForm.control}
              name="paymentMethod"
              render={({ field: { onChange, value } }) => (
                <View style={styles.btnRow}>
                  <TouchableOpacity style={[styles.btnResp, value === 'debit' && styles.btnRespActive]} onPress={() => onChange('debit')}>
                    <Text style={value === 'debit' ? styles.btnRespTextActive : styles.btnRespText}>Débito</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btnResp, value === 'credit' && styles.btnRespCreditActive]} onPress={() => onChange('credit')}>
                    <Text style={value === 'credit' ? styles.btnRespTextActive : styles.btnRespText}>Crédito</Text>
                  </TouchableOpacity>
                </View>
              )}
            />

            <TouchableOpacity style={styles.btnAdd} onPress={handleAddFixo} disabled={loadingAction === 'fixed'}>
              {loadingAction === 'fixed' ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnAddText}>+ Adicionar Fixo</Text>}
            </TouchableOpacity>
          </View>
          <View style={styles.listContainer}>
            <ScrollView nestedScrollEnabled>
              {rendasFixas.map((r) => (
                <View key={r.id} style={styles.item}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{r.descricao}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.itemSub}>{formatCurrency(Number(r.valor), hideFixosValues)}</Text>
                      <View style={[styles.badge, r.paymentMethod === 'credit' ? styles.badgeCredit : styles.badgeDebit]}>
                         <Text style={styles.badgeText}>{r.paymentMethod === 'credit' ? 'Crédito' : 'Débito'}</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteItem(r.id, r.descricao, deleteFixo, removeRendaFixa)} disabled={loadingAction === `delete-${r.id}`}>
                    {loadingAction === `delete-${r.id}` ? <ActivityIndicator size="small" color="#ef4444" /> : <Ionicons name="trash-outline" size={22} color="#ef4444" />}
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.sectionTitle}>Metas de Poupança</Text>
            <TouchableOpacity onPress={() => setHideMetasValues(!hideMetasValues)} style={{ padding: 4 }}>
              <Ionicons 
                name={hideMetasValues ? 'eye-off' : 'eye'} 
                size={20} 
                color={theme.colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          <View style={styles.formGroup}>
            <Controller
              control={metaForm.control}
              name="nome"
              render={({ field: { onChange, value } }) => (
                <TextInput 
                  style={[styles.input, metaForm.formState.errors.nome && { borderColor: '#ef4444', borderWidth: 2 }]} 
                  placeholder="Nome da meta" 
                  placeholderTextColor={theme.colors.inputPlaceholder} 
                  value={value} 
                  onChangeText={onChange} 
                />
              )}
            />
            {metaForm.formState.errors.nome && (
              <Text style={styles.errorText}>{metaForm.formState.errors.nome.message}</Text>
            )}

            <View style={styles.rowInputs}>
              <Controller
                control={metaForm.control}
                name="objetivo"
                render={({ field: { onChange, value } }) => (
                  <TextInput 
                    style={[styles.input, {flex: 1}, metaForm.formState.errors.objetivo && { borderColor: '#ef4444', borderWidth: 2 }]} 
                    placeholder="Alvo (R$)" 
                    placeholderTextColor={theme.colors.inputPlaceholder} 
                    keyboardType="numeric" 
                    value={value} 
                    onChangeText={(text) => onChange(formatCurrencyInput(text))} 
                  />
                )}
              />
              <Controller
                control={metaForm.control}
                name="atual"
                render={({ field: { onChange, value } }) => (
                  <TextInput 
                    style={[styles.input, {flex: 1}, metaForm.formState.errors.atual && { borderColor: '#ef4444', borderWidth: 2 }]} 
                    placeholder="Atual (R$)" 
                    placeholderTextColor={theme.colors.inputPlaceholder} 
                    keyboardType="numeric" 
                    value={value} 
                    onChangeText={(text) => onChange(formatCurrencyInput(text))} 
                  />
                )}
              />
            </View>
            {(metaForm.formState.errors.objetivo || metaForm.formState.errors.atual) && (
              <Text style={styles.errorText}>
                {metaForm.formState.errors.objetivo?.message || metaForm.formState.errors.atual?.message}
              </Text>
            )}

            <TouchableOpacity style={styles.btnAdd} onPress={handleAddMeta} disabled={loadingAction === 'meta'}>
               {loadingAction === 'meta' ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnAddText}>+ Criar Meta</Text>}
            </TouchableOpacity>
          </View>
          <View style={styles.listContainer}>
            <ScrollView nestedScrollEnabled>
              {poupancas.map((p) => {
                const percent = (Number(p.objetivo) || 0) > 0 ? ((Number(p.atual) || 0) / (Number(p.objetivo) || 1)) * 100 : 0;
                return (
                  <View key={p.id} style={styles.item}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{p.nome}</Text>
                      <Text style={styles.itemSub}>
                        {formatCurrency(Number(p.atual), hideMetasValues)} / {formatCurrency(Number(p.objetivo), hideMetasValues)} 
                        <Text style={{color: '#10b981'}}> ({hideMetasValues ? '•••' : percent.toFixed(0)}%)</Text>
                      </Text>
                    </View>
                    <View style={{flexDirection: 'row', gap: 12}}>
                      <TouchableOpacity onPress={() => { setDepositId(p.id); setDepositModal(true); }}>
                        <Ionicons name="add-circle" size={28} color="#10b981" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteItem(p.id, p.nome, deleteMeta, removePoupanca)} disabled={loadingAction === `delete-${p.id}`}>
                        {loadingAction === `delete-${p.id}` ? <ActivityIndicator size="small" color="#ef4444" /> : <Ionicons name="trash-outline" size={22} color="#ef4444" />}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          <Text style={styles.label}>Teto de Gastos Variáveis</Text>
          <View style={{flexDirection: 'row', gap: 10}}>
             <Controller
               control={configForm.control}
               name="extraGastosVariaveis"
               render={({ field: { onChange, value } }) => (
                 <TextInput 
                   style={[styles.input, {flex: 1, marginBottom: 0}, configForm.formState.errors.extraGastosVariaveis && { borderColor: '#ef4444', borderWidth: 2 }]} 
                   placeholderTextColor={theme.colors.inputPlaceholder} 
                   keyboardType="numeric" 
                   value={value} 
                   onChangeText={(text) => onChange(formatCurrencyInput(text))} 
                 />
               )}
             />
             <TouchableOpacity style={[styles.btnSave, {width: 100}]} onPress={handleSaveConfig} disabled={loadingAction === 'config'}>
                {loadingAction === 'config' ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnSaveText}>Salvar</Text>}
             </TouchableOpacity>
          </View>
        </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  keyboardView: { flex: 1 },
  section: { 
    backgroundColor: theme.colors.surface, 
    borderRadius: 16, 
    padding: 16, 
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 3, 
    elevation: 2 
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 4 },
  totalText: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 12 },
  helpText: { fontSize: 12, color: theme.colors.textTertiary, marginTop: 8, lineHeight: 16 },
  totalTextRed: { fontSize: 14, fontWeight: '600', color: '#ef4444', marginBottom: 12 },
  
  formGroup: { marginBottom: 12 },
  listContainer: { 
    maxHeight: 220,
    borderRadius: 12, 
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  
  rowInputs: { flexDirection: 'row', gap: 10 },
  input: { 
    backgroundColor: theme.colors.inputBackground, 
    borderWidth: 1, 
    borderColor: theme.colors.inputBorder, 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16,
    marginBottom: 10,
    color: theme.colors.textPrimary
  },
  label: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '600', marginBottom: 6, marginTop: 2 },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: -8, marginBottom: 8, marginLeft: 4 },
  
  btnRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  btnResp: { flex: 1, paddingVertical: 8, borderRadius: 6, backgroundColor: theme.colors.inputBackground, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderWidth: 1, borderColor: theme.colors.border },
  btnRespActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  btnRespCreditActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  btnRespText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '500' },
  btnRespTextActive: { color: '#fff', fontSize: 13, fontWeight: '600' },

  btnAdd: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  btnAddText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnSave: { backgroundColor: '#10b981', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnSaveText: { color: '#fff', fontWeight: '700' },

  item: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginBottom: 2
  },
  itemTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary },
  itemSub: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6 },
  badgeCredit: { backgroundColor: '#fff7ed' },
  badgeDebit: { backgroundColor: '#eff6ff' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#4b5563' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 24, width: '100%', maxWidth: 340, borderWidth: 1, borderColor: theme.colors.border },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: theme.colors.textPrimary },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btnCancel: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.colors.inputBackground, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  btnCancelText: { color: theme.colors.textSecondary, fontWeight: '600' },
  btnConfirm: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#10b981', alignItems: 'center' },
  btnConfirmText: { color: '#fff', fontWeight: '600' },
});