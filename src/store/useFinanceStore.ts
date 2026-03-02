import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getCurrentMonth = () => {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
};

interface FinanceStore {
  selectedMonth: string;
  hideValues: boolean;
  extraGastosVariaveis: number;

  setSelectedMonth: (month: string) => void;
  setHideValues: (hide: boolean) => void;
  setExtraGastosVariaveis: (valor: number) => void;
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set) => ({
      selectedMonth: getCurrentMonth(),
      hideValues: false,
      extraGastosVariaveis: 1000,

      setSelectedMonth: (month) => set({ selectedMonth: month }),
      setHideValues: (hide) => set({ hideValues: hide }),
      setExtraGastosVariaveis: (valor) => set({ extraGastosVariaveis: valor }),
    }),
    {
      name: 'finance-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
