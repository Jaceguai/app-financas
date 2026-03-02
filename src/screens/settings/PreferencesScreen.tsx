import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast } from '../../components/Toast';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useWorkspaceSettings } from '../../hooks/useWorkspaceSettings';
import { useTheme } from '../../theme';
import { formatCurrencyInput, parseCurrency } from '../../utils/formatters';

export const PreferencesScreen: React.FC<{ onGoBack?: () => void }> = ({ onGoBack }) => {
  const { isDark } = useTheme();
  const { workspace, members } = useWorkspace();
  const { settings, loading: isLoading, updateSetting } = useWorkspaceSettings();

  const [tetoLazer, setTetoLazer] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    const valor = settings['extraGastosVariaveis'] || '0';
    const valorNum = Number(valor) || 0;
    setTetoLazer(valorNum > 0 ? (valorNum / 100).toFixed(2).replace('.', ',') : '');
  }, [settings]);

  const handleSave = async () => {
    if (!workspace) return;

    const valor = parseCurrency(tetoLazer);
    setSaving(true);

    const { error } = await updateSetting('extraGastosVariaveis', String(valor));
    setSaving(false);

    if (error) {
      setToast({ visible: true, message: 'Erro ao salvar preferências', type: 'error' });
    } else {
      setToast({ visible: true, message: 'Preferências salvas com sucesso!', type: 'success' });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={() => setToast({ ...toast, visible: false })} />

      <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
        {onGoBack && (
          <TouchableOpacity onPress={onGoBack}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#111827'} />
          </TouchableOpacity>
        )}
        <Text className="text-lg font-bold text-gray-900 dark:text-slate-100">Preferências</Text>
        <View className="w-6" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="p-4">
          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" className="text-primary-500 dark:text-primary-400" />
            </View>
          ) : (
            <>
              {/* Info sobre configurações compartilhadas */}
              <View className="rounded-xl p-4 mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="people" size={20} color={isDark ? '#60a5fa' : '#3b82f6'} />
                  <Text className="ml-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Configurações Compartilhadas
                  </Text>
                </View>
                <Text className="text-sm text-blue-800 dark:text-blue-200">
                  Estas preferências são compartilhadas entre todos os {members.length} membros do workspace "{workspace?.name}". Qualquer alteração será visível para todos.
                </Text>
              </View>

              <View className="rounded-xl p-4 mb-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-full items-center justify-center bg-amber-100 dark:bg-amber-900/30">
                    <Ionicons name="wallet" size={22} color="#f59e0b" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-base font-bold text-gray-900 dark:text-slate-100">
                      Teto de Gastos de Lazer
                    </Text>
                    <Text className="text-sm mt-0.5 text-gray-500 dark:text-slate-400">
                      Defina o limite mensal para gastos com lazer
                    </Text>
                  </View>
                </View>

                <Text className="text-sm font-semibold mb-2 text-gray-700 dark:text-slate-300">
                  Valor Máximo (R$)
                </Text>
                <TextInput
                  className="border rounded-xl p-3.5 text-base mb-3 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600"
                  placeholder="Ex: 1000,00"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={tetoLazer}
                  onChangeText={(text) => setTetoLazer(formatCurrencyInput(text))}
                />

                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  className={`rounded-xl py-4 items-center ${saving ? 'opacity-60' : ''} bg-blue-500 dark:bg-blue-600`}
                >
                  {saving ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-white text-base font-bold">Salvar Preferências</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View className="rounded-xl p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <View className="flex-row items-start">
                  <Ionicons name="information-circle" size={20} color={isDark ? '#fbbf24' : '#f59e0b'} />
                  <Text className="flex-1 ml-2 text-sm text-amber-900 dark:text-amber-100">
                    O teto de gastos de lazer é compartilhado entre todos os membros. Cada pessoa contribui com seus lançamentos para o total do workspace.
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
