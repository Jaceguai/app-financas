import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Poupanca, RendaFixa } from '../types';

interface Renda {
  id: string;
  descricao: string;
  valor: number;
  responsavel: 'A' | 'B' | 'Ambos';
}

interface DriveData {
  transacoes: any[];
  fixos: any[];
  metas: any[];
  rendas: any[];
  config: any[];
}

const getCurrentMonth = () => {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
};

// --- FUNÇÃO AUXILIAR ESSENCIAL ---
// Garante que o App entenda se é Crédito ou Débito vindo da planilha
const detectPaymentMethod = (item: any): 'debit' | 'credit' => {
  // Verifica todas as possibilidades de nome de coluna que o Google pode devolver
  const rawValue = item.paymentmethod || item.formapagamento || item.paymentMethod || '';
  const stringValue = String(rawValue).toLowerCase().trim();
  
  // Se contiver "credit" ou "crédito", é Cartão de Crédito
  if (stringValue.includes('credit') || stringValue.includes('crédito') || stringValue.includes('credito')) {
    return 'credit';
  }
  
  // Se estiver vazio ou for qualquer outra coisa, assume Débito/Pix
  return 'debit';
};

interface FinanceStore {
  // Estado
  currentUser: string;
  extraGastosVariaveis: number;
  selectedMonth: string;
  poupancas: Poupanca[];
  rendasFixas: RendaFixa[];
  rendas: Renda[];
  recentTransactions: Transaction[];
  hideValues: boolean;

  // Actions (Setters)
  setCurrentUser: (user: string) => void;
  setExtraGastosVariaveis: (valor: number) => void;
  setSelectedMonth: (month: string) => void;
  setHideValues: (hide: boolean) => void;

  addPoupanca: (poupanca: Poupanca) => void;
  removePoupanca: (id: string) => void;
  updatePoupanca: (id: string, atual: number) => void;

  addRendaFixa: (renda: RendaFixa) => void;
  removeRendaFixa: (id: string) => void;

  addRenda: (renda: Renda) => void;
  removeRenda: (id: string) => void;

  addTransaction: (transaction: Transaction) => void;
  clearTransactions: () => void;

  syncFromDrive: (data: DriveData) => void;
  
  // Getters (Cálculos)
  getTransactionsByMonth: () => Transaction[];
  getRendaTotal: () => number;
  
  getGastosFixosDebit: () => number;    // Sai da conta (Pix/Débito)
  getGastosVariaveisDebit: () => number; // Sai da conta (Pix/Débito)
  
  getInvoiceFixed: () => number;        // Fatura (Assinaturas Fixas)
  getInvoiceVariable: () => number;     // Fatura (Compras Variáveis)
  getInvoiceTotal: () => number;        // Fatura Total
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      // --- Estado Inicial ---
      currentUser: 'Usuário A',
      extraGastosVariaveis: 1000,
      selectedMonth: getCurrentMonth(),
      poupancas: [],
      rendasFixas: [],
      rendas: [],
      recentTransactions: [],
      hideValues: false,

      // --- Setters Simples ---
      setCurrentUser: (user) => set({ currentUser: user }),
      setExtraGastosVariaveis: (valor) => set({ extraGastosVariaveis: valor }),
      setSelectedMonth: (month) => set({ selectedMonth: month }),
      setHideValues: (hide) => set({ hideValues: hide }),

      // --- Getters Avançados ---

      // 1. Renda Total (Soma salários)
      getRendaTotal: () => {
        const state = get();
        return (state.rendas || []).reduce((sum, r) => sum + (Number(r.valor) || 0), 0);
      },

      // 2. Gastos Fixos no DÉBITO (Sai do saldo agora)
      getGastosFixosDebit: () => {
        const state = get();
        return (state.rendasFixas || [])
          .filter(r => r.paymentMethod !== 'credit') 
          .reduce((sum, r) => sum + (Number(r.valor) || 0), 0);
      },

      // 3. Gastos Variáveis no DÉBITO (Sai do saldo agora)
      getGastosVariaveisDebit: () => {
        const transacoesDoMes = get().getTransactionsByMonth();
        return transacoesDoMes
          .filter(t => t.paymentMethod !== 'credit') 
          .reduce((sum, t) => sum + (Number(t.value) || 0), 0);
      },

      // 4. Fatura - Parte FIXA (Ex: Netflix, Assinaturas)
      getInvoiceFixed: () => {
        const state = get();
        return (state.rendasFixas || [])
          .filter(r => r.paymentMethod === 'credit')
          .reduce((sum, r) => sum + (Number(r.valor) || 0), 0);
      },

