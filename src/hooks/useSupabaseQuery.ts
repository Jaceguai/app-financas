import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  fetchConfig,
  fetchFixedExpenses,
  fetchIncomes,
  fetchProjectTransactions,
  fetchProjects,
  fetchSavingsDeposits,
  fetchSavingsGoalTransactions,
  fetchSavingsGoals,
  fetchTransactions,
} from '../services/api';

export const useTransactions = (workspaceId: string | undefined, month?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`transactions:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['transactions', workspaceId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);

  return useQuery({
    queryKey: ['transactions', workspaceId, month],
    queryFn: () => fetchTransactions(workspaceId!, month),
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 2,
  });
};

export const useFixedExpenses = (workspaceId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`fixed_expenses:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fixed_expenses',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['fixed_expenses', workspaceId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);

  return useQuery({
    queryKey: ['fixed_expenses', workspaceId],
    queryFn: () => fetchFixedExpenses(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useIncomes = (workspaceId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`incomes:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incomes',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['incomes', workspaceId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);

  return useQuery({
    queryKey: ['incomes', workspaceId],
    queryFn: () => fetchIncomes(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useSavingsGoals = (workspaceId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`savings_goals:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'savings_goals',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['savings_goals', workspaceId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);

  return useQuery({
    queryKey: ['savings_goals', workspaceId],
    queryFn: () => fetchSavingsGoals(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useWorkspaceConfig = (workspaceId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`workspace_settings:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_settings',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['workspace_settings', workspaceId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);

  return useQuery({
    queryKey: ['workspace_settings', workspaceId],
    queryFn: () => fetchConfig(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useProjects = (workspaceId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`projects:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);

  return useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => fetchProjects(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useProjectTransactions = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['project_transactions', projectId],
    queryFn: () => fetchProjectTransactions(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2,
  });
};

export const useSavingsDeposits = (goalId: string | undefined) => {
  return useQuery({
    queryKey: ['savings_deposits', goalId],
    queryFn: () => fetchSavingsDeposits(goalId!),
    enabled: !!goalId,
    staleTime: 1000 * 60 * 2,
  });
};

export const useSavingsGoalTransactions = (goalId: string | undefined) => {
  return useQuery({
    queryKey: ['savings_goal_transactions', goalId],
    queryFn: () => fetchSavingsGoalTransactions(goalId!),
    enabled: !!goalId,
    staleTime: 1000 * 60 * 2,
  });
};
