import * as SecureStore from 'expo-secure-store';
import React, { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// Tipagens
export interface Workspace {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  display_name: string;
  role: 'owner' | 'member';
  joined_at: string;
}

interface WorkspaceContextValue {
  workspace: Workspace | null;
  members: WorkspaceMember[];
  loading: boolean;
  setActiveWorkspace: (workspace: Workspace) => Promise<void>;
  createWorkspace: (name: string, displayName: string) => Promise<{ error: string | null }>;
  joinWorkspace: (code: string, displayName: string) => Promise<{ error: string | null }>;
  leaveWorkspace: () => Promise<void>;
  leaveCurrentWorkspace: () => Promise<{ error: string | null }>;
  deleteWorkspace: () => Promise<{ error: string | null }>;
  refreshMembers: () => Promise<void>;
  removeMember: (memberId: string) => Promise<{ error: string | null }>;
  currentMember: WorkspaceMember | null;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

const WORKSPACE_KEY = 'active_workspace_id';

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMember = members.find(m => m.user_id === user?.id) ?? null;

  // Busca membros do workspace atual usando RPC
  const fetchMembers = useCallback(async (workspaceId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_workspace_members', {
        ws_id: workspaceId,
      });

      if (!error && data) {
        setMembers(data);
      } else {
        setMembers([]);
      }
    } catch (err) {
      setMembers([]);
    }
  }, []);

  const refreshMembers = useCallback(async () => {
    if (workspace) {
      await fetchMembers(workspace.id);
    }
  }, [workspace, fetchMembers]);

  // Ref to track if we're already handling a workspace removal
  const handlingRemoval = useRef(false);

  const handleWorkspaceGone = useCallback(async (reason: 'deleted' | 'removed') => {
    if (handlingRemoval.current) return;
    handlingRemoval.current = true;

    setWorkspace(null);
    setMembers([]);
    await SecureStore.deleteItemAsync(WORKSPACE_KEY);

    const msg = reason === 'deleted'
      ? 'O workspace foi excluído pelo dono. Você foi redirecionado para a seleção de workspaces.'
      : 'Você foi removido deste workspace pelo administrador.';

    Alert.alert('Workspace indisponível', msg);
    handlingRemoval.current = false;
  }, []);

  // Realtime: Escuta exclusão do workspace
  useEffect(() => {
    if (!workspace) return;

    const wsChannel = supabase
      .channel(`workspace:${workspace.id}`)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'workspaces',
          filter: `id=eq.${workspace.id}`,
        },
        () => {
          handleWorkspaceGone('deleted');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(wsChannel);
    };
  }, [workspace, handleWorkspaceGone]);

  // Realtime: Escuta mudanças nos membros (inclusão, remoção, atualização)
  useEffect(() => {
    if (!workspace || !user) return;

    const channel = supabase
      .channel(`workspace_members:${workspace.id}`)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'workspace_members',
          filter: `workspace_id=eq.${workspace.id}`,
        },
        (payload) => {
          // Se o membro removido é o usuário atual, redirecionar
          const old = payload.old as any;
          if (old?.user_id === user.id) {
            handleWorkspaceGone('removed');
          } else {
            fetchMembers(workspace.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workspace_members',
          filter: `workspace_id=eq.${workspace.id}`,
        },
        () => {
          fetchMembers(workspace.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workspace_members',
          filter: `workspace_id=eq.${workspace.id}`,
        },
        () => {
          fetchMembers(workspace.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspace, user, fetchMembers, handleWorkspaceGone]);

  // Carrega o workspace salvo ao iniciar
  useEffect(() => {
    if (!user) {
      setWorkspace(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    const loadWorkspace = async () => {
      setLoading(true);
      try {
        const savedId = await SecureStore.getItemAsync(WORKSPACE_KEY);

        // Se tivermos um ID salvo, tentamos buscar os dados
        if (savedId) {
            // Nota: Usamos rpc ou select direto dependendo da sua política.
            // Select direto deve funcionar se a política 'ver_meus_workspaces' estiver ativa.
            const { data, error } = await supabase
              .from('workspaces')
              .select('*')
              .eq('id', savedId)
              .single();

            if (data && !error) {
              setWorkspace(data);
              await fetchMembers(data.id);
            } else {
              // Se der erro (ex: foi removido do workspace), limpa o storage
              await SecureStore.deleteItemAsync(WORKSPACE_KEY);
            }
        }
      } catch (e) {
        // Failed to load workspace
      } finally {
        setLoading(false);
      }
    };

    loadWorkspace();
  }, [user, fetchMembers]);

  // Define qual workspace está em uso no app
  const setActiveWorkspace = async (ws: Workspace) => {
    setWorkspace(ws);
    await SecureStore.setItemAsync(WORKSPACE_KEY, ws.id);
    await fetchMembers(ws.id);
  };

  // Cria um novo workspace
  const createWorkspace = async (name: string, displayName: string) => {
    if (!user) return { error: 'Não autenticado' };

    try {
      // 1. Cria o workspace na tabela workspaces
      const { data: wsData, error: wsError } = await supabase
        .from('workspaces')
        .insert({ name, created_by: user.id })
        .select()
        .single();

      if (wsError) throw wsError;

      // 2. Adiciona o criador como membro (Owner)
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: wsData.id,
          user_id: user.id,
          display_name: displayName,
          role: 'owner',
        });

      if (memberError) throw memberError;

      // 3. Define como ativo automaticamente
      await setActiveWorkspace(wsData);

      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  // Entra em um workspace existente via código
  const joinWorkspace = async (code: string, displayName: string) => { // displayName já vem aqui
    if (!code.trim()) return { error: "Código inválido" };
    // Adicione uma validação simples se quiser
    if (!displayName.trim()) return { error: "Nome de exibição obrigatório" };

    try {
      // CORREÇÃO AQUI: Passamos o display_name_input para o SQL
      const { data, error } = await supabase.rpc('join_workspace_by_code', {
        code_input: code.trim(),
        display_name_input: displayName.trim() // <--- O SQL agora espera e usa isso
      });

      if (error) throw error;

      if (!data.success) {
        return { error: data.error };
      }

      // Resto do código continua igual (buscar workspace, ativar, etc...)
      const { data: wsData, error: wsError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', data.workspace_id)
        .single();

      if (wsError) throw wsError;

      await setActiveWorkspace(wsData);

      return { error: null };

    } catch (err: any) {
      return { error: err.message || "Erro desconhecido" };
    }
  };

  const leaveWorkspace = async () => {
    setWorkspace(null);
    setMembers([]);
    await SecureStore.deleteItemAsync(WORKSPACE_KEY);
  };

  // Sair do workspace atual (para membros)
  const leaveCurrentWorkspace = async () => {
    if (!workspace) return { error: 'Nenhum workspace selecionado' };

    try {
      const { data, error } = await supabase.rpc('leave_workspace', {
        ws_id: workspace.id,
      });

      if (error) throw error;

      if (!data.success) {
        return { error: data.error };
      }

      // Limpa o estado local
      await leaveWorkspace();
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Erro ao sair do workspace' };
    }
  };

  // Excluir workspace (apenas dono)
  const deleteWorkspace = async () => {
    if (!workspace) return { error: 'Nenhum workspace selecionado' };

    try {
      const { data, error } = await supabase.rpc('delete_workspace', {
        ws_id: workspace.id,
      });

      if (error) throw error;

      if (!data.success) {
        return { error: data.error };
      }

      // Limpa o estado local
      await leaveWorkspace();
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Erro ao excluir workspace' };
    }
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId);

    if (error) return { error: error.message };

    await refreshMembers();
    return { error: null };
  };

  return (
    <WorkspaceContext.Provider value={{
      workspace, members, loading, setActiveWorkspace,
      createWorkspace, joinWorkspace, leaveWorkspace,
      leaveCurrentWorkspace, deleteWorkspace,
      refreshMembers, removeMember, currentMember,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextValue => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