      // 5. Fatura - Parte VARIÁVEL (Ex: Uber, Ifood no crédito)
      getInvoiceVariable: () => {
        const transacoesDoMes = get().getTransactionsByMonth();
        return transacoesDoMes
          .filter(t => t.paymentMethod === 'credit')
          .reduce((sum, t) => sum + (Number(t.value) || 0), 0);
      },

      // 6. Fatura TOTAL (Soma Fixos + Variáveis do mês)
      getInvoiceTotal: () => {
        return get().getInvoiceFixed() + get().getInvoiceVariable();
      },

      // 7. Filtra transações pelo mês selecionado
      getTransactionsByMonth: () => {
        const state = get();
        const [mes, ano] = (state.selectedMonth || getCurrentMonth()).split('/');
        return (state.recentTransactions || []).filter((t) => {
          const d = new Date(t.date);
          const tMes = String(d.getMonth() + 1).padStart(2, '0');
          const tAno = String(d.getFullYear());
          return tMes === mes && tAno === ano;
        });
      },

      // --- Manipulação de Listas (Add/Remove/Update) ---
      addPoupanca: (poupanca) => set((state) => ({ poupancas: [...(state.poupancas || []), poupanca] })),
      removePoupanca: (id) => set((state) => ({ poupancas: (state.poupancas || []).filter((p) => p.id !== id) })),
      updatePoupanca: (id, atual) => set((state) => ({ poupancas: (state.poupancas || []).map((p) => (p.id === id ? { ...p, atual } : p)) })),

      addRendaFixa: (renda) => set((state) => ({ rendasFixas: [...(state.rendasFixas || []), renda] })),
      removeRendaFixa: (id) => set((state) => ({ rendasFixas: (state.rendasFixas || []).filter((r) => r.id !== id) })),

      addRenda: (renda) => set((state) => ({ rendas: [...(state.rendas || []), renda] })),
      removeRenda: (id) => set((state) => ({ rendas: (state.rendas || []).filter((r) => r.id !== id) })),

      addTransaction: (transaction) => set((state) => ({ recentTransactions: [transaction, ...(state.recentTransactions || [])].slice(0, 500) })),
      clearTransactions: () => set({ recentTransactions: [] }),

      // --- Sincronização com Google Drive ---
      syncFromDrive: (data: DriveData) => {
        const configArr = data.config || [];
        const extraConfig = configArr.find((c: any) => c.chave === 'extraGastosVariaveis');
        const extraValor = extraConfig ? Number(extraConfig.valor) || 1000 : 1000;
        
        const hideValuesConfig = configArr.find((c: any) => c.chave === 'hideValues');
        const hideValuesDefault = hideValuesConfig ? hideValuesConfig.valor === 'true' : false;

        set({
          extraGastosVariaveis: extraValor,
          hideValues: hideValuesDefault,
          
          recentTransactions: (data.transacoes || []).map((t: any) => ({
            id: String(Math.random()), // Gera ID temporário
            description: t.descricao || t.description || '',
            value: Number(t.valor || t.value) || 0,
            category: t.categoria || t.category || 'Outros',
            userName: t.usuario || t.user || 'Desconhecido',
            date: t.data || t.date || new Date().toISOString(),
            type: 'expense',
            // Detecta corretamente se é Crédito ou Débito
            paymentMethod: detectPaymentMethod(t) 
          })),

          rendasFixas: (data.fixos || []).map((f: any) => ({
            id: String(Math.random()),
            descricao: f.descricao || '',
            valor: Number(f.valor) || 0,
            responsavel: f.responsavel || 'Ambos',
            // Detecta corretamente se é Crédito ou Débito
            paymentMethod: detectPaymentMethod(f)
          })),

          poupancas: (data.metas || []).map((m: any) => ({
            id: String(Math.random()),
            nome: m.nome || '',
            objetivo: Number(m.objetivo) || 0,
            atual: Number(m.atual) || 0,
          })),

          rendas: (data.rendas || []).map((r: any) => ({
            id: String(Math.random()),
            descricao: r.descricao || '',
            valor: Number(r.valor) || 0,
            responsavel: r.responsavel || 'Ambos',
          })),
        });
      },
    }),
    {
      name: 'finance-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        extraGastosVariaveis: state.extraGastosVariaveis,
        selectedMonth: state.selectedMonth,
        poupancas: state.poupancas,
        rendasFixas: state.rendasFixas,
        rendas: state.rendas,
        recentTransactions: state.recentTransactions,
      }),
    }
  )
);