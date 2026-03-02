-- Migration: tabela de histórico de depósitos em metas de poupança

CREATE TABLE IF NOT EXISTS public.savings_deposits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  savings_goal_id uuid NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_savings_deposits_goal_id
  ON public.savings_deposits (savings_goal_id, created_at DESC);

ALTER TABLE public.savings_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view savings deposits"
  ON public.savings_deposits FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- RPC atômica: atualiza saldo da meta + registra depósito
CREATE OR REPLACE FUNCTION public.deposit_to_goal(
  p_goal_id uuid,
  p_amount numeric
)
RETURNS public.savings_goals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  goal_row public.savings_goals;
BEGIN
  -- Atualiza saldo da meta e retorna a linha atualizada
  UPDATE public.savings_goals
  SET current_amount = current_amount + p_amount
  WHERE id = p_goal_id
  RETURNING * INTO goal_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Meta não encontrada';
  END IF;

  -- Registra o depósito no histórico
  INSERT INTO public.savings_deposits (savings_goal_id, workspace_id, amount)
  VALUES (p_goal_id, goal_row.workspace_id, p_amount);

  RETURN goal_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.deposit_to_goal(uuid, numeric) TO authenticated;
