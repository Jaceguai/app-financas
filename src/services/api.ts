import { supabase } from '../lib/supabase';
import { FixedExpense, Income, Project, SavingsGoal, Transaction, WorkspaceConfig } from '../types';

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ========== Transactions ==========

export const insertTransaction = async (data: {
  workspace_id: string;
  user_id: string;
  description: string;
  amount: number;
  category: string;
  payment_method: 'debit' | 'credit';
  installments?: number;
  project_id?: string | null;
}): Promise<Transaction> => {
  const totalInstallments = data.installments && data.installments > 1 ? data.installments : null;

  if (totalInstallments) {
    // Parcelado: criar N transações distribuídas nos meses seguintes
    const installmentId = generateUUID();
    const installmentAmount = Math.round((data.amount / totalInstallments) * 100) / 100;
    const now = new Date();

    const rows = Array.from({ length: totalInstallments }, (_, i) => {
      const txDate = new Date(now.getFullYear(), now.getMonth() + i, now.getDate());
      return {
        workspace_id: data.workspace_id,
        user_id: data.user_id,
        description: data.description,
        amount: installmentAmount,
        category: data.category,
        payment_method: data.payment_method,
        transaction_date: txDate.toISOString(),
        installment_id: installmentId,
        installment_current: i + 1,
        installment_total: totalInstallments,
        ...(data.project_id ? { project_id: data.project_id } : {}),
      };
    });

    const { data: result, error } = await supabase
      .from('transactions')
      .insert(rows)
      .select();

    if (error) throw new Error(error.message);
    return result[0];
  }

  // Compra à vista (sem parcelas)
  const { data: result, error } = await supabase
    .from('transactions')
    .insert({
      workspace_id: data.workspace_id,
      user_id: data.user_id,
      description: data.description,
      amount: data.amount,
      category: data.category,
      payment_method: data.payment_method,
      transaction_date: new Date().toISOString(),
      ...(data.project_id ? { project_id: data.project_id } : {}),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const fetchTransactions = async (workspaceId: string, month?: string): Promise<Transaction[]> => {
  // DEBUG: Verificar acesso
  const { data: debugData } = await supabase.rpc('debug_workspace_access', { ws_id: workspaceId });
  console.log('DEBUG workspace access:', debugData);

  // Usa RPC para bypassar problemas de RLS
  const { data, error } = await supabase.rpc('get_workspace_transactions', {
    ws_id: workspaceId,
    month_filter: null,
  });

  console.log('Transações retornadas:', data?.length || 0, 'erro:', error?.message);

  if (error) {
    console.error('Erro ao buscar transações:', error);
    throw new Error(error.message);
  }

  // Se tiver filtro de mês, filtra no cliente
  if (month && data) {
    const [mes, ano] = month.split('/');
    return data.filter((t: Transaction) => {
      const txDate = new Date(t.transaction_date);
      return txDate.getMonth() + 1 === parseInt(mes) && txDate.getFullYear() === parseInt(ano);
    });
  }

  return data ?? [];
};

// ========== Fixed Expenses ==========

export const insertFixedExpense = async (data: {
  workspace_id: string;
  description: string;
  amount: number;
  responsible_member_id?: string | null;
  payment_method: 'debit' | 'credit';
}): Promise<FixedExpense> => {
  const { data: result, error } = await supabase
    .from('fixed_expenses')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result;
};

export const deleteFixedExpense = async (id: string): Promise<void> => {
  const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const fetchFixedExpenses = async (workspaceId: string): Promise<FixedExpense[]> => {
  // Usa RPC para bypassar problemas de RLS
  const { data, error } = await supabase.rpc('get_workspace_fixed_expenses', {
    ws_id: workspaceId,
  });

  if (error) throw new Error(error.message);
  return data ?? [];
};

// ========== Incomes ==========

export const insertIncome = async (data: {
  workspace_id: string;
  description: string;
  amount: number;
  responsible_member_id?: string | null;
}): Promise<Income> => {
  const { data: result, error } = await supabase
    .from('incomes')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result;
};

export const deleteIncome = async (id: string): Promise<void> => {
  const { error } = await supabase.from('incomes').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const fetchIncomes = async (workspaceId: string): Promise<Income[]> => {
  // Usa RPC para bypassar problemas de RLS
  const { data, error } = await supabase.rpc('get_workspace_incomes', {
    ws_id: workspaceId,
  });

  if (error) throw new Error(error.message);
  return data ?? [];
};

// ========== Savings Goals ==========

export const insertSavingsGoal = async (data: {
  workspace_id: string;
  name: string;
  target_amount: number;
  current_amount?: number;
}): Promise<SavingsGoal> => {
  const { data: result, error } = await supabase
    .from('savings_goals')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result;
};

export const depositToGoal = async (id: string, additionalAmount: number): Promise<SavingsGoal> => {
  // First get current amount
  const { data: current, error: fetchError } = await supabase
    .from('savings_goals')
    .select('current_amount')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const newAmount = (Number(current.current_amount) || 0) + additionalAmount;

  const { data: result, error } = await supabase
    .from('savings_goals')
    .update({ current_amount: newAmount })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result;
};

export const deleteSavingsGoal = async (id: string): Promise<void> => {
  const { error } = await supabase.from('savings_goals').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const fetchSavingsGoals = async (workspaceId: string): Promise<SavingsGoal[]> => {
  // Usa RPC para bypassar problemas de RLS
  const { data, error } = await supabase.rpc('get_workspace_savings_goals', {
    ws_id: workspaceId,
  });

  if (error) throw new Error(error.message);
  return data ?? [];
};

// ========== Workspace Config ==========

export const upsertConfig = async (workspaceId: string, key: string, value: string): Promise<void> => {
  const { error } = await supabase
    .from('workspace_settings')
    .upsert(
      { workspace_id: workspaceId, key, value, updated_at: new Date().toISOString() },
      { onConflict: 'workspace_id,key' }
    );

  if (error) throw new Error(error.message);
};

export const fetchConfig = async (workspaceId: string): Promise<WorkspaceConfig[]> => {
  // Usa RPC para bypassar problemas de RLS
  const { data, error } = await supabase.rpc('get_workspace_settings', {
    ws_id: workspaceId,
  });

  if (error) throw new Error(error.message);
  return data ?? [];
};

// ========== Projects ==========

export const fetchProjects = async (workspaceId: string): Promise<Project[]> => {
  const { data, error } = await supabase.rpc('get_workspace_projects', {
    ws_id: workspaceId,
  });
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const insertProject = async (data: {
  workspace_id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  budget?: number | null;
}): Promise<Project> => {
  const { data: result, error } = await supabase
    .from('projects')
    .insert({
      workspace_id: data.workspace_id,
      name: data.name,
      description: data.description || '',
      icon: data.icon || 'folder-outline',
      color: data.color || '#8b5cf6',
      budget: data.budget || null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return result;
};

export const updateProject = async (id: string, updates: {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  budget?: number | null;
  is_active?: boolean;
}): Promise<Project> => {
  const { data: result, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return result;
};

export const deleteProject = async (id: string): Promise<void> => {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const fetchProjectTransactions = async (projectId: string): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('project_id', projectId)
    .order('transaction_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
};
