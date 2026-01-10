import React, { useState } from 'react';
import { ScrollView, StyleSheet, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { UserSelector } from '../components/UserSelector';
import { SummaryCard } from '../components/SummaryCard';
import { TransactionForm } from '../components/TransactionForm';
import { fetchDriveData } from '../services/api';
import { useFinanceStore } from '../store/useFinanceStore';

export const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const { syncFromDrive } = useFinanceStore();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await fetchDriveData();
      syncFromDrive(data);
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >
          <UserSelector />
          <SummaryCard />
          <TransactionForm />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});