import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MonthSelector, getCurrentMonth } from '../components/MonthSelector';
import { SummaryCard } from '../components/SummaryCard';
import { TransactionForm } from '../components/TransactionForm';
import { useWorkspace } from '../contexts/WorkspaceContext';

export const HomeScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentMember } = useWorkspace();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['transactions'] });
    await queryClient.invalidateQueries({ queryKey: ['workspace_settings'] });
    await queryClient.refetchQueries({ queryKey: ['projects'] });
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900" edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-10"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2196f3"
              colors={['#2196f3']}
            />
          }
        >
          {currentMember && (
            <View className="flex-row items-center mx-4 mt-4 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-blue-500 dark:bg-blue-600">
                <Ionicons name="person" size={20} color="#ffffff" />
              </View>
              <View className="ml-3">
                <Text className="text-base font-bold text-gray-900 dark:text-white">
                  Olá, {currentMember.display_name}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  Registre seus gastos abaixo
                </Text>
              </View>
            </View>
          )}
          <MonthSelector selectedMonth={selectedMonth} onChangeMonth={setSelectedMonth} />
          <SummaryCard month={selectedMonth} />
          <TransactionForm />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
