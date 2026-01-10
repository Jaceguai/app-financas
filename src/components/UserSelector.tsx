import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { useFinanceStore } from '../store/useFinanceStore';

export const UserSelector: React.FC = () => {
  const { theme } = useTheme();
  const { currentUser, setCurrentUser } = useFinanceStore();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceSecondary }]}>
      {(['Usuário A', 'Usuário B'] as const).map((user) => (
        <TouchableOpacity
          key={user}
          onPress={() => setCurrentUser(user)}
          style={[
            styles.button, 
            currentUser === user && { backgroundColor: theme.colors.surface }
          ]}
        >
          <Text style={[
            styles.buttonText, 
            { color: theme.colors.textSecondary },
            currentUser === user && { color: theme.colors.primary, fontWeight: '700' }
          ]}>
            {user}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    borderRadius: 8, 
    padding: 4, 
    marginHorizontal: 16, 
    marginTop: 16 
  },
  button: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 6 
  },
  buttonText: { 
    textAlign: 'center', 
    fontWeight: '600' 
  },
});