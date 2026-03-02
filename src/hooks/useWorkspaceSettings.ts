import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useWorkspace } from '../contexts/WorkspaceContext';

export interface WorkspaceSetting {
  id: string;
  workspace_id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export const useWorkspaceSettings = () => {
  const { workspace } = useWorkspace();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Busca todas as configurações do workspace
  const fetchSettings = useCallback(async () => {
    if (!workspace) {
      setSettings({});
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workspace_settings')
        .select('*')
        .eq('workspace_id', workspace.id);

      if (error) throw error;

      // Converte array para objeto { key: value }
      const settingsMap: Record<string, string> = {};
      data?.forEach((setting) => {
        settingsMap[setting.key] = setting.value;
      });

      setSettings(settingsMap);
    } catch (err) {
      console.error('Erro ao buscar settings:', err);
      setSettings({});
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  // Atualiza ou cria uma configuração
  const updateSetting = async (key: string, value: string) => {
    if (!workspace) return { error: 'Workspace não selecionado' };

    try {
      const { error } = await supabase
        .from('workspace_settings')
        .upsert({
          workspace_id: workspace.id,
          key,
          value,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'workspace_id,key',
        });

      if (error) throw error;

      // Atualiza localmente
      setSettings((prev) => ({ ...prev, [key]: value }));

      return { error: null };
    } catch (err: any) {
      console.error('Erro ao atualizar setting:', err);
      return { error: err.message };
    }
  };

  // Busca uma configuração específica
  const getSetting = (key: string, defaultValue: string = ''): string => {
    return settings[key] || defaultValue;
  };

  // Busca configuração como número
  const getSettingAsNumber = (key: string, defaultValue: number = 0): number => {
    const value = settings[key];
    if (!value) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  // Carrega settings quando workspace muda
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Realtime: Escuta mudanças nas configurações
  useEffect(() => {
    if (!workspace) return;

    const channel = supabase
      .channel(`workspace_settings:${workspace.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_settings',
          filter: `workspace_id=eq.${workspace.id}`,
        },
        (payload) => {
          console.log('Setting atualizado em tempo real:', payload);
          fetchSettings(); // Recarrega quando houver mudança
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspace, fetchSettings]);

  return {
    settings,
    loading,
    updateSetting,
    getSetting,
    getSettingAsNumber,
    refreshSettings: fetchSettings,
  };
};
