import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSyncDrive } from '../hooks/useSyncDrive';
import { ProgressBar } from '../components/ProgressBar';
import { formatCurrency, formatPercentage } from '../utils/formatters';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
               'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function DashboardScreen() {
  const { theme } = useTheme();
  const { 
    rendasFixas = [], 
    poupancas = [],
    selectedMonth,
    setSelectedMonth,
    getTransactionsByMonth,
    getRendaTotal,
    hideValues,
    setHideValues,
    // Getters
    getGastosFixosDebit,
    getGastosVariaveisDebit,
    getInvoiceTotal,
    getInvoiceFixed,
    getInvoiceVariable
  } = useFinanceStore();

  const [localHideValues, setLocalHideValues] = useState(hideValues);

  const { refetch, isLoading } = useSyncDrive();
  
  // --- Valores ---
  const rendaTotal = getRendaTotal?.() || 0;
  
  // Débito (Saiu da conta agora)
  const gastosFixosDebit = getGastosFixosDebit();
  const gastosMesDebit = getGastosVariaveisDebit();
  
  // Crédito (Vai sair na fatura)
  const invoiceTotal = getInvoiceTotal();
  const invoiceFixed = getInvoiceFixed();
  const invoiceVariable = getInvoiceVariable();

  // --- O CÁLCULO REAL (Sobras) ---
  // O dinheiro que sobra é: O que você ganha MENOS o que saiu no débito MENOS o que já gastou no crédito
  const restante = rendaTotal - gastosFixosDebit - gastosMesDebit - invoiceTotal;

  const patrimonioTotal = (poupancas || []).reduce((sum, p) => sum + (Number(p.atual) || 0), 0);
  
  // Gráficos de Consumo
  const transacoesMes = getTransactionsByMonth();
  const gastosUsuarioA = transacoesMes
    .filter((t) => t.userName === 'Usuário A')
    .reduce((sum, t) => sum + (Number(t.value) || 0), 0);
  const gastosUsuarioB = transacoesMes
    .filter((t) => t.userName === 'Usuário B')
    .reduce((sum, t) => sum + (Number(t.value) || 0), 0);

  // Navegação
  const [mes, ano] = (selectedMonth || '01/2026').split('/');
  const mesIndex = parseInt(mes, 10) - 1;
  const mesNome = MESES[mesIndex] || 'Janeiro';

  const navigateMonth = (direction: number) => {
    let newMes = parseInt(mes, 10) + direction;
    let newAno = parseInt(ano, 10);
    if (newMes < 1) { newMes = 12; newAno--; }
    if (newMes > 12) { newMes = 1; newAno++; }
    setSelectedMonth(`${String(newMes).padStart(2, '0')}/${newAno}`);
  };

  const toggleHideValues = () => {
    setLocalHideValues(!localHideValues);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <View style={[styles.monthSelector, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TouchableOpacity onPress={() => navigateMonth(-1)}>
            <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={[styles.monthText, { color: theme.colors.textPrimary }]}>{mesNome} {ano}</Text>
            <TouchableOpacity onPress={toggleHideValues} style={{ padding: 4 }}>
              <Ionicons 
                name={localHideValues ? 'eye-off' : 'eye'} 
                size={24} 
                color={theme.colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => navigateMonth(1)}>
            <Ionicons name="chevron-forward" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Card 1: Visão Geral do Orçamento */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Balanço Mensal</Text>
        
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Entradas (Renda):</Text>
            <Text style={[styles.value, { color: theme.colors.textPrimary }]}>{formatCurrency(rendaTotal, localHideValues)}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Saídas (Débito):</Text>
            <Text style={styles.valueRed}>- {formatCurrency(gastosFixosDebit + gastosMesDebit, localHideValues)}</Text>
          </View>

          {/* NOVA LINHA: Mostra que a fatura também subtrai do saldo */}
          <View style={styles.row}>
            <Text style={styles.labelOrange}>Comprometido (Fatura):</Text>
            <Text style={styles.valueOrange}>- {formatCurrency(invoiceTotal, localHideValues)}</Text>
          </View>

          <View style={[styles.row, styles.rowTotal, { borderTopColor: theme.colors.border }]}>
            <Text style={[styles.labelBold, { color: theme.colors.textPrimary }]}>Livre para Gastar:</Text>
            <Text style={[styles.valueBold, restante >= 0 ? styles.valueGreen : styles.valueRed]}>
              {formatCurrency(restante, localHideValues)}
            </Text>
          </View>
        </View>

        {/* Card 2: Detalhe da Fatura */}
        <View style={[styles.card, styles.invoiceCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.invoiceHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="card" size={24} color={theme.colors.accent} />
              <Text style={[styles.cardTitleNoMargin, { color: theme.colors.textPrimary }]}>Detalhes da Fatura</Text>
            </View>
            <Text style={[styles.invoiceTotalValue, { color: theme.colors.accent }]}>{formatCurrency(invoiceTotal, localHideValues)}</Text>
          </View>

          <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />

          <View style={styles.rowSmall}>
            <Text style={[styles.labelSmall, { color: theme.colors.textSecondary }]}>Fixos (Assinaturas):</Text>
            <Text style={[styles.valueSmall, { color: theme.colors.textPrimary }]}>{formatCurrency(invoiceFixed, localHideValues)}</Text>
          </View>

          <View style={styles.rowSmall}>
            <Text style={[styles.labelSmall, { color: theme.colors.textSecondary }]}>Variáveis (Compras):</Text>
            <Text style={[styles.valueSmall, { color: theme.colors.textPrimary }]}>{formatCurrency(invoiceVariable, localHideValues)}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Patrimônio Total</Text>
          <Text style={[styles.patrimonio, { color: theme.colors.secondary }]}>{formatCurrency(patrimonioTotal, localHideValues)}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Metas de Poupança</Text>
          {(poupancas || []).length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>Nenhuma meta cadastrada</Text>
          ) : (
            (poupancas || []).map((meta) => (
              <View key={meta.id} style={styles.metaItem}>
                <View style={styles.metaHeader}>
                  <Text style={[styles.metaNome, { color: theme.colors.textPrimary }]}>{meta.nome}</Text>
                  <Text style={[styles.metaValores, { color: theme.colors.textSecondary }]}>
                    {formatCurrency(Number(meta.atual) || 0, localHideValues)} / {formatCurrency(Number(meta.objetivo) || 0, localHideValues)}
                  </Text>
                </View>
                <ProgressBar
                  progress={(Number(meta.objetivo) || 0) > 0 ? (Number(meta.atual) || 0) / (Number(meta.objetivo) || 1) : 0}
                  color={theme.colors.secondary}
                />
              </View>
            ))
          )}
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Consumo Total</Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Usuário A:</Text>
            <Text style={[styles.value, { color: theme.colors.textPrimary }]}>R$ {gastosUsuarioA.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Usuário B:</Text>
            <Text style={[styles.value, { color: theme.colors.textPrimary }]}>R$ {gastosUsuarioB.toFixed(2)}</Text>
          </View>
          <View style={styles.barContainer}>
            <View style={[styles.barSegmentA, { flex: gastosUsuarioA || 1, backgroundColor: theme.colors.primary }]} />
            <View style={[styles.barSegmentB, { flex: gastosUsuarioB || 1, backgroundColor: theme.colors.accent }]} />
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
              <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Usuário A</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.accent }]} />
              <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Usuário B</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 20 },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  monthText: { fontSize: 18, fontWeight: '700' },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invoiceCard: {
    borderLeftWidth: 4,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  invoiceTotalValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    marginVertical: 8,
  },
  rowSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  labelSmall: {
    fontSize: 14,
  },
  valueSmall: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  cardTitleNoMargin: { fontSize: 18, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, alignItems: 'center' },
  rowTotal: { borderTopWidth: 1, marginTop: 8, paddingTop: 12 },
  
  label: { fontSize: 16 },
  labelOrange: { fontSize: 16, color: '#f59e0b' },
  labelBold: { fontSize: 16, fontWeight: '600' },
  
  value: { fontSize: 16 },
  valueBold: { fontSize: 18, fontWeight: '700' },
  valueRed: { fontSize: 16, color: '#ef4444' },
  valueOrange: { fontSize: 16, color: '#f59e0b' },
  valueGreen: { color: '#10b981' },
  
  patrimonio: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  emptyText: { textAlign: 'center', paddingVertical: 16 },
  metaItem: { marginBottom: 16 },
  metaHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metaNome: { fontSize: 14, fontWeight: '600' },
  metaValores: { fontSize: 14 },
  barContainer: { flexDirection: 'row', height: 24, borderRadius: 12, overflow: 'hidden', marginTop: 12 },
  barSegmentA: {},
  barSegmentB: {},
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 12 },
});