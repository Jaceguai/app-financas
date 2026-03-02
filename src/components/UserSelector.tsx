import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';

interface Props {
  selectedUserId?: string;
  onSelectUser?: (userId: string) => void;
}

export const UserSelector: React.FC<Props> = ({ selectedUserId, onSelectUser }) => {
  const { user } = useAuth();
  const { members } = useWorkspace();

  const activeUserId = selectedUserId || user?.id;

  if (members.length === 0) return null;

  return (
    <View className="flex-row rounded-lg p-1 mx-4 mt-4 bg-gray-100 dark:bg-slate-700">
      {members.map((member) => (
        <TouchableOpacity
          key={member.id}
          onPress={() => onSelectUser?.(member.user_id)}
          className={`flex-1 py-3 rounded-md ${activeUserId === member.user_id ? 'bg-white dark:bg-slate-800' : ''}`}
        >
          <Text
            className={`text-center font-semibold ${
              activeUserId === member.user_id
                ? 'text-blue-500 dark:text-blue-400 font-bold'
                : 'text-gray-500 dark:text-slate-400'
            }`}
          >
            {member.display_name}
            {member.user_id === user?.id ? ' (eu)' : ''}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
