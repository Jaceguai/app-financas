import React, { useState, useMemo } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, 
  ActivityIndicator, Modal, KeyboardAvoidingView, Platform, Keyboard, Alert, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useFinanceStore } from '../store/useFinanceStore';
import { sendFixedExpense, addSavingsGoal, sendRenda, updateSharedConfig, depositToMeta, deleteFixo, deleteMeta, deleteRenda, fetchDriveData } from '../services/api';
import { Poupanca, RendaFixa } from '../types';
import { Toast } from '../components/Toast';
import { formatCurrency, formatCurrencyInput, parseCurrency as parseCurrencyUtil } from '../utils/formatters'; 

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
  
  const [rendaDesc, setRendaDesc] = useState('');
  const [rendaValor, setRendaValor] = useState('');
  const [rendaResponsavel, setRendaResponsavel] = useState<'A' | 'B' | 'Ambos'>('Ambos');
  const [rendaPaymentMethod, setRendaPaymentMethod] = useState<'debit' | 'credit'>('debit');

  const [salarioDesc, setSalarioDesc] = useState('');
  const [salarioValor, setSalarioValor] = useState('');
  const [salarioResponsavel, setSalarioResponsavel] = useState<'A' | 'B' | 'Ambos'>('A');

  const [poupNome, setPoupNome] = useState('');
  const [poupObjetivo, setPoupObjetivo] = useState('');
  const [poupAtual, setPoupAtual] = useState('');

  const [extraValor, setExtraValor] = useState(String(extraGastosVariaveis || 1000));
  
  const [depositModal, setDepositModal] = useState(false);
  const [depositId, setDepositId] = useState('');
  const [depositValor, setDepositValor] = useState('');

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

  const validatePayload = (desc: string, val: string) => {
    if (!desc.trim()) return { valid: false, msg: 'A descrição é obrigatória.' };
    const num = parseCurrencyUtil(val);
    if (isNaN(num) || num <= 0) return { valid: false, msg: 'Insira um valor válido.' };
    return { valid: true, value: num };
  };

  // --- Handlers ---

  const handleAddSalario = async () => {
    const check = validatePayload(salarioDesc, salarioValor);
    if (!check.valid) return showToast(check.msg!, 'error');
    setLoadingAction('salary');
    Keyboard.dismiss();
    try {
      const novaRenda = { id: Date.now().toString(), descricao: salarioDesc.trim(), valor: check.value!, responsavel: salarioResponsavel };
      await sendRenda(novaRenda);
      addRenda(novaRenda);
      setSalarioDesc(''); setSalarioValor('');
      showToast('Renda salva!', 'success');
    } catch (e) { showToast('Erro ao salvar.', 'error'); } 
    finally { setLoadingAction(null); }
  };

  const handleAddFixo = async () => {
    const check = validatePayload(rendaDesc, rendaValor);
    if (!check.valid) return showToast(check.msg!, 'error');
    setLoadingAction('fixed');
    Keyboard.dismiss();
    try {
      const novoFixo: RendaFixa = { id: Date.now().toString(), descricao: rendaDesc.trim(), valor: check.value!, responsavel: rendaResponsavel, paymentMethod: rendaPaymentMethod };
      await sendFixedExpense(novoFixo as any);
      addRendaFixa(novoFixo);
      setRendaDesc(''); setRendaValor(''); setRendaPaymentMethod('debit');
      showToast('Gasto fixo salvo!', 'success');
    } catch (e) { showToast('Erro ao salvar.', 'error'); } 
    finally { setLoadingAction(null); }
  };

  const handleAddMeta = async () => {
    if (!poupNome.trim()) return showToast('Nome obrigatório', 'error');
    const objNum = parseCurrencyUtil(poupObjetivo);
    const atuNum = parseCurrencyUtil(poupAtual);
    if (isNaN(objNum) || objNum <= 0) return showToast('Objetivo inválido', 'error');
    setLoadingAction('meta');
    Keyboard.dismiss();
    try {
      const novaMeta: Poupanca = { id: Date.now().toString(), nome: poupNome.trim(), objetivo: objNum, atual: isNaN(atuNum) ? 0 : atuNum };
      await addSavingsGoal(novaMeta);
      addPoupanca(novaMeta);
      setPoupNome(''); setPoupObjetivo(''); setPoupAtual('');
      showToast('Meta criada!', 'success');
    } catch (e) { showToast('Erro ao criar meta.', 'error'); } 
    finally { setLoadingAction(null); }
  };

  const handleSaveConfig = async () => {
    const num = parseCurrencyUtil(extraValor);
    if (isNaN(num) || num < 0) return showToast('Valor inválido', 'error');
    setLoadingAction('config');
    Keyboard.dismiss();
    try {
      await updateSharedConfig('extraGastosVariaveis', num);
      setExtraGastosVariaveis(num);
      showToast('Limite atualizado!', 'success');
    } catch (e) { showToast('Erro ao atualizar.', 'error'); } 
    finally { setLoadingAction(null); }
  };

  const handleDeposit = async () => {
    const val = parseCurrencyUtil(depositValor);
    if (isNaN(val) || val <= 0) return showToast('Valor inválido', 'error');
    const meta = poupancas.find(p => p.id === depositId);
    if (!meta) return;
    setLoadingAction('deposit');
    try {
      await depositToMeta(meta.nome, val);
      updatePoupanca(depositId, (Number(meta.atual) || 0) + val);
      showToast(`Depósito realizado!`, 'success');
      setDepositModal(false);
      setDepositValor('');
    } catch (e) { showToast('Falha no depósito.', 'error'); } 
    finally { setLoadingAction(null); }
  };

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
            <TextInput 
              style={styles.input} 
              placeholder="Valor (R$)" 
              placeholderTextColor={theme.colors.inputPlaceholder}
              keyboardType="numeric" 
              value={depositValor} 
              onChangeText={(text) => setDepositValor(formatCurrencyInput(text))} 
              autoFocus
            />
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
        
        {/* TEMA */}
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

        {/* SALÁRIOS */}
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
            <TextInput style={styles.input} placeholder="Descrição" placeholderTextColor={theme.colors.inputPlaceholder} value={salarioDesc} onChangeText={setSalarioDesc} />
            <TextInput 
              style={styles.input} 
              placeholder="Valor (R$)" 
              placeholderTextColor={theme.colors.inputPlaceholder} 
              keyboardType="numeric" 
              value={salarioValor} 
              onChangeText={(text) => setSalarioValor(formatCurrencyInput(text))} 
            />
            <View style={styles.btnRow}>
              {(['A', 'B', 'Ambos'] as const).map((r) => (
                <TouchableOpacity key={r} style={[styles.btnResp, salarioResponsavel === r && styles.btnRespActive]} onPress={() => setSalarioResponsavel(r)}>
                  <Text style={salarioResponsavel === r ? styles.btnRespTextActive : styles.btnRespText}>{responsavelLabel[r]}</Text>
                </TouchableOpacity>
              ))}
            </View>
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

        {/* GASTOS FIXOS */}
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
            <TextInput style={styles.input} placeholder="Descrição" placeholderTextColor={theme.colors.inputPlaceholder} value={rendaDesc} onChangeText={setRendaDesc} />
            <TextInput 
              style={styles.input} 
              placeholder="Valor (R$)" 
              placeholderTextColor={theme.colors.inputPlaceholder} 
              keyboardType="numeric" 
              value={rendaValor} 
              onChangeText={(text) => setRendaValor(formatCurrencyInput(text))} 
            />
            
            <Text style={styles.label}>Quem paga? / Método</Text>
            <View style={styles.btnRow}>
              {(['A', 'B', 'Ambos'] as const).map((r) => (
                <TouchableOpacity key={r} style={[styles.btnResp, rendaResponsavel === r && styles.btnRespActive]} onPress={() => setRendaResponsavel(r)}>
                  <Text style={rendaResponsavel === r ? styles.btnRespTextActive : styles.btnRespText}>{responsavelLabel[r]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.btnResp, rendaPaymentMethod === 'debit' && styles.btnRespActive]} onPress={() => setRendaPaymentMethod('debit')}>
                <Text style={rendaPaymentMethod === 'debit' ? styles.btnRespTextActive : styles.btnRespText}>Débito</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnResp, rendaPaymentMethod === 'credit' && styles.btnRespCreditActive]} onPress={() => setRendaPaymentMethod('credit')}>
                <Text style={rendaPaymentMethod === 'credit' ? styles.btnRespTextActive : styles.btnRespText}>Crédito</Text>
              </TouchableOpacity>
            </View>
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

        {/* METAS */}
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
            <TextInput style={styles.input} placeholder="Nome da meta" placeholderTextColor={theme.colors.inputPlaceholder} value={poupNome} onChangeText={setPoupNome} />
            <View style={styles.rowInputs}>
              <TextInput 
                style={[styles.input, {flex: 1}]} 
                placeholder="Alvo (R$)" 
                placeholderTextColor={theme.colors.inputPlaceholder} 
                keyboardType="numeric" 
                value={poupObjetivo} 
                onChangeText={(text) => setPoupObjetivo(formatCurrencyInput(text))} 
              />
              <TextInput 
                style={[styles.input, {flex: 1}]} 
                placeholder="Atual (R$)" 
                placeholderTextColor={theme.colors.inputPlaceholder} 
                keyboardType="numeric" 
                value={poupAtual} 
                onChangeText={(text) => setPoupAtual(formatCurrencyInput(text))} 
              />
            </View>
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

        {/* CONFIG */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          <Text style={styles.label}>Teto de Gastos Variáveis</Text>
          <View style={{flexDirection: 'row', gap: 10}}>
             <TextInput 
               style={[styles.input, {flex: 1, marginBottom: 0}]} 
               placeholderTextColor={theme.colors.inputPlaceholder} 
               keyboardType="numeric" 
               value={extraValor} 
               onChangeText={(text) => setExtraValor(formatCurrencyInput(text))} 
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

// --- FUNÇÃO GERADORA DE ESTILOS ---
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