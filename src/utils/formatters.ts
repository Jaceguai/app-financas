/**
 * Formata valor monetário com opção de ocultar
 */
export const formatCurrency = (value: number, hideValue: boolean = false): string => {
  if (hideValue) {
    return 'R$ •••••';
  }
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
};

/**
 * Formata percentual com opção de ocultar
 */
export const formatPercentage = (value: number, hideValue: boolean = false): string => {
  if (hideValue) {
    return '•••%';
  }
  return `${value.toFixed(1)}%`;
};

/**
 * Formata data para exibição
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
};

/**
 * Formata data com hora
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Parse valor monetário formatado para número
 */
export const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/\D/g, '')) / 100;
};

/**
 * Formata número para moeda durante digitação
 */
export const formatCurrencyInput = (text: string): string => {
  const numbers = text.replace(/\D/g, '');
  const amount = parseFloat(numbers) / 100;
  return amount.toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};
