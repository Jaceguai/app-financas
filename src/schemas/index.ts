import { z } from 'zod';

// ========== Auth Schemas ==========

export const loginSchema = z.object({
  email: z.string().min(1, 'Email é obrigatório').email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  displayName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(50, 'Nome muito longo'),
  email: z.string().min(1, 'Email é obrigatório').email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirme sua senha'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// ========== Workspace Schemas ==========

export const workspaceSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(50, 'Nome muito longo'),
});

export type WorkspaceFormData = z.infer<typeof workspaceSchema>;

export const joinWorkspaceSchema = z.object({
  code: z.string().length(6, 'Código deve ter 6 caracteres').regex(/^[A-Z0-9]+$/, 'Código inválido'),
});

export type JoinWorkspaceFormData = z.infer<typeof joinWorkspaceSchema>;

// ========== Transaction Schema ==========

export const transactionSchema = z.object({
  value: z.string()
    .min(1, 'Valor é obrigatório')
    .refine((val) => {
      const num = parseFloat(val.replace(/\D/g, '')) / 100;
      return num > 0;
    }, 'Valor deve ser maior que zero'),
  description: z.string()
    .min(1, 'Descrição é obrigatória')
    .max(100, 'Descrição muito longa'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  paymentMethod: z.enum(['debit', 'credit']),
  installments: z.number().min(1).max(48).optional(),
  fromSavings: z.boolean().optional().default(false),
  savingsGoalId: z.string().uuid().optional(),
}).refine(
  (data) => !data.fromSavings || !!data.savingsGoalId,
  { message: 'Selecione uma meta de poupança', path: ['savingsGoalId'] },
);

export type TransactionFormData = z.input<typeof transactionSchema>;

// ========== Fixed Expense Schema ==========

export const fixedExpenseSchema = z.object({
  descricao: z.string()
    .min(1, 'Descrição é obrigatória')
    .max(100, 'Descrição muito longa'),
  valor: z.string()
    .min(1, 'Valor é obrigatório')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.').trim());
      return !isNaN(num) && num > 0;
    }, 'Valor inválido'),
  responsibleMemberId: z.string().optional(),
  paymentMethod: z.enum(['debit', 'credit']),
});

export type FixedExpenseFormData = z.infer<typeof fixedExpenseSchema>;

// ========== Income Schema ==========

export const rendaSchema = z.object({
  descricao: z.string()
    .min(1, 'Descrição é obrigatória')
    .max(100, 'Descrição muito longa'),
  valor: z.string()
    .min(1, 'Valor é obrigatório')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.').trim());
      return !isNaN(num) && num > 0;
    }, 'Valor inválido'),
  responsibleMemberId: z.string().optional(),
});

export type RendaFormData = z.infer<typeof rendaSchema>;

// ========== Savings Goal Schema ==========

export const metaSchema = z.object({
  nome: z.string()
    .min(1, 'Nome é obrigatório')
    .max(50, 'Nome muito longo'),
  objetivo: z.string()
    .min(1, 'Objetivo é obrigatório')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.').trim());
      return !isNaN(num) && num > 0;
    }, 'Objetivo inválido'),
  atual: z.string()
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      const num = parseFloat(val.replace(',', '.').trim());
      return !isNaN(num) && num >= 0;
    }, 'Valor atual inválido'),
});

export type MetaFormData = z.infer<typeof metaSchema>;

// ========== Deposit Schema ==========

export const depositoMetaSchema = z.object({
  valor: z.string()
    .min(1, 'Valor é obrigatório')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.').trim());
      return !isNaN(num) && num > 0;
    }, 'Valor inválido'),
});

export type DepositoMetaFormData = z.infer<typeof depositoMetaSchema>;

// ========== Config Schema ==========

export const configSchema = z.object({
  extraGastosVariaveis: z.string()
    .min(1, 'Valor é obrigatório')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.').trim());
      return !isNaN(num) && num > 0;
    }, 'Valor inválido'),
});

export type ConfigFormData = z.infer<typeof configSchema>;
