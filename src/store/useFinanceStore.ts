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

const detectPaymentMethod = (item: any): 'debit' | 'credit' => {
  const rawValue = item.paymentmethod || item.formapagamento || item.paymentMethod || '';
  const stringValue = String(rawValue).toLowerCase().trim();
  
  if (stringValue.includes('credit') || stringValue.includes('crédito') || stringValue.includes('credito')) {
    return 'credit';
  }
  
  return 'debit';
};

interface FinanceStore {
  currentUser: string;
  extraGastosVariaveis: number;
  selectedMonth: string;
  poupancas: Poupanca[];
  rendasFixas: RendaFixa[];
  rendas: Renda[];
  recentTransactions: Transaction[];
  hideValues: boolean;

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
  
  getTransactionsByMonth: () => Transaction[];
  getRendaTotal: () => number;
  getGastosFixosDebit: () => number;
  getGastosVariaveisDebit: () => number;
  getInvoiceFixed: () => number;
  getInvoiceVariable: () => number;
  getInvoiceTotal: () => number;
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      currentUser: 'Usuário A',
      extraGastosVariaveis: 1000,
      selectedMonth: getCurrentMonth(),
      poupancas: [],
      rendasFixas: [],
      rendas: [],
      recentTransactions: [],
      hideValues: false,

      setCurrentUser: (user) => set({ currentUser: user }),
      setExtraGastosVariaveis: (valor) => set({ extraGastosVariaveis: valor }),
      setSelectedMonth: (month) => set({ selectedMonth: month }),
      setHideValues: (hide) => set({ hideValues: hide }),

      getRendaTotal: () => {
        const state = get();
        return (state.rendas || []).reduce((sum, r) => sum + (Number(r.valor) || 0), 0);
      },

      getGastosFixosDebit: () => {
        const state = get();
        return (state.rendasFixas || [])
          .filter(r => r.paymentMethod !== 'credit') 
          .reduce((sum, r) => sum + (Number(r.valor) || 0), 0);
      },

      getGastosVariaveisDebit: () => {
        const transacoesDoMes = get().getTransactionsByMonth();
        return transacoesDoMes
          .filter(t => t.paymentMethod !== 'credit') 
          .reduce((sum, t) => sum + (Number(t.value) || 0), 0);
      },

      getInvoiceFixed: () => {
        const state = get();
        return (state.rendasFixas || [])
          .filter(r => r.paymentMethod === 'credit')
          .reduce((sum, r) => sum + (Number(r.valor) || 0), 0);
      },

      getInvoiceVariable: () => {
        const transacoesDoMes = get().getTransactionsByMonth();
        return transacoesDoMes
          .filter(t => t.paymentMethod === 'credit')
          .reduce((sum, t) => sum + (Number(t.value) || 0), 0);
      },

      getInvoiceTotal: () => {
        return get().getInvoiceFixed() + get().getInvoiceVariable();
      },

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

      addPoupanca: (poupanca) => set((state) => ({ poupancas: [...(state.poupancas || []), poupanca] })),
      removePoupanca: (id) => set((state) => ({ poupancas: (state.poupancas || []).filter((p) => p.id !== id) })),
      updatePoupanca: (id, atual) => set((state) => ({ poupancas: (state.poupancas || []).map((p) => (p.id === id ? { ...p, atual } : p)) })),

      addRendaFixa: (renda) => set((state) => ({ rendasFixas: [...(state.rendasFixas || []), renda] })),
      removeRendaFixa: (id) => set((state) => ({ rendasFixas: (state.rendasFixas || []).filter((r) => r.id !== id) })),

      addRenda: (renda) => set((state) => ({ rendas: [...(state.rendas || []), renda] })),
      removeRenda: (id) => set((state) => ({ rendas: (state.rendas || []).filter((r) => r.id !== id) })),

      addTransaction: (transaction) => set((state) => ({ recentTransactions: [transaction, ...(state.recentTransactions || [])].slice(0, 500) })),
      clearTransactions: () => set({ recentTransactions: [] }),

      syncFromDrive: (data: DriveData) => {
        const configArr = data.config || [];
        const extraConfig = configArr.find((c: any) => (c.chave || c.key) === 'extraGastosVariaveis');
        const extraValor = extraConfig ? Number(extraConfig.valor || extraConfig.value) || 1000 : 1000;
        
        const hideValuesConfig = configArr.find((c: any) => (c.chave || c.key) === 'hideValues');
        const hideValuesDefault = hideValuesConfig ? (hideValuesConfig.valor || hideValuesConfig.value) === 'true' : false;

        set({
          extraGastosVariaveis: extraValor,
          hideValues: hideValuesDefault,
          
          recentTransactions: (data.transacoes || []).map((t: any) => ({
            id: String(Math.random()),
            description: t.descricao || t.description || '',
            value: Number(t.valor || t.value) || 0,
            category: t.categoria || t.category || 'Outros',
            userName: t.usuario || t.user || 'Desconhecido',
            date: t.data || t.date || new Date().toISOString(),
            type: 'expense',
            paymentMethod: detectPaymentMethod(t) 
          })),

          rendasFixas: (data.fixos || []).map((f: any) => ({
            id: String(Math.random()),
            descricao: f.descricao || '',
            valor: Number(f.valor) || 0,
            responsavel: f.responsavel || 'Ambos',
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