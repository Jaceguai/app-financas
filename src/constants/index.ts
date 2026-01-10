export * from './categories';

export const PAYMENT_METHODS = {
  DEBIT: 'debit',
  CREDIT: 'credit',
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

export const RESPONSAVEIS = {
  A: 'A',
  B: 'B',
  AMBOS: 'Ambos',
} as const;

export type Responsavel = typeof RESPONSAVEIS[keyof typeof RESPONSAVEIS];

export const RESPONSAVEL_LABELS: Record<string, string> = {
  A: 'Eu',
  B: 'Esposa',
  Ambos: 'Ambos',
};

export const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

export type Mes = typeof MESES[number];
