import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HappyDog from '../../../assets/animations/Happy Dog.json';
import { Toast } from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { Workspace, useWorkspace } from '../../contexts/WorkspaceContext';
import { supabase } from '../../lib/supabase';
import { JoinWorkspaceFormData, WorkspaceFormData, joinWorkspaceSchema, workspaceSchema } from '../../schemas';
import { useTheme } from '../../theme';
import { iconColors } from '../../utils/iconColors';

export const WorkspaceScreen: React.FC = () => {
  const { isDark } = useTheme();
  const { user, signOut } = useAuth();
  const { createWorkspace, joinWorkspace, setActiveWorkspace } = useWorkspace();
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [loading, setLoading] = useState(false);
  const [userWorkspaces, setUserWorkspaces] = useState<Workspace[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false, message: '', type: 'info',
  });

  const displayName = user?.user_metadata?.display_name || 'Usuário';

  const createForm = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: '' },
  });

  const joinForm = useForm<JoinWorkspaceFormData>({
    resolver: zodResolver(joinWorkspaceSchema),
    defaultValues: { code: '' },
  });

  useEffect(() => {
  if (!user) return;

// Esse código está PERFEITO para a nova política estrita
const fetchWorkspaces = async () => {
  if (!user) return;
  setLoadingWorkspaces(true);
  try {
    // CHAMADA RPC: Substitui todo o RLS e queries manuais.
    // O Supabase chama a função no banco e traz os workspaces prontos.
    const { data, error } = await supabase.rpc('get_my_workspaces');

    if (error) throw error;

    if (data) {
      // O RPC já retorna o array de workspaces correto (Workspace[])
      setUserWorkspaces(data);
    }
  } catch (err: any) {
    // silently fail
  } finally {
    setLoadingWorkspaces(false);
  }
};
  fetchWorkspaces();
}, [user]);

  const refreshWorkspacesList = async () => {
    if (!user) return;
    setLoadingWorkspaces(true);
    try {
      const { data, error } = await supabase.rpc('get_my_workspaces');
      if (error) throw error;
      setUserWorkspaces(data ?? []);
    } catch (err: any) {
      setUserWorkspaces([]);
    } finally {
      setLoadingWorkspaces(false);
    }
  };

  const handleCreate = createForm.handleSubmit(async (data) => {
    setLoading(true);
    const { error } = await createWorkspace(data.name.trim(), displayName);
    setLoading(false);
    if (error) {
      setToast({ visible: true, message: error, type: 'error' });
    } else {
      await refreshWorkspacesList();
      setMode('select');
    }
  });

  const handleJoin = joinForm.handleSubmit(async (data) => {
    setLoading(true);
    const { error } = await joinWorkspace(data.code.toUpperCase().trim(), displayName);
    setLoading(false);
    if (error) {
      setToast({ visible: true, message: error, type: 'error' });
    } else {
      await refreshWorkspacesList();
      setMode('select');
    }
  });

  const selectWorkspace = async (ws: Workspace) => {
    await setActiveWorkspace(ws);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair? Você precisará fazer login novamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  const getInputClass = (hasError: boolean) =>
    `border rounded-xl p-3.5 text-base mb-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
      hasError ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-700'
    }`;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={() => setToast(t => ({ ...t, visible: false }))} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <ScrollView contentContainerClassName="grow p-6 pt-10" keyboardShouldPersistTaps="handled">
        <View className="items-center mb-8">
          <View style={{ width: 380, height: 180 }}>
            <LottieView
              source={HappyDog}
              autoPlay
              loop
              style={{ width: '100%', height: '100%' }}
            />
          </View>
          <Text className="text-3xl font-extrabold mt-2 text-gray-900 dark:text-white">Workspace</Text>
          <Text className="text-base mt-2 text-center text-gray-700 dark:text-gray-300">
            Olá, {displayName}! Selecione ou crie um espaço de trabalho.
          </Text>
        </View>

        {loadingWorkspaces ? (
          <ActivityIndicator size="large" className="my-6 text-primary-500 dark:text-primary-400" />
        ) : userWorkspaces.length > 0 && mode === 'select' ? (
          <View className="rounded-2xl p-5 border mb-4 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <Text className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Seus Workspaces</Text>
            {userWorkspaces.map((ws) => (
              <TouchableOpacity
                key={ws.id}
                className="flex-row items-center py-3.5 border-b border-gray-200 dark:border-slate-700"
                onPress={() => selectWorkspace(ws)}
              >
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 dark:text-white">{ws.name}</Text>
                  <Text className="text-sm mt-0.5 text-gray-500 dark:text-gray-400">
                    Código: {ws.invite_code} · Criado em {new Date(ws.created_at).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {mode === 'select' && (
          <View className="gap-3 mt-2">
            <TouchableOpacity
              className="flex-row items-center justify-center gap-2.5 py-4 rounded-xl bg-blue-500 dark:bg-blue-600"
              onPress={() => setMode('create')}
            >
              <Ionicons name="add-circle" size={24} color={iconColors.white} />
              <Text className="text-white text-lg font-bold">Criar Workspace</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center justify-center gap-2.5 py-4 rounded-xl bg-emerald-500"
              onPress={() => setMode('join')}
            >
              <Ionicons name="enter" size={24} color={iconColors.white} />
              <Text className="text-white text-lg font-bold">Entrar com Código</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'create' && (
          <View className="rounded-2xl p-5 border mb-4 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <Text className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Criar Workspace</Text>
            <Controller
              control={createForm.control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className={getInputClass(!!createForm.formState.errors.name)}
                  placeholder="Nome do workspace"
                  placeholderTextColor="#9ca3af"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {createForm.formState.errors.name && (
              <Text className="text-red-500 text-xs -mt-1 mb-2 ml-1">{createForm.formState.errors.name.message}</Text>
            )}
            <TouchableOpacity
              className={`rounded-xl py-4 items-center mt-1 bg-blue-500 dark:bg-blue-600 ${loading ? 'opacity-60' : ''}`}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-bold">Criar</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode('select')} className="items-center mt-3">
              <Text className="text-base font-semibold text-gray-700 dark:text-gray-300">Voltar</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'join' && (
          <View className="rounded-2xl p-5 border mb-4 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <Text className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Entrar com Código</Text>
            <Controller
              control={joinForm.control}
              name="code"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className={`border rounded-xl p-3.5 text-2xl font-bold mb-3 text-center tracking-widest bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                    joinForm.formState.errors.code ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-700'
                  }`}
                  placeholder="EX: A1B2C3"
                  placeholderTextColor="#9ca3af"
                  value={value}
                  onChangeText={(text) => onChange(text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  autoCapitalize="characters"
                  maxLength={6}
                />
              )}
            />
            {joinForm.formState.errors.code && (
              <Text className="text-red-500 text-xs -mt-1 mb-2 ml-1">{joinForm.formState.errors.code.message}</Text>
            )}
            <TouchableOpacity
              className={`rounded-xl py-4 items-center mt-1 bg-emerald-500 ${loading ? 'opacity-60' : ''}`}
              onPress={handleJoin}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-bold">Entrar</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode('select')} className="items-center mt-3">
              <Text className="text-base font-semibold text-gray-700 dark:text-gray-300">Voltar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
