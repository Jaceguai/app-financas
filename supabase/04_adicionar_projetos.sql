-- ============================================================
-- PROJETOS: Tabela para organizar gastos em projetos/eventos
-- Ex: Construção, Aniversário, Reforma, Viagem, etc.
-- Rode no SQL Editor do Supabase
-- ============================================================

-- 1. Criar tabela de projetos
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT 'folder-outline',
  color text DEFAULT '#8b5cf6',
  budget numeric DEFAULT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. Adicionar coluna project_id na tabela transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS project_id uuid DEFAULT NULL REFERENCES public.projects(id) ON DELETE SET NULL;

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON public.transactions(project_id) WHERE project_id IS NOT NULL;

-- 4. Habilitar RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 5. Função auxiliar para verificar membro do workspace (reutilizando a existente se possível)
CREATE OR REPLACE FUNCTION public.is_workspace_member_check(ws_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid()
  );
$$;

-- 6. Policies para projects
DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (public.is_workspace_member_check(workspace_id));

DROP POLICY IF EXISTS "projects_insert" ON public.projects;
CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT WITH CHECK (public.is_workspace_member_check(workspace_id));

DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (public.is_workspace_member_check(workspace_id));

DROP POLICY IF EXISTS "projects_delete" ON public.projects;
CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE USING (public.is_workspace_member_check(workspace_id));

-- 7. RPC para buscar projetos do workspace (bypass RLS)
DROP FUNCTION IF EXISTS public.get_workspace_projects(uuid);
CREATE FUNCTION public.get_workspace_projects(ws_id uuid)
RETURNS SETOF public.projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = ws_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;
  RETURN QUERY SELECT * FROM projects WHERE workspace_id = ws_id ORDER BY is_active DESC, created_at DESC;
END;
$$;

-- 8. Comentários
COMMENT ON TABLE public.projects IS 'Projetos/eventos para agrupar gastos (ex: Construção, Reforma, Aniversário)';
COMMENT ON COLUMN public.projects.budget IS 'Orçamento previsto para o projeto (opcional)';
COMMENT ON COLUMN public.projects.is_active IS 'Se o projeto ainda está em andamento';
COMMENT ON COLUMN public.transactions.project_id IS 'Projeto associado a esta transação (opcional)';
