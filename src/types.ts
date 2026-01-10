export interface Transaction {
  id: string;
  date: string;
  description: string;
  value: number;
  category: string;
  type: 'income' | 'expense';
  userName: string;
  paymentMethod: 'debit' | 'credit'
}

export interface Poupanca {
  id: string;
  nome: string;
  objetivo: number;
  atual: number;
}

export interface RendaFixa {
  id: string;
  descricao: string;
  valor: number;
  responsavel: 'A' | 'B' | 'Ambos';
  paymentMethod: 'debit' | 'credit'
}