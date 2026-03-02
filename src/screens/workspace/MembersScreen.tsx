import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Alert, FlatList, Share, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useTheme } from '../../theme';
import { getIconColor, iconColors } from '../../utils/iconColors';

export const MembersScreen: React.FC<{ onGoBack?: () => void }> = ({ onGoBack }) => {
  const { isDark } = useTheme();
  const { workspace, members, currentMember } = useWorkspace();

  const isOwner = currentMember?.role === 'owner';

  const handleShare = async () => {
    if (!workspace) return;
    const message = `Entre no nosso workspace de finanças!\nCódigo: ${workspace.invite_code}`;
    try {
      await Share.share({ message });
    } catch {}
  };

  const handleCopyCode = async () => {
    if (!workspace) return;
    await Clipboard.setStringAsync(workspace.invite_code);
    Alert.alert('Sucesso', 'Código copiado!');
  };

  const handleRemove = (member: any) => {
    if (member.user_id === currentMember?.user_id) return;
    Alert.alert(
      'Remover membro',
      `Remover "${member.display_name}" do workspace?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover', style: 'destructive',
          onPress: () => {
            Alert.alert('Info', 'Funcionalidade em desenvolvimento');
          },
        },
      ]
    );
  };

  const renderMember = ({ item }: { item: any }) => (
    <View className="flex-row items-center py-3 border-b border-gray-200 dark:border-slate-700 gap-3">
      <View className="w-10 h-10 rounded-full items-center justify-center bg-blue-500 dark:bg-blue-400">
        <Text className="text-white text-lg font-bold">{item.display_name.charAt(0).toUpperCase()}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900 dark:text-slate-100">
          {item.display_name}
          {item.user_id === currentMember?.user_id ? ' (você)' : ''}
        </Text>
        <Text className="text-sm mt-0.5 text-gray-400 dark:text-slate-500">
          {item.role === 'owner' ? 'Dono' : 'Membro'} · desde {new Date(item.joined_at).toLocaleDateString('pt-BR')}
        </Text>
      </View>
      {isOwner && item.user_id !== currentMember?.user_id && (
        <TouchableOpacity onPress={() => handleRemove(item)}>
          <Ionicons name="close-circle" size={24} color={getIconColor('error', isDark)} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
        <TouchableOpacity onPress={onGoBack}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#111827'} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 dark:text-slate-100">Membros</Text>
        <View className="w-6" />
      </View>

      {workspace && (
        <View className="mx-4 mt-4 rounded-xl p-4 border items-center bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <Text className="text-base font-bold text-gray-900 dark:text-slate-100">{workspace.name}</Text>
          <Text className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            Criado em {new Date(workspace.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Text>
          <View className="w-full h-px my-3 bg-gray-200 dark:bg-slate-700" />
          <Text className="text-sm text-gray-500 dark:text-slate-400">Código de Convite</Text>
          <Text className="text-3xl font-extrabold tracking-widest my-2 text-blue-500 dark:text-blue-400">{workspace.invite_code}</Text>
          <View className="flex-row gap-3 mt-2">
            <TouchableOpacity className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-500 dark:bg-blue-600" onPress={handleCopyCode}>
              <Ionicons name="copy" size={18} color={iconColors.white} />
              <Text className="text-white font-semibold text-sm">Copiar</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-500" onPress={handleShare}>
              <Ionicons name="share-social" size={18} color={iconColors.white} />
              <Text className="text-white font-semibold text-sm">Compartilhar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Text className="text-sm px-4 mb-2 mt-4 text-gray-500 dark:text-slate-400">
        {members.length} {members.length === 1 ? 'membro' : 'membros'}
      </Text>

      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-5"
      />
    </SafeAreaView>
  );
};
