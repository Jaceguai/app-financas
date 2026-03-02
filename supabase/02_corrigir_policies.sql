-- ============================================================
-- CORREÇÃO COMPLETA DE POLICIES RLS
--
-- Rode este script no SQL Editor do Supabase.
-- Ele vai:
--   1. Criar uma função auxiliar SECURITY DEFINER (bypassa RLS)
--   2. Remover TODAS as policies existentes
--   3. Criar policies corretas sem recursão
--   4. Criar/atualizar as RPCs necessárias
--
-- ⚠️  RODE PRIMEIRO o script 01_diagnostico_policies.sql
--     para ter um backup visual das policies atuais.
-- ============================================================

-- ============================================================
-- PARTE 1: FUNÇÃO AUXILIAR (resolve a recursão infinita)
-- ============================================================

-- Esta função verifica se o usuário autenticado é membro de um workspace
-- SEM disparar policies de RLS (porque é SECURITY DEFINER).
-- É a peça-chave para evitar recursão infinita.
CREATE OR REPLACE FUNCTION public.is_member_of_workspace(ws_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
  );
$$;

-- Verifica se o usuário é OWNER de um workspace
CREATE OR REPLACE FUNCTION public.is_owner_of_workspace(ws_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
      AND role = 'owner'
  );
$$;


-- ============================================================
-- PARTE 2: REMOVER TODAS AS POLICIES EXISTENTES
-- ============================================================

-- workspace_members (TABELA PROBLEMÁTICA)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'workspace_members'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.workspace_members', pol.policyname);
  END LOOP;
END $$;

-- workspaces
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'workspaces'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.workspaces', pol.policyname);
  END LOOP;
END $$;

-- transactions
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'transactions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.transactions', pol.policyname);
  END LOOP;
END $$;

-- fixed_expenses
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'fixed_expenses'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.fixed_expenses', pol.policyname);
  END LOOP;
END $$;

-- incomes
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'incomes'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.incomes', pol.policyname);
  END LOOP;
END $$;

-- savings_goals
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'savings_goals'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.savings_goals', pol.policyname);
  END LOOP;
END $$;

-- workspace_config
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'workspace_config'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.workspace_config', pol.policyname);
  END LOOP;
END $$;

-- workspace_settings
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'workspace_settings'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.workspace_settings', pol.policyname);
  END LOOP;
END $$;


-- ============================================================
-- PARTE 3: HABILITAR RLS EM TODAS AS TABELAS
-- ============================================================

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PARTE 4: POLICIES PARA workspace_members
-- ============================================================
-- REGRA PRINCIPAL: Usa auth.uid() = user_id diretamente para
-- a verificação base, NUNCA faz subquery em si mesma.
-- Para ver OUTROS membros do workspace, usa a função
-- is_member_of_workspace() que é SECURITY DEFINER.

-- SELECT: Pode ver todos os membros dos workspaces que você participa
CREATE POLICY "wm_select"
  ON public.workspace_members
  FOR SELECT
  TO authenticated
  USING (
    public.is_member_of_workspace(workspace_id)
  );

-- INSERT: Apenas você mesmo pode se inserir (criação de workspace / join via RPC)
CREATE POLICY "wm_insert"
  ON public.workspace_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

-- UPDATE: Pode atualizar apenas seu próprio registro
CREATE POLICY "wm_update"
  ON public.workspace_members
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id
  );

-- DELETE: Pode remover a si mesmo OU o owner pode remover membros
CREATE POLICY "wm_delete"
  ON public.workspace_members
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_owner_of_workspace(workspace_id)
  );


-- ============================================================
-- PARTE 5: POLICIES PARA workspaces
-- ============================================================

-- SELECT: Pode ver workspaces que você é membro
CREATE POLICY "ws_select"
  ON public.workspaces
  FOR SELECT
  TO authenticated
  USING (
    public.is_member_of_workspace(id)
  );

-- INSERT: Qualquer autenticado pode criar workspace
CREATE POLICY "ws_insert"
  ON public.workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
  );

-- UPDATE: Apenas o owner pode atualizar
CREATE POLICY "ws_update"
  ON public.workspaces
  FOR UPDATE
  TO authenticated
  USING (
    public.is_owner_of_workspace(id)
  );

-- DELETE: Apenas o owner pode deletar (mas prefira usar RPC)
CREATE POLICY "ws_delete"
  ON public.workspaces
  FOR DELETE
  TO authenticated
  USING (
    public.is_owner_of_workspace(id)
  );


-- ============================================================
-- PARTE 6: POLICIES PARA transactions
-- ============================================================

-- SELECT: Membros do workspace podem ver todas as transações
CREATE POLICY "tx_select"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (
    public.is_member_of_workspace(workspace_id)
  );

-- INSERT: Membros do workspace podem inserir transações
CREATE POLICY "tx_insert"
  ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_member_of_workspace(workspace_id)
    AND auth.uid() = user_id
  );

-- UPDATE: Apenas quem criou a transação pode editar
CREATE POLICY "tx_update"
  ON public.transactions
  FOR UPDATE
  TO authenticated
  USING (
    public.is_member_of_workspace(workspace_id)
    AND auth.uid() = user_id
  );

-- DELETE: Membros podem deletar transações do workspace
-- (se quiser restringir só ao criador, adicione AND auth.uid() = user_id)
CREATE POLICY "tx_delete"
  ON public.transactions
  FOR DELETE
  TO authenticated
  USING (
    public.is_member_of_workspace(workspace_id)
  );


-- ============================================================
-- PARTE 7: POLICIES PARA fixed_expenses
-- ============================================================

CREATE POLICY "fe_select"
  ON public.fixed_expenses
  FOR SELECT
  TO authenticated
  USING (
    public.is_member_of_workspace(workspace_id)
  );

CREATE POLICY "fe_insert"
  ON public.fixed_expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_member_of_workspace(workspace_id)
  );

CREATE POLICY "fe_update"
  ON public.fixed_expenses
  FOR UPDATE
  TO authenticated
  USING (
    public.is_member_of_workspace(workspace_id)
  );

CREATE POLICY "fe_delete"
  ON public.fixed_expenses
  FOR DELETE
  TO authenticated
  USING (
    public.is_member_of_workspace(workspace_id)
  );


-- ============================================================
-- PARTE 8: POLICIES PARA incomes
-- ============================================================

CREATE POLICY "inc_select"
  ON public.incomes
  FOR SELECT
  TO authenticated
  USING (
    public.is_member_of_workspace(workspace_id)
  );

CREATE POLICY "inc_insert"
  ON public.incomes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_member_of_workspace(workspace_id)
  );

CREATE POLICY "inc_update"
  ON public.incomes
  FOR UPDATE
  TO authenticated
  USING (
    public.is_member_of_workspace(workspace_id)
  );

CREATE POLICY "inc_delete"
  ON public.incomes
  FOR DELETE
  TO authenticated
  USING (
    public.is_member_of_workspace(workspace_id)
  );


-- ============================================================
-- PARTE 9: POLICIES PARA savings_goals
-- ============================================================

CREATE POLICY "sg_select"
  ON public.savings_goals
  FOR SELECT
  TO authenticated
  USING (
    public.is_member_of_workspace(workspace_id)
  );

CREATE POLICY "sg_insert"
  ON public.savings_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_member_of_workspace(workspace_id)
  );

CREATE POLICY "sg_update"
  ON public.savings_goals
  FOR UPDATE
  TO authenticated
  USING (
    public.is_member_of_workspace(workspace_id)
  );

CREATE POLICY "sg_delete"
  ON public.savings_goals
  FOR DELETE
  TO authenticated
  USING (
    public.is_member_of_workspace(workspace_id)
  );


-- ============================================================
-- PARTE 10: POLICIES PARA workspace_config
-- ============================================================

CREATE POLICY "wc_select"
  ON public.workspace_config
  FOR SELECT
  TO authenticated
  USING (
    public.is_member_of_workspace(workspace_id)
  );

CREATE POLICY "wc_insert"
  ON public.workspace_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_member_of_workspace(workspace_id)
  );

CREATE POLICY "wc_update"
  ON public.workspace_config
  FOR UPDATE
  TO authenticated
  USING (
    public.is_member_of_workspace(workspace_id)
  );

CREATE POLICY "wc_delete"
  ON public.workspace_config
  FOR DELETE
  TO authenticated
  USING (
    public.is_member_of_workspace(workspace_id)
  );


-- ============================================================
-- PARTE 11: POLICIES PARA workspace_settings
-- ============================================================

CREATE POLICY "wset_select"
  ON public.workspace_settings
  FOR SELECT
  TO authenticated
  USING (
    public.is_member_of_workspace(workspace_id)
  );

CREATE POLICY "wset_insert"
  ON public.workspace_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_member_of_workspace(workspace_id)
  );

CREATE POLICY "wset_update"
  ON public.workspace_settings
  FOR UPDATE
  TO authenticated
  USING (
    public.is_member_of_workspace(workspace_id)
  );

CREATE POLICY "wset_delete"
  ON public.workspace_settings
  FOR DELETE
  TO authenticated
  USING (
    public.is_member_of_workspace(workspace_id)
  );


-- ============================================================
-- PARTE 12: RPCs (SECURITY DEFINER) para operações complexas
-- ============================================================

-- Dropar funções existentes que podem ter tipo de retorno diferente
DROP FUNCTION IF EXISTS public.get_workspace_members(uuid);
DROP FUNCTION IF EXISTS public.get_workspace_transactions(uuid, text);
DROP FUNCTION IF EXISTS public.get_workspace_fixed_expenses(uuid);
DROP FUNCTION IF EXISTS public.get_workspace_incomes(uuid);
DROP FUNCTION IF EXISTS public.get_workspace_savings_goals(uuid);
DROP FUNCTION IF EXISTS public.get_workspace_settings(uuid);
DROP FUNCTION IF EXISTS public.join_workspace_by_code(text, text);
DROP FUNCTION IF EXISTS public.leave_workspace(uuid);
DROP FUNCTION IF EXISTS public.delete_workspace(uuid);
DROP FUNCTION IF EXISTS public.debug_workspace_access(uuid);
DROP FUNCTION IF EXISTS public.my_workspace_ids();
DROP FUNCTION IF EXISTS public.get_user_workspace_ids(uuid);

-- RPC: Buscar membros de um workspace (sem recursão)
CREATE OR REPLACE FUNCTION public.get_workspace_members(ws_id uuid)
RETURNS SETOF public.workspace_members
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.workspace_members
  WHERE workspace_id = ws_id
    AND EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = ws_id
        AND user_id = auth.uid()
    );
$$;

-- RPC: Buscar transações de um workspace
CREATE OR REPLACE FUNCTION public.get_workspace_transactions(ws_id uuid, month_filter text DEFAULT NULL)
RETURNS SETOF public.transactions
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT t.* FROM public.transactions t
  WHERE t.workspace_id = ws_id
    AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = ws_id
        AND wm.user_id = auth.uid()
    )
  ORDER BY t.transaction_date DESC;
$$;

-- RPC: Buscar despesas fixas
CREATE OR REPLACE FUNCTION public.get_workspace_fixed_expenses(ws_id uuid)
RETURNS SETOF public.fixed_expenses
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.fixed_expenses
  WHERE workspace_id = ws_id
    AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = ws_id
        AND wm.user_id = auth.uid()
    )
  ORDER BY created_at DESC;
$$;

-- RPC: Buscar receitas
CREATE OR REPLACE FUNCTION public.get_workspace_incomes(ws_id uuid)
RETURNS SETOF public.incomes
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.incomes
  WHERE workspace_id = ws_id
    AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = ws_id
        AND wm.user_id = auth.uid()
    )
  ORDER BY created_at DESC;
$$;

-- RPC: Buscar metas de economia
CREATE OR REPLACE FUNCTION public.get_workspace_savings_goals(ws_id uuid)
RETURNS SETOF public.savings_goals
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.savings_goals
  WHERE workspace_id = ws_id
    AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = ws_id
        AND wm.user_id = auth.uid()
    )
  ORDER BY created_at DESC;
$$;

