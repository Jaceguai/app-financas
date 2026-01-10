import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { useFinanceStore } from '../store/useFinanceStore';

export const SummaryCard: React.FC = () => {
  const { theme } = useTheme();
  const { 
    extraGastosVariaveis = 0, 
    getTransactionsByMonth 
  } = useFinanceStore();

  const transacoesMes = getTransactionsByMonth?.() || [];
  
  const transacoesLazer = transacoesMes.filter(t => 
    t.category && t.category.trim().toLowerCase() === 'lazer'
  );

  const totalSpent = transacoesLazer.reduce((sum, t) => sum + (Number(t.value) || 0), 0);
  
  const limite = Number(extraGastosVariaveis) || 0;
  
  const percentage = limite > 0 ? Math.min((totalSpent / limite) * 100, 100) : 0;
  const isOverBudget = totalSpent > limite;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={[styles.title, { color: theme.colors.textSecondary }]}>Orçamento de Lazer</Text>
      
      <View style={styles.row}>
        <View>
          <Text style={[styles.label, { color: theme.colors.textTertiary }]}>Gasto em Lazer</Text>
          <Text style={[
            styles.value, 
            { color: isOverBudget ? theme.colors.error : theme.colors.primary }
          ]}>
            R$ {totalSpent.toFixed(2)}
          </Text>
          <Text style={[styles.subLabel, { color: theme.colors.textTertiary }]}>
             (Débito + Crédito)
          </Text>
        </View>
        
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.label, { color: theme.colors.textTertiary }]}>Teto Definido</Text>
          <Text style={[styles.value, { color: theme.colors.textPrimary }]}>R$ {limite.toFixed(2)}</Text>
        </View>
      </View>

      <View style={[styles.progressBar, { backgroundColor: theme.colors.borderLight }]}>
        <View 
          style={[
            styles.progressFill, 
            { 
              flex: percentage / 100,
              backgroundColor: isOverBudget ? theme.colors.error : theme.colors.primary
            }
          ]} 
        />
      </View>
      
      <Text style={[styles.percentageText, { color: theme.colors.textTertiary }]}>
        {percentage.toFixed(1)}% do teto utilizado
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    borderRadius: 12, 
    padding: 16, 
    marginHorizontal: 16, 
    marginTop: 16,
    borderWidth: 1,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3 
  },
  title: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 8 
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 12 
  },
  label: { 
    fontSize: 14 
  },
  subLabel: {
    fontSize: 12,
    marginTop: 2
  },
  value: { 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
  progressBar: { 
    height: 12, 
    borderRadius: 999, 
    overflow: 'hidden', 
    flexDirection: 'row' 
  },
  progressFill: { 
    height: 12, 
    borderRadius: 999 
  },
  percentageText: { 
    fontSize: 12, 
    marginTop: 8, 
    textAlign: 'center' 
  },
});