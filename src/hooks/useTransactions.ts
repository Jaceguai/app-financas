import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { sendTransaction, TransactionPayload } from '../services/api';
import { useFinanceStore } from '../store/useFinanceStore';
import { Transaction } from '../types';

export const useTransactions = () => {
  const addTransaction = useFinanceStore((state) => state.addTransaction);
  
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const mutation = useMutation({
    mutationFn: async (data: TransactionPayload) => {
      // Verifica conexão antes de tentar enviar
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected) {
        throw new Error('Sem conexão com a internet. Verifique sua conexão e tente novamente.');
      }

      // CORREÇÃO 2: Chamamos a função correta que existe no api.ts
      return sendTransaction(data);
    },
    onSuccess: (_, variables) => {
      // Se a API aceitar, atualizamos o estado local para o usuário ver instantaneamente
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        description: variables.description,
        value: variables.value,
        category: variables.category,
        type: 'expense',
        userName: variables.user,
      };

      addTransaction(newTransaction);

      showToast('Transação enviada com sucesso!', 'success');
      
      // Esconde o toast automaticamente após 3 segundos
      setTimeout(() => hideToast(), 3000);
    },
    onError: (error: Error) => {
      console.error("Erro no envio:", error);
      showToast(
        error.message || 'Erro ao enviar transação. Tente novamente.',
        'error'
      );
    },
  });

  return {
    sendTransaction: mutation.mutate,
    isLoading: mutation.isPending, // isPending substitui isLoading nas versões novas do React Query
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
    toast,
    hideToast,
  };
};