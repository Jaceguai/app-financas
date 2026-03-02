export interface Transaction {
  id: string;
  workspace_id: string;
  user_id: string;
  description: string;
  amount: number;
  category: string;
  payment_method: 'debit' | 'credit';
  transaction_date: string;
  created_at: string;
  // Joined field for display
  user_display_name?: string;
  // Installment fields
  installment_id?: string | null;
  installment_current?: number | null;
  installment_total?: number | null;
  // Project field
  project_id?: string | null;
}

export interface FixedExpense {
  id: string;
  workspace_id: string;
  description: string;
  amount: number;
  responsible_member_id: string | null;
  payment_method: 'debit' | 'credit';
  created_at: string;
}

export interface Income {
  id: string;
  workspace_id: string;
  description: string;
  amount: number;
  responsible_member_id: string | null;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  workspace_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  created_at: string;
}

export interface WorkspaceConfig {
  id: string;
  workspace_id: string;
  key: string;
  value: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  budget: number | null;
  is_active: boolean;
  created_at: string;
}

// Legacy aliases for gradual migration
export type Poupanca = SavingsGoal;
export type RendaFixa = FixedExpense;