-- RPC: Buscar configurações do workspace
CREATE OR REPLACE FUNCTION public.get_workspace_settings(ws_id uuid)
RETURNS SETOF public.workspace_settings
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.workspace_settings
  WHERE workspace_id = ws_id
    AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = ws_id
        AND wm.user_id = auth.uid()
    );
$$;

-- RPC: Entrar no workspace por código de convite
CREATE OR REPLACE FUNCTION public.join_workspace_by_code(code_input text, display_name_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ws_record RECORD;
  existing_member RECORD;
BEGIN
  -- Busca o workspace pelo código
  SELECT * INTO ws_record
  FROM public.workspaces
  WHERE invite_code = code_input;

  IF ws_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código inválido');
  END IF;

  -- Verifica se já é membro
  SELECT * INTO existing_member
  FROM public.workspace_members
  WHERE workspace_id = ws_record.id
    AND user_id = auth.uid();

  IF existing_member IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você já é membro deste workspace');
  END IF;

  -- Insere como membro
  INSERT INTO public.workspace_members (workspace_id, user_id, display_name, role)
  VALUES (ws_record.id, auth.uid(), display_name_input, 'member');

  RETURN jsonb_build_object('success', true, 'workspace_id', ws_record.id);
END;
$$;

-- RPC: Sair do workspace
CREATE OR REPLACE FUNCTION public.leave_workspace(ws_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_record RECORD;
BEGIN
  SELECT * INTO member_record
  FROM public.workspace_members
  WHERE workspace_id = ws_id
    AND user_id = auth.uid();

  IF member_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você não é membro deste workspace');
  END IF;

  IF member_record.role = 'owner' THEN
    RETURN jsonb_build_object('success', false, 'error', 'O dono não pode sair. Transfira a propriedade ou exclua o workspace.');
  END IF;

  DELETE FROM public.workspace_members
  WHERE id = member_record.id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC: Excluir workspace (apenas owner)
CREATE OR REPLACE FUNCTION public.delete_workspace(ws_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_record RECORD;
BEGIN
  -- Verifica se é owner
  SELECT * INTO member_record
  FROM public.workspace_members
  WHERE workspace_id = ws_id
    AND user_id = auth.uid()
    AND role = 'owner';

  IF member_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas o dono pode excluir o workspace');
  END IF;

  -- Deleta tudo relacionado ao workspace (ordem importa por FK)
  DELETE FROM public.workspace_settings WHERE workspace_id = ws_id;
  DELETE FROM public.workspace_config WHERE workspace_id = ws_id;
  DELETE FROM public.savings_goals WHERE workspace_id = ws_id;
  DELETE FROM public.incomes WHERE workspace_id = ws_id;
  DELETE FROM public.fixed_expenses WHERE workspace_id = ws_id;
  DELETE FROM public.transactions WHERE workspace_id = ws_id;
  DELETE FROM public.workspace_members WHERE workspace_id = ws_id;
  DELETE FROM public.workspaces WHERE id = ws_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC: Debug acesso ao workspace (útil para desenvolvimento)
CREATE OR REPLACE FUNCTION public.debug_workspace_access(ws_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_uid uuid;
  is_member boolean;
  member_role text;
  member_count int;
BEGIN
  current_uid := auth.uid();

  SELECT COUNT(*) INTO member_count
  FROM public.workspace_members
  WHERE workspace_id = ws_id;

  SELECT role INTO member_role
  FROM public.workspace_members
  WHERE workspace_id = ws_id AND user_id = current_uid;

  is_member := member_role IS NOT NULL;

  RETURN jsonb_build_object(
    'user_id', current_uid,
    'workspace_id', ws_id,
    'is_member', is_member,
    'role', COALESCE(member_role, 'none'),
    'total_members', member_count
  );
END;
$$;


-- ============================================================
-- PARTE 13: GRANT permissões para as funções
-- ============================================================

GRANT EXECUTE ON FUNCTION public.is_member_of_workspace(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner_of_workspace(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_workspace_members(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_workspace_transactions(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_workspace_fixed_expenses(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_workspace_incomes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_workspace_savings_goals(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_workspace_settings(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_workspace_by_code(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_workspace(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_workspace(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_workspace_access(uuid) TO authenticated;
