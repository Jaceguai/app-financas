import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast } from '../../components/Toast';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAddProject, useDeleteProject, useUpdateProject } from '../../hooks/useSupabaseMutations';
import { useProjects } from '../../hooks/useSupabaseQuery';
import { useTheme } from '../../theme';
import { Project } from '../../types';
import { formatCurrency } from '../../utils/formatters';

const PROJECT_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];
const PROJECT_ICONS: Array<{ name: string; label: string }> = [
  { name: 'folder-outline', label: 'Pasta' },
  { name: 'home-outline', label: 'Casa' },
  { name: 'car-outline', label: 'Carro' },
  { name: 'gift-outline', label: 'Presente' },
  { name: 'airplane-outline', label: 'Viagem' },
  { name: 'construct-outline', label: 'Reforma' },
  { name: 'school-outline', label: 'Estudo' },
  { name: 'medkit-outline', label: 'Saúde' },
  { name: 'restaurant-outline', label: 'Festa' },
  { name: 'trophy-outline', label: 'Meta' },
  { name: 'musical-notes-outline', label: 'Evento' },
  { name: 'business-outline', label: 'Negócio' },
];

export const ProjectsScreen: React.FC<{ onGoBack?: () => void }> = ({ onGoBack }) => {
  const { isDark } = useTheme();
  const navigation = useNavigation();
  const { workspace } = useWorkspace();
  const { data: projects = [] } = useProjects(workspace?.id);
  const addProject = useAddProject();
  const deleteProjectMut = useDeleteProject();
  const updateProjectMut = useUpdateProject();

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as const });
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState('folder-outline');
  const [budget, setBudget] = useState('');

  const formatBudgetInput = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    const amount = parseFloat(numbers) / 100;
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleCreate = async () => {
    if (!workspace || !name.trim()) return;
    try {
      const parsedBudget = budget ? parseFloat(budget.replace(/\D/g, '')) / 100 : null;
      await addProject.mutateAsync({
        workspace_id: workspace.id,
        name: name.trim(),
        description: description.trim(),
        color: selectedColor,
        icon: selectedIcon,
        budget: parsedBudget && parsedBudget > 0 ? parsedBudget : null,
      });
      setName('');
      setDescription('');
      setBudget('');
      setSelectedColor(PROJECT_COLORS[0]);
      setSelectedIcon('folder-outline');
      setModalVisible(false);
      setToast({ visible: true, message: 'Projeto criado!', type: 'success' });
    } catch {
      setToast({ visible: true, message: 'Erro ao criar projeto', type: 'success' });
    }
  };

  const handleToggleActive = async (project: Project) => {
    try {
      await updateProjectMut.mutateAsync({ id: project.id, is_active: !project.is_active });
      setToast({ visible: true, message: project.is_active ? 'Projeto finalizado' : 'Projeto reativado', type: 'success' });
    } catch {
      setToast({ visible: true, message: 'Erro ao atualizar', type: 'success' });
    }
  };

  const handleDelete = (project: Project) => {
    Alert.alert('Excluir Projeto', `Deseja excluir "${project.name}"? As transações associadas NÃO serão excluídas.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            await deleteProjectMut.mutateAsync(project.id);
            setToast({ visible: true, message: 'Projeto excluído', type: 'success' });
          } catch {
            setToast({ visible: true, message: 'Erro ao excluir', type: 'success' });
          }
        },
      },
    ]);
  };

  const activeProjects = projects.filter(p => p.is_active);
  const finishedProjects = projects.filter(p => !p.is_active);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={() => setToast({ ...toast, visible: false })} />

      <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
        {onGoBack && (
          <TouchableOpacity onPress={onGoBack}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#111827'} />
          </TouchableOpacity>
        )}
        <Text className="text-lg font-bold text-gray-900 dark:text-slate-100">Projetos</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} className="p-1">
          <Ionicons name="add-circle" size={28} color="#8b5cf6" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="p-4">
          {activeProjects.length === 0 && finishedProjects.length === 0 && (
            <View className="items-center py-12">
              <Ionicons name="folder-open-outline" size={64} color={isDark ? '#64748b' : '#9ca3af'} />
              <Text className="text-base font-semibold mt-4 text-gray-900 dark:text-slate-100">
                Nenhum projeto criado
              </Text>
              <Text className="text-sm mt-2 text-center text-gray-500 dark:text-slate-400">
                Crie projetos para organizar gastos de{'\n'}construções, reformas, festas, viagens...
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="mt-6 flex-row items-center gap-2 px-6 py-3 rounded-xl bg-purple-500"
              >
                <Ionicons name="add" size={20} color="#ffffff" />
                <Text className="text-white font-bold">Criar Projeto</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeProjects.length > 0 && (
            <>
              <Text className="text-xs font-bold uppercase tracking-wider mb-3 text-gray-400 dark:text-slate-500">
                Ativos ({activeProjects.length})
              </Text>
              {activeProjects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  onPress={() => (navigation as any).navigate('ProjectDetail', { projectId: project.id, projectName: project.name })}
                  className="p-4 mb-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 gap-3">
                      <View
                        className="w-11 h-11 rounded-xl items-center justify-center"
                        style={{ backgroundColor: project.color + '20' }}
                      >
                        <Ionicons name={project.icon as any} size={22} color={project.color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-900 dark:text-slate-100">{project.name}</Text>
                        {project.description ? (
                          <Text className="text-xs text-gray-400 dark:text-slate-500 mt-0.5" numberOfLines={1}>{project.description}</Text>
                        ) : null}
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <TouchableOpacity onPress={() => handleToggleActive(project)} className="p-1.5">
                        <Ionicons name="checkmark-circle-outline" size={22} color="#10b981" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(project)} className="p-1.5">
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                      <Ionicons name="chevron-forward" size={20} color={isDark ? '#64748b' : '#9ca3af'} />
                    </View>
                  </View>
                  {project.budget && (
                    <View className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                      <Text className="text-xs text-gray-400 dark:text-slate-500">
                        Orçamento: {formatCurrency(Number(project.budget))}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}

          {finishedProjects.length > 0 && (
            <>
              <Text className="text-xs font-bold uppercase tracking-wider mb-3 mt-4 text-gray-400 dark:text-slate-500">
                Finalizados ({finishedProjects.length})
              </Text>
              {finishedProjects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  onPress={() => (navigation as any).navigate('ProjectDetail', { projectId: project.id, projectName: project.name })}
                  className="p-4 mb-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 opacity-60"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 gap-3">
                      <View
                        className="w-11 h-11 rounded-xl items-center justify-center"
                        style={{ backgroundColor: project.color + '20' }}
                      >
                        <Ionicons name={project.icon as any} size={22} color={project.color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-900 dark:text-slate-100">{project.name}</Text>
                        <Text className="text-xs text-emerald-500 mt-0.5">Finalizado</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <TouchableOpacity onPress={() => handleToggleActive(project)} className="p-1.5">
                        <Ionicons name="refresh-outline" size={20} color="#f59e0b" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(project)} className="p-1.5">
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                      <Ionicons name="chevron-forward" size={20} color={isDark ? '#64748b' : '#9ca3af'} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* Create Project Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <Pressable className="flex-1 bg-black/50" onPress={() => setModalVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 mt-24">
          <Pressable className="flex-1 bg-white dark:bg-slate-900 rounded-t-3xl" onPress={(e) => e.stopPropagation()}>
            <View className="flex-row items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
              <Text className="text-xl font-bold text-gray-900 dark:text-slate-100">Novo Projeto</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="p-2">
                <Ionicons name="close" size={24} color={isDark ? '#ffffff' : '#111827'} />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-5" keyboardShouldPersistTaps="handled">
              <Text className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Nome *</Text>
              <TextInput
                className="border rounded-xl p-3.5 text-base mb-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600"
                placeholder="Ex: Reforma da cozinha"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
              />

              <Text className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Descrição</Text>
              <TextInput
                className="border rounded-xl p-3.5 text-base mb-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600"
                placeholder="Detalhes do projeto (opcional)"
                placeholderTextColor="#9ca3af"
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <Text className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Orçamento previsto</Text>
              <TextInput
                className="border rounded-xl p-3.5 text-base mb-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600"
                placeholder="R$ (opcional)"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={budget}
                onChangeText={(text) => setBudget(formatBudgetInput(text))}
              />

              <Text className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Ícone</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {PROJECT_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon.name}
                    onPress={() => setSelectedIcon(icon.name)}
                    className={`w-12 h-12 rounded-xl items-center justify-center border-2 ${
                      selectedIcon === icon.name
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800'
                    }`}
                  >
                    <Ionicons name={icon.name as any} size={22} color={selectedIcon === icon.name ? '#8b5cf6' : (isDark ? '#94a3b8' : '#6b7280')} />
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Cor</Text>
              <View className="flex-row flex-wrap gap-3 mb-6">
                {PROJECT_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      selectedColor === color ? 'border-2 border-gray-900 dark:border-white' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {selectedColor === color && <Ionicons name="checkmark" size={20} color="#ffffff" />}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Preview */}
              <View className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 mb-4">
                <Text className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500 mb-2">Preview</Text>
                <View className="flex-row items-center gap-3">
                  <View className="w-11 h-11 rounded-xl items-center justify-center" style={{ backgroundColor: selectedColor + '20' }}>
                    <Ionicons name={selectedIcon as any} size={22} color={selectedColor} />
                  </View>
                  <Text className="text-base font-semibold text-gray-900 dark:text-slate-100">
                    {name || 'Nome do projeto'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleCreate}
                disabled={!name.trim() || addProject.isPending}
                className={`rounded-xl py-4 items-center ${
                  !name.trim() || addProject.isPending ? 'bg-gray-300 dark:bg-slate-700' : 'bg-purple-500'
                }`}
              >
                <Text className="text-white text-base font-bold">
                  {addProject.isPending ? 'Criando...' : 'Criar Projeto'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};
