const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz9a0yu4oKtdRva1SQ4Y2Y2dMqPF9j6Y6BJTO86NcBCLw39Ui2Twxg2thK-2NG3VQdt/exec';

export interface TransactionPayload {
  description: string;
  value: number;
  category: string;
  user: string;
  paymentMethod: 'debit' | 'credit'
}

export interface FixedExpensePayload {
  descricao: string;
  valor: number;
  responsavel: 'A' | 'B' | 'Ambos';
  category?: string;
  paymentMethod: 'debit' | 'credit'
}

export interface MetaPayload {
  nome: string;
  objetivo: number;
  atual: number;
}

export interface RendaPayload {
  descricao: string;
  valor: number;
  responsavel: 'A' | 'B' | 'Ambos';
}

export interface DriveData {
  transacoes: any[];
  fixos: any[];
  metas: any[];
  rendas: any[];
  config: any[];
}

export const sendTransaction = async (data: TransactionPayload): Promise<void> => {
  await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify({ action: 'ADD_TRANSACTION', ...data }),
  });
};

export const sendFixedExpense = async (data: FixedExpensePayload): Promise<void> => {
  await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify({ action: 'ADD_FIXO', ...data }),
  });
};

export const addSavingsGoal = async (data: MetaPayload): Promise<void> => {
  await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify({ action: 'ADD_META', ...data }),
  });
};

export const sendRenda = async (data: RendaPayload): Promise<void> => {
  await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify({ action: 'ADD_RENDA', ...data }),
  });
};

export const updateSharedConfig = async (key: string, value: number | string): Promise<void> => {
  await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify({ action: 'UPDATE_CONFIG', chave: key, valor: value }),
  });
};

export const fetchDriveData = async (): Promise<DriveData> => {
  const response = await fetch(GOOGLE_SCRIPT_URL);
  return response.json();
};

export const depositToMeta = async (nome: string, valor: number): Promise<void> => {
  await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify({ action: 'DEPOSIT_META', nome, valor }),
  });
};

export const deleteFixo = async (descricao: string): Promise<void> => {
  await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify({ action: 'DELETE_FIXO', descricao }),
  });
};

export const deleteRenda = async (descricao: string): Promise<void> => {
  await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify({ action: 'DELETE_RENDA', descricao }),
  });
};

export const deleteMeta = async (nome: string): Promise<void> => {
  await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify({ action: 'DELETE_META', nome }),
  });
};