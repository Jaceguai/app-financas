import { useCallback, useEffect, useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { supabase } from '../lib/supabase';

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

      const settingsMap: Record<string, string> = {};
      data?.forEach((setting) => {
        settingsMap[setting.key] = setting.value;
      });

      setSettings(settingsMap);
    } catch {
      setSettings({});
    } finally {
      setLoading(false);
    }
  }, [workspace]);

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

      setSettings((prev) => ({ ...prev, [key]: value }));

      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const getSetting = (key: string, defaultValue: string = ''): string => {
    return settings[key] || defaultValue;
  };

  const getSettingAsNumber = (key: string, defaultValue: number = 0): number => {
    const value = settings[key];
    if (!value) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

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
        () => {
          fetchSettings();
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
