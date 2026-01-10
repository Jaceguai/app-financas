import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { fetchDriveData } from '../services/api';
import { useFinanceStore } from '../store/useFinanceStore';
import { Transaction } from '../types';

export const HistoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const { recentTransactions, syncFromDrive } = useFinanceStore();
  const [refreshing, setRefreshing] = useState(false);

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

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const date = new Date(item.date);
    const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const isCredit = item.paymentMethod === 'credit';
    const paymentLabel = isCredit ? 'Crédito' : 'Débito/Pix';
    const paymentColor = isCredit ? theme.colors.accent : theme.colors.primary;
    const paymentIcon = isCredit ? 'card' : 'wallet';
    const paymentBgColor = isCredit ? (theme.isDark ? '#422006' : '#fff7ed') : (theme.isDark ? '#1e3a8a' : '#eff6ff');

    return (
      <View style={[styles.transactionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={styles.transactionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.description, { color: theme.colors.textPrimary }]}>{item.description}</Text>
            <Text style={[styles.category, { color: theme.colors.textTertiary }]}>{item.category}</Text>
          </View>
          <Text style={[styles.value, { color: theme.colors.error }]}>-R$ {item.value.toFixed(2)}</Text>
        </View>

        <View style={[styles.transactionFooter, { borderTopColor: theme.colors.borderLight }]}>
          <View style={styles.footerLeft}>
            <Text style={[styles.dateText, { color: theme.colors.textTertiary }]}>{formattedDate} às {formattedTime}</Text>
            
            <View style={[styles.paymentBadge, { backgroundColor: paymentBgColor }]}>
              <Ionicons name={paymentIcon} size={12} color={paymentColor} style={{ marginRight: 4 }} />
              <Text style={[styles.paymentText, { color: paymentColor }]}>{paymentLabel}</Text>
            </View>
          </View>

          <View style={[styles.userBadge, { backgroundColor: theme.isDark ? '#1e3a8a' : '#e3f2fd' }]}>
            <Text style={[styles.userBadgeText, { color: theme.colors.primary }]}>{item.userName}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Histórico</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{recentTransactions.length} transações registradas</Text>
      </View>
      {recentTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>Nenhuma transação registrada ainda.</Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textTertiary }]}>Suas transações aparecerão aqui.</Text>
        </View>
      ) : (
        <FlatList
          data={recentTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  transactionCard: { 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 2, 
    elevation: 2 
  },
  transactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  description: { fontSize: 16, fontWeight: '600' },
  category: { fontSize: 14, marginTop: 4 },
  value: { fontSize: 18, fontWeight: 'bold' },
  
  transactionFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end',
    marginTop: 8, 
    paddingTop: 8, 
    borderTopWidth: 1,
  },
  footerLeft: {
    gap: 6
  },
  dateText: { fontSize: 12 },
  
  paymentBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 4,
  },
  paymentText: { fontSize: 12, fontWeight: '600' },

  userBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  userBadgeText: { fontSize: 12, fontWeight: '500' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { textAlign: 'center', fontSize: 16 },
  emptySubtext: { textAlign: 'center', fontSize: 14, marginTop: 8 },
});