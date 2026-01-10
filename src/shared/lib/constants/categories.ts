export const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Lazer',
  'Saúde',
  'Educação',
  'Moradia',
  'Vestuário',
  'Outros',
] as const;

export type Category = typeof CATEGORIES[number];

export const CATEGORY_ICONS: Record<Category, string> = {
  'Alimentação': 'restaurant',
  'Transporte': 'car',
  'Lazer': 'game-controller',
  'Saúde': 'medical',
  'Educação': 'school',
  'Moradia': 'home',
  'Vestuário': 'shirt',
  'Outros': 'ellipsis-horizontal',
};

export const CATEGORY_COLORS: Record<Category, string> = {
  'Alimentação': '#10b981',
  'Transporte': '#3b82f6',
  'Lazer': '#f59e0b',
  'Saúde': '#ef4444',
  'Educação': '#8b5cf6',
  'Moradia': '#06b6d4',
  'Vestuário': '#ec4899',
  'Outros': '#6b7280',
};
