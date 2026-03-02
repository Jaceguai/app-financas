import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useTheme } from '../../theme';
import { getIconColor } from '../../utils/iconColors';

interface HamburgerMenuProps {
  visible: boolean;
  onClose: () => void;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ visible, onClose }) => {
  const { isDark } = useTheme();
  const { workspace, currentMember } = useWorkspace();
  const { signOut } = useAuth();
  const navigation = useNavigation();

  const handleNavigate = (screen: string) => {
    onClose();
    setTimeout(() => {
      (navigation as any).navigate(screen);
    }, 100);
  };

  const handleLogout = async () => {
    onClose();
    await signOut();
  };

  const menuItems = [
    {
      section: 'Configurações',
      items: [
        { icon: 'cash-outline', label: 'Rendas', screen: 'Incomes', color: '#10b981' },
        { icon: 'card-outline', label: 'Gastos Fixos', screen: 'FixedExpenses', color: '#ef4444' },
        { icon: 'trending-up-outline', label: 'Metas de Poupança', screen: 'SavingsGoals', color: '#3b82f6' },
        { icon: 'folder-outline', label: 'Projetos', screen: 'Projects', color: '#8b5cf6' },
        { icon: 'document-text-outline', label: 'Relatórios', screen: 'Reports', color: '#0ea5e9' },
        { icon: 'bulb-outline', label: 'Insights', screen: 'Insights', color: '#f59e0b' },
      ],
    },
    {
      section: 'Workspace',
      items: [
        { icon: 'people-outline', label: 'Membros', screen: 'Members', color: '#8b5cf6' },
        { icon: 'settings-outline', label: 'Preferências', screen: 'Preferences', color: '#6b7280' },
      ],
    },
    {
      section: 'Aparência',
      items: [
        { icon: 'color-palette-outline', label: 'Tema', screen: 'Appearance', color: '#f59e0b' },
      ],
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50"
        onPress={onClose}
      >
        <Pressable
          className="flex-1 bg-white dark:bg-slate-900 mt-20 rounded-t-3xl"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900 dark:text-slate-100">Menu</Text>
              {workspace && (
                <Text className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  {workspace.name}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={28} color={isDark ? '#ffffff' : '#111827'} />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="p-5">
              {currentMember && (
                <View className="flex-row items-center mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <View className="w-12 h-12 rounded-full items-center justify-center bg-blue-500 dark:bg-blue-400">
                    <Text className="text-white text-xl font-bold">
                      {currentMember.display_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-base font-semibold text-gray-900 dark:text-slate-100">
                      {currentMember.display_name}
                    </Text>
                    <Text className="text-sm text-gray-500 dark:text-slate-400">
                      {currentMember.role === 'owner' ? 'Dono' : 'Membro'}
                    </Text>
                  </View>
                </View>
              )}

              {menuItems.map((section, sectionIndex) => (
                <View key={sectionIndex} className="mb-6">
                  <Text className="text-xs font-bold uppercase tracking-wider mb-3 text-gray-400 dark:text-slate-500">
                    {section.section}
                  </Text>
                  {section.items.map((item, itemIndex) => (
                    <TouchableOpacity
                      key={itemIndex}
                      onPress={() => handleNavigate(item.screen)}
                      className="flex-row items-center p-4 mb-2 rounded-xl bg-gray-50 dark:bg-slate-800 active:bg-gray-100 dark:active:bg-slate-700"
                    >
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: item.color + '20' }}
                      >
                        <Ionicons name={item.icon as any} size={22} color={item.color} />
                      </View>
                      <Text className="flex-1 ml-3 text-base font-semibold text-gray-900 dark:text-slate-100">
                        {item.label}
                      </Text>
                      <Ionicons name="chevron-forward" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                    </TouchableOpacity>
                  ))}
                </View>
              ))}

              <TouchableOpacity
                onPress={handleLogout}
                className="flex-row items-center justify-center p-4 mt-4 rounded-xl border-2 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20"
              >
                <Ionicons name="log-out-outline" size={22} color={getIconColor('error', isDark)} />
                <Text className="ml-2 text-base font-bold text-red-500">Sair</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
