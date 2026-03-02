-- Migration: adiciona suporte a transações "retirada da poupança"

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS from_savings boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS savings_goal_id uuid REFERENCES public.savings_goals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_from_savings
  ON public.transactions (workspace_id, from_savings)
  WHERE from_savings = true;

-- RPC atômica: insere transação + debita meta na mesma chamada
CREATE OR REPLACE FUNCTION public.insert_savings_withdrawal(
  p_workspace_id uuid,
  p_user_id uuid,
  p_description text,
  p_amount numeric,
  p_category text,
  p_transaction_date timestamptz,
  p_savings_goal_id uuid,
  p_project_id uuid DEFAULT NULL
)
RETURNS public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tx public.transactions;
BEGIN
  -- Valida que a meta pertence ao workspace
  IF NOT EXISTS (
    SELECT 1 FROM public.savings_goals
    WHERE id = p_savings_goal_id AND workspace_id = p_workspace_id
  ) THEN
    RAISE EXCEPTION 'Meta não encontrada no workspace';
  END IF;

  -- Insere a transação
  INSERT INTO public.transactions (
    workspace_id, user_id, description, amount, category,
    payment_method, transaction_date, from_savings, savings_goal_id, project_id
  )
  VALUES (
    p_workspace_id, p_user_id, p_description, p_amount, p_category,
    'debit', p_transaction_date, true, p_savings_goal_id, p_project_id
  )
  RETURNING * INTO new_tx;

  -- Debita da meta (piso em 0)
  UPDATE public.savings_goals
  SET current_amount = GREATEST(0, current_amount - p_amount)
  WHERE id = p_savings_goal_id;

  RETURN new_tx;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_savings_withdrawal(uuid, uuid, text, numeric, text, timestamptz, uuid, uuid) TO authenticated;
