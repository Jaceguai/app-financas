export * from './categories';

export const PAYMENT_METHODS = {
  DEBIT: 'debit',
  CREDIT: 'credit',
} as const;

export const RESPONSAVEIS = {
  A: 'A',
  B: 'B',
  AMBOS: 'Ambos',
} as const;

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
