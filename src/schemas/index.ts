import { z } from 'zod';

/**
 * Schema para transação
 */
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
});

export type TransactionFormData = z.infer<typeof transactionSchema>;

/**
 * Schema para gasto fixo
 */
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
  responsavel: z.enum(['A', 'B', 'Ambos']),
  paymentMethod: z.enum(['debit', 'credit']),
});

export type FixedExpenseFormData = z.infer<typeof fixedExpenseSchema>;

/**
 * Schema para renda
 */
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
  responsavel: z.enum(['A', 'B', 'Ambos']),
});

export type RendaFormData = z.infer<typeof rendaSchema>;

/**
 * Schema para meta de poupança
 */
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
    .min(1, 'Valor atual é obrigatório')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.').trim());
      return !isNaN(num) && num >= 0;
    }, 'Valor atual inválido'),
});

export type MetaFormData = z.infer<typeof metaSchema>;

/**
 * Schema para depósito em meta
 */
export const depositoMetaSchema = z.object({
  valor: z.string()
    .min(1, 'Valor é obrigatório')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.').trim());
      return !isNaN(num) && num > 0;
    }, 'Valor inválido'),
});

export type DepositoMetaFormData = z.infer<typeof depositoMetaSchema>;

/**
 * Schema para configuração de gastos variáveis
 */
export const configSchema = z.object({
  extraGastosVariaveis: z.string()
    .min(1, 'Valor é obrigatório')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.').trim());
      return !isNaN(num) && num > 0;
    }, 'Valor inválido'),
});

export type ConfigFormData = z.infer<typeof configSchema>;
