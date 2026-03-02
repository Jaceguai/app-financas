-- RPC: Criar workspace + adicionar owner como membro (atômico)
-- Resolve o problema de RLS chicken-and-egg:
-- INSERT na tabela workspaces precisa de SELECT após,
-- mas SELECT exige is_member_of_workspace(), que ainda não existe.

DROP FUNCTION IF EXISTS public.create_workspace(text, text);

CREATE OR REPLACE FUNCTION public.create_workspace(
  ws_name text,
  owner_display_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_ws RECORD;
BEGIN
  IF ws_name IS NULL OR trim(ws_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nome do workspace é obrigatório');
  END IF;

  IF owner_display_name IS NULL OR trim(owner_display_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nome de exibição é obrigatório');
  END IF;

  -- Cria o workspace
  INSERT INTO public.workspaces (name, created_by)
  VALUES (trim(ws_name), auth.uid())
  RETURNING * INTO new_ws;

  -- Adiciona o criador como owner
  INSERT INTO public.workspace_members (workspace_id, user_id, display_name, role)
  VALUES (new_ws.id, auth.uid(), trim(owner_display_name), 'owner');

  RETURN jsonb_build_object(
    'success', true,
    'workspace_id', new_ws.id,
    'workspace_name', new_ws.name,
    'invite_code', new_ws.invite_code,
    'created_at', new_ws.created_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_workspace(text, text) TO authenticated;
