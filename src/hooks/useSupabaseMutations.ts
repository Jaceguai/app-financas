import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    deleteFixedExpense,
    deleteIncome,
    deleteProject,
    deleteSavingsGoal,
    deleteTransaction,
    depositToGoal,
    insertFixedExpense,
    insertIncome,
    insertProject,
    insertSavingsGoal,
    insertTransaction,
    updateProject,
    upsertConfig,
} from '../services/api';

export const useAddTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: insertTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useAddFixedExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: insertFixedExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
    },
  });
};

export const useDeleteFixedExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFixedExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
    },
  });
};

export const useAddIncome = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: insertIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
    },
  });
};

export const useDeleteIncome = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
    },
  });
};

export const useAddSavingsGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: insertSavingsGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] });
    },
  });
};

export const useDepositToGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => depositToGoal(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] });
    },
  });
};

export const useDeleteSavingsGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSavingsGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] });
    },
  });
};

export const useUpdateConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, key, value }: { workspaceId: string; key: string; value: string }) =>
      upsertConfig(workspaceId, key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace_settings'] });
    },
  });
};

export const useAddProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: insertProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string; name?: string; description?: string; icon?: string; color?: string; budget?: number | null; is_active?: boolean }) =>
      updateProject(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project_transactions'] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};
