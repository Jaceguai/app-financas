-- ============================================================
-- PARCELAS: Adicionar suporte a compras parceladas no crédito
-- Rode no SQL Editor do Supabase
-- ============================================================

-- 1. Adicionar colunas de parcelamento na tabela transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS installment_id uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS installment_current integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS installment_total integer DEFAULT NULL;

-- 2. Índice para agrupar parcelas rapidamente
CREATE INDEX IF NOT EXISTS idx_transactions_installment_id
ON public.transactions(installment_id)
WHERE installment_id IS NOT NULL;

-- 3. Comentários para documentação
COMMENT ON COLUMN public.transactions.installment_id IS 'UUID compartilhado entre todas as parcelas de uma mesma compra';
COMMENT ON COLUMN public.transactions.installment_current IS 'Número da parcela atual (1, 2, 3...)';
COMMENT ON COLUMN public.transactions.installment_total IS 'Total de parcelas (ex: 12 para 12x)';
