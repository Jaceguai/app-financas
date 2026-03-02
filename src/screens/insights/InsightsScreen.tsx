import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORY_ICONS, Category } from '../../constants';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useFixedExpenses, useIncomes, useProjects } from '../../hooks/useSupabaseQuery';
import { fetchTransactions } from '../../services/api';
import { useTheme } from '../../theme';
import { Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';

function getMonthKey(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface Insight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  icon: string;
  title: string;
  description: string;
  value?: string;
  detail?: string;
}

interface MonthData {
  key: string;
  month: number;
  year: number;
  transactions: Transaction[];
  total: number;
  credit: number;
  debit: number;
  byCategory: Record<string, number>;
}

export const InsightsScreen: React.FC<{ onGoBack?: () => void }> = ({ onGoBack }) => {
  const { isDark } = useTheme();
  const { workspace, members } = useWorkspace();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [allTx, setAllTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: fixedExpenses = [] } = useFixedExpenses(workspace?.id);
  const { data: incomes = [] } = useIncomes(workspace?.id);
  const { data: projects = [] } = useProjects(workspace?.id);

  const now = new Date();
  const currentMonthKey = getMonthKey(now);

  // Fetch all transactions once
  useEffect(() => {
    if (!workspace?.id) return;
    setLoading(true);
    fetchTransactions(workspace.id).then(data => {
      setAllTx(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [workspace?.id]);

  const onRefresh = async () => {
    if (!workspace?.id) return;
    setRefreshing(true);
    const data = await fetchTransactions(workspace.id);
    setAllTx(data);
    await queryClient.invalidateQueries({ queryKey: ['transactions'] });
    setRefreshing(false);
  };

  // Split transactions into months
  const monthsData = useMemo(() => {
    const map: Record<string, MonthData> = {};
    allTx.forEach(t => {
      const d = new Date(t.transaction_date);
      const key = getMonthKey(d);
      if (!map[key]) {
        map[key] = { key, month: d.getMonth() + 1, year: d.getFullYear(), transactions: [], total: 0, credit: 0, debit: 0, byCategory: {} };
      }
      const amt = Number(t.amount) || 0;
      map[key].transactions.push(t);
      map[key].total += amt;
      if (t.payment_method === 'credit') map[key].credit += amt;
      else map[key].debit += amt;
      map[key].byCategory[t.category] = (map[key].byCategory[t.category] || 0) + amt;
    });
    // Sort by date descending
    return Object.values(map).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [allTx]);

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const current = monthsData.find(m => m.key === currentMonthKey);
  // Only past months (exclude current AND future months)
  const pastMonths = monthsData.filter(m => {
    if (m.year < currentYear) return true;
    if (m.year === currentYear && m.month < currentMonth) return true;
    return false;
  });
  const prev = pastMonths[0]; // most recent past month
  const last6 = pastMonths.slice(0, 6);
  const historyMonths = pastMonths;

  const insights = useMemo(() => {
    const result: Insight[] = [];
    if (!workspace) return result;

    const depth = historyMonths.length; // months of history (excluding current and future)
    const totalMonths = (current ? 1 : 0) + depth;
    const totalCurrent = current?.total || 0;
    const totalPrev = prev?.total || 0;
    const totalIncome = incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const totalFixed = fixedExpenses.reduce((s, f) => s + (Number(f.amount) || 0), 0);
    const currentCredit = current?.credit || 0;
    const currentDebit = current?.debit || 0;
    const prevCredit = prev?.credit || 0;

    // ========== DATA DEPTH - ALWAYS FIRST ==========
    const nextMilestone = depth < 2 ? 2 : depth < 4 ? 4 : depth < 6 ? 6 : 12;
    const unlocks: Record<number, string> = {
      2: 'comparações mensais e primeiras tendências',
      4: 'tendências de longo prazo e médias históricas',
      6: 'recordes, alertas inteligentes por categoria e análise completa',
      12: 'comparações ano a ano',
    };

    // Calculate workspace age from created_at
    let usageLine = '';
    if (workspace.created_at) {
      const createdAt = new Date(workspace.created_at);
      const diffMs = now.getTime() - createdAt.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const createdStr = createdAt.toLocaleDateString('pt-BR');
      if (diffDays < 30) {
        usageLine = `Workspace criado há ${diffDays} dia${diffDays !== 1 ? 's' : ''} · desde ${createdStr}`;
      } else {
        const diffMonthsApprox = Math.floor(diffDays / 30);
        usageLine = diffMonthsApprox >= 12
          ? `Workspace criado há ${Math.floor(diffMonthsApprox / 12)} ano${Math.floor(diffMonthsApprox / 12) > 1 ? 's' : ''} e ${diffMonthsApprox % 12} ${diffMonthsApprox % 12 === 1 ? 'mês' : 'meses'} · desde ${createdStr}`
          : `Workspace criado há ${diffMonthsApprox} ${diffMonthsApprox === 1 ? 'mês' : 'meses'} · desde ${createdStr}`;
      }
    }

    if (depth === 0) {
      // Brand new user
      result.push({
        id: 'welcome',
        type: 'positive',
        icon: 'sparkles',
        title: 'Bem-vindo aos Insights!',
        description: 'Este é seu primeiro mês! Continue registrando suas transações normalmente. A cada mês os insights ficam mais inteligentes e personalizados.',
        detail: usageLine || `Próximo nível: com ${nextMilestone} meses você desbloqueia ${unlocks[nextMilestone]}`,
      });
    } else if (depth < 6) {
      result.push({
        id: 'data-depth',
        type: 'neutral',
        icon: 'analytics',
        title: `${totalMonths} ${totalMonths === 1 ? 'mês' : 'meses'} de dados`,
        description: depth < 2
          ? 'Bom começo! No próximo mês já vamos comparar sua evolução.'
          : `Os insights estão ficando mais precisos. Com ${nextMilestone} meses você desbloqueia ${unlocks[nextMilestone]}.`,
        detail: `${usageLine ? usageLine + ' · ' : ''}Nível ${depth < 2 ? '1/4' : depth < 4 ? '2/4' : '3/4'} · Faltam ${nextMilestone - depth} ${nextMilestone - depth === 1 ? 'mês' : 'meses'}`,
      });
    } else {
      result.push({
        id: 'data-depth',
        type: 'positive',
        icon: 'analytics',
        title: `${totalMonths} meses de histórico`,
        description: 'Base sólida! Os insights estão operando com máxima precisão baseada no seu perfil real de gastos.',
        detail: usageLine,
      });
    }

    if (!current) return result;

    // ========== PHASE 1: BASIC (always available) ==========

    // Summary of current month (always show, gentle tone)
    if (totalCurrent > 0) {
      const topCategory = Object.entries(current.byCategory).sort((a, b) => b[1] - a[1])[0];
      if (topCategory) {
        const [catName, catTotal] = topCategory;
        const pctOfTotal = (catTotal / totalCurrent) * 100;
        result.push({
          id: 'top-category',
          type: 'neutral',
          icon: CATEGORY_ICONS[catName as Category] || 'pricetag',
          title: `Maior gasto: ${catName}`,
          description: `${catName} representa ${pctOfTotal.toFixed(0)}% dos seus gastos este mês.`,
          value: formatCurrency(catTotal),
        });
      }
    }

    // Savings rate (always, but tone adapts)
    if (totalIncome > 0 && totalCurrent > 0) {
      const totalOutMonth = totalCurrent + totalFixed;
      const savingsRate = ((totalIncome - totalOutMonth) / totalIncome) * 100;

      if (savingsRate > 20) {
        result.push({
          id: 'savings-rate',
          type: 'positive',
          icon: 'wallet',
          title: 'Boa taxa de poupança!',
          description: `Você está guardando ${savingsRate.toFixed(0)}% da sua renda. A recomendação é pelo menos 20%.`,
          value: `${savingsRate.toFixed(0)}%`,
          detail: `Renda: ${formatCurrency(totalIncome)} · Gastos: ${formatCurrency(totalOutMonth)}`,
        });
      } else if (savingsRate > 0) {
        result.push({
          id: 'savings-rate',
          type: depth >= 2 ? 'warning' : 'neutral',
          icon: 'wallet',
          title: depth >= 2 ? 'Taxa de poupança baixa' : 'Sua taxa de poupança',
          description: depth >= 2
            ? `Você está guardando apenas ${savingsRate.toFixed(0)}% da renda. Tente chegar a 20%.`
            : `Neste mês você está guardando ${savingsRate.toFixed(0)}% da renda. A meta recomendada é 20%.`,
          value: `${savingsRate.toFixed(0)}%`,
          detail: `Renda: ${formatCurrency(totalIncome)} · Gastos: ${formatCurrency(totalOutMonth)}`,
        });
      } else {
        result.push({
          id: 'savings-rate',
          type: depth >= 2 ? 'negative' : 'warning',
          icon: 'warning',
          title: depth >= 2 ? 'Gastos acima da renda' : 'Atenção com os gastos',
          description: depth >= 2
            ? 'Seus gastos estão acima da sua renda este mês. Cuidado para não se endividar.'
            : 'Neste mês seus gastos estão acima da renda. Fique de olho nos próximos meses para ver se é pontual.',
          value: `${savingsRate.toFixed(0)}%`,
          detail: `Renda: ${formatCurrency(totalIncome)} · Gastos: ${formatCurrency(totalOutMonth)}`,
        });
      }
    }

    // Credit ratio (always, but softer tone for new users)
    if (totalCurrent > 0) {
      const creditRatio = (currentCredit / totalCurrent) * 100;
      if (creditRatio > 60) {
        result.push({
          id: 'credit-ratio',
          type: depth >= 2 ? 'warning' : 'neutral',
          icon: 'card',
          title: depth >= 2 ? 'Alto uso de crédito' : 'Perfil de pagamento',
          description: depth >= 2
            ? `${creditRatio.toFixed(0)}% dos seus gastos são no crédito. Fique atento aos juros.`
            : `${creditRatio.toFixed(0)}% dos seus gastos este mês são no crédito. Vamos acompanhar a evolução.`,
          value: `${creditRatio.toFixed(0)}%`,
          detail: `Crédito: ${formatCurrency(currentCredit)} · Débito/Pix: ${formatCurrency(currentDebit)}`,
        });
      }
    }

    // Installments (always - detailed)
    const installmentTx = current.transactions.filter(t => t.installment_total && t.installment_total > 1);
    if (installmentTx.length > 0) {
      const installmentTotal = installmentTx.reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const pctInstallment = totalCurrent > 0 ? (installmentTotal / totalCurrent) * 100 : 0;
      const newPurchases = totalCurrent - installmentTotal;

      // Group by installment_id to get unique installment chains
      const installmentGroups: Record<string, { description: string; amount: number; current: number; total: number }> = {};
      installmentTx.forEach(t => {
        const key = t.installment_id || t.id;
        if (!installmentGroups[key] || (t.installment_current || 0) > (installmentGroups[key].current || 0)) {
          installmentGroups[key] = {
            description: t.description,
            amount: Number(t.amount) || 0,
            current: t.installment_current || 1,
            total: t.installment_total || 1,
          };
        }
      });
      const groups = Object.values(installmentGroups);
      const endingSoon = groups.filter(g => g.total - g.current <= 1);
      const justStarted = groups.filter(g => g.current <= 2);
      const remainingMonths = groups.map(g => g.total - g.current);
      const maxRemaining = Math.max(...remainingMonths, 0);

      // Main installment card
      result.push({
        id: 'installment-impact',
        type: pctInstallment > 50 && depth >= 2 ? 'warning' : 'neutral',
        icon: 'layers',
        title: `${groups.length} parcelamento${groups.length > 1 ? 's' : ''} ativo${groups.length > 1 ? 's' : ''}`,
        description: pctInstallment > 50
          ? `${pctInstallment.toFixed(0)}% do mês são parcelas. ${depth >= 2 ? 'Mais da metade dos gastos já são comprometidos.' : 'Isso é normal no início.'}`
          : `${pctInstallment.toFixed(0)}% dos gastos são parcelas (${formatCurrency(installmentTotal)}), o restante são compras do mês.`,
        value: formatCurrency(installmentTotal),
        detail: `${groups.length} parcelamento${groups.length > 1 ? 's' : ''} · Compromisso por mais ${maxRemaining} ${maxRemaining === 1 ? 'mês' : 'meses'}`,
      });

      // Parcels ending soon
      if (endingSoon.length > 0) {
        const freedUp = endingSoon.reduce((s, g) => s + g.amount, 0);
        result.push({
          id: 'installment-ending',
          type: 'positive',
          icon: 'checkmark-done-circle',
          title: `${endingSoon.length} parcela${endingSoon.length > 1 ? 's' : ''} acabando!`,
          description: `${endingSoon.map(g => `"${g.description}" (${g.current}/${g.total})`).join(', ')} ${endingSoon.length === 1 ? 'termina' : 'terminam'} em breve.`,
          value: `+${formatCurrency(freedUp)}/mês`,
          detail: `Você vai liberar ${formatCurrency(freedUp)} por mês quando ${endingSoon.length === 1 ? 'acabar' : 'acabarem'}`,
        });
      }

      // New installments (just started)
      if (justStarted.length > 0 && depth >= 1) {
        const newCommitment = justStarted.reduce((s, g) => s + g.amount, 0);
        const longestNew = Math.max(...justStarted.map(g => g.total));
        result.push({
          id: 'installment-new',
          type: justStarted.length > 2 ? 'warning' : 'neutral',
          icon: 'add-circle',
          title: `${justStarted.length} parcelamento${justStarted.length > 1 ? 's' : ''} novo${justStarted.length > 1 ? 's' : ''}`,
          description: `${justStarted.map(g => `"${g.description}" (${g.total}x de ${formatCurrency(g.amount)})`).slice(0, 3).join(', ')}${justStarted.length > 3 ? ` e mais ${justStarted.length - 3}` : ''}.`,
          value: formatCurrency(newCommitment),
          detail: `Compromisso de ${formatCurrency(newCommitment)}/mês por até ${longestNew} meses`,
        });
      }

      // Future commitment projection
      if (groups.length > 0) {
        const monthlyCommitments: number[] = [];
        for (let m = 1; m <= 6; m++) {
          const stillActive = groups.filter(g => g.total - g.current >= m);
          monthlyCommitments.push(stillActive.reduce((s, g) => s + g.amount, 0));
        }
        const commitment3m = monthlyCommitments[2] || 0;
        if (commitment3m > 0 && installmentTotal > 0) {
          const reduction = ((installmentTotal - commitment3m) / installmentTotal) * 100;
          if (reduction > 10) {
            result.push({
              id: 'installment-future',
              type: 'neutral',
              icon: 'calendar-clear',
              title: 'Projeção de parcelas',
              description: `Em 3 meses suas parcelas caem de ${formatCurrency(installmentTotal)} para ${formatCurrency(commitment3m)} (${reduction.toFixed(0)}% menos).`,
              detail: `Próximos meses: ${monthlyCommitments.slice(0, 3).map(v => formatCurrency(v)).join(' → ')}`,
            });
          }
        } else if (commitment3m === 0 && installmentTotal > 0) {
          result.push({
            id: 'installment-future',
            type: 'positive',
            icon: 'calendar-clear',
            title: 'Livre de parcelas em breve!',
            description: `Em até 3 meses todas as suas parcelas terão acabado. Isso libera ${formatCurrency(installmentTotal)} por mês.`,
          });
        }
      }
    }

    // Biggest transaction (always, informative)
    if (current.transactions.length > 0) {
      const biggestTx = [...current.transactions].sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))[0];
      const bigPct = totalCurrent > 0 ? ((Number(biggestTx.amount) || 0) / totalCurrent) * 100 : 0;
      if (bigPct > 15) {
        result.push({
          id: 'biggest-tx',
          type: 'neutral',
          icon: 'flame',
          title: 'Maior gasto do mês',
          description: `"${biggestTx.description}" representou ${bigPct.toFixed(0)}% dos seus gastos.`,
          value: formatCurrency(Number(biggestTx.amount)),
          detail: `${biggestTx.category} · ${new Date(biggestTx.transaction_date).toLocaleDateString('pt-BR')}`,
        });
      }
    }

    // ========== PHASE 2: COMPARISONS (2+ months) ==========
    if (depth >= 1 && totalPrev > 0) {
      const changePercent = ((totalCurrent - totalPrev) / totalPrev) * 100;
      const isUp = changePercent > 0;
      const abs = Math.abs(changePercent);

      if (abs > 2) {
        result.push({
          id: 'mom-comparison',
          type: depth >= 3 ? (isUp ? 'negative' : 'positive') : 'neutral',
          icon: isUp ? 'trending-up' : 'trending-down',
          title: isUp ? 'Gastos aumentaram' : 'Gastos diminuíram!',
          description: depth >= 3
            ? (isUp
              ? `Você está gastando ${abs.toFixed(0)}% a mais que no mês passado.`
              : `Você reduziu seus gastos em ${abs.toFixed(0)}% comparado ao mês anterior.`)
            : `${isUp ? 'Aumento' : 'Redução'} de ${abs.toFixed(0)}% comparado ao mês anterior. ${depth < 3 ? 'Ainda cedo para tirar conclusões.' : ''}`,
          value: `${isUp ? '+' : '-'}${abs.toFixed(0)}%`,
          detail: `Atual: ${formatCurrency(totalCurrent)} · Anterior: ${formatCurrency(totalPrev)}`,
        });
      } else {
        result.push({
          id: 'mom-comparison',
          type: 'neutral',
          icon: 'swap-horizontal',
          title: 'Gastos estáveis',
          description: 'Seus gastos estão similares ao mês passado.',
          value: `≈ ${abs.toFixed(0)}%`,
          detail: `Atual: ${formatCurrency(totalCurrent)} · Anterior: ${formatCurrency(totalPrev)}`,
        });
      }

      // Credit trend (only with comparison)
      if (totalCurrent > 0) {
        const creditRatio = (currentCredit / totalCurrent) * 100;
        const prevCreditRatio = (prevCredit / totalPrev) * 100;
        const creditChange = creditRatio - prevCreditRatio;
        if (creditChange > 10 && depth >= 2) {
          result.push({
            id: 'credit-trend',
            type: depth >= 4 ? 'negative' : 'neutral',
            icon: 'arrow-up-circle',
            title: 'Crédito subindo',
            description: `O uso do crédito subiu ${creditChange.toFixed(0)} pontos percentuais em relação ao mês passado.`,
            value: `+${creditChange.toFixed(0)}pp`,
            detail: `Mês atual: ${creditRatio.toFixed(0)}% · Anterior: ${prevCreditRatio.toFixed(0)}%`,
          });
        }
      }

      // Category changes (2+ months)
      if (depth >= 1) {
        const byCategoryCurrent = current.byCategory;
        const byCategoryPrev = prev?.byCategory || {};

        let maxIncrease = { cat: '', increase: 0, prev: 0, curr: 0 };
        Object.entries(byCategoryCurrent).forEach(([cat, curr]) => {
          const p = byCategoryPrev[cat] || 0;
          if (p > 0) {
            const increase = ((curr - p) / p) * 100;
            if (increase > maxIncrease.increase && increase > 30) {
              maxIncrease = { cat, increase, prev: p, curr };
            }
          }
        });
        if (maxIncrease.cat) {
          result.push({
            id: 'cat-increase',
            type: depth >= 3 ? 'negative' : 'neutral',
            icon: 'trending-up',
            title: depth >= 3 ? `${maxIncrease.cat} disparou!` : `${maxIncrease.cat} subiu`,
            description: depth >= 3
              ? `Subiu ${maxIncrease.increase.toFixed(0)}% comparado ao mês anterior. Revise esses gastos.`
              : `Subiu ${maxIncrease.increase.toFixed(0)}% comparado ao mês anterior. Vamos acompanhar.`,
            value: `+${maxIncrease.increase.toFixed(0)}%`,
            detail: `Atual: ${formatCurrency(maxIncrease.curr)} · Anterior: ${formatCurrency(maxIncrease.prev)}`,
          });
        }

        let maxDecrease = { cat: '', decrease: 0, prev: 0, curr: 0 };
        Object.entries(byCategoryPrev).forEach(([cat, p]) => {
          const curr = byCategoryCurrent[cat] || 0;
          if (p > 0) {
            const decrease = ((p - curr) / p) * 100;
            if (decrease > maxDecrease.decrease && decrease > 20) {
              maxDecrease = { cat, decrease, prev: p, curr };
            }
          }
        });
        if (maxDecrease.cat) {
          result.push({
            id: 'cat-decrease',
            type: 'positive',
            icon: 'trending-down',
            title: `${maxDecrease.cat} melhorou!`,
            description: `Reduziu ${maxDecrease.decrease.toFixed(0)}% comparado ao mês passado.`,
            value: `-${maxDecrease.decrease.toFixed(0)}%`,
            detail: `Atual: ${formatCurrency(maxDecrease.curr)} · Anterior: ${formatCurrency(maxDecrease.prev)}`,
          });
        }
      }
    }

    // ========== PHASE 3: TRENDS (4+ months) ==========
    if (depth >= 3) {
      // Consecutive trend detection
      let consecutiveUp = 0;
      let consecutiveDown = 0;
      const ordered = [current, ...historyMonths];
      for (let i = 0; i < ordered.length - 1; i++) {
        if (ordered[i]!.total > ordered[i + 1]!.total) consecutiveUp++;
        else break;
      }
      for (let i = 0; i < ordered.length - 1; i++) {
        if (ordered[i]!.total < ordered[i + 1]!.total) consecutiveDown++;
        else break;
      }

      if (consecutiveUp >= 3) {
        result.push({
          id: 'trend-long',
          type: 'warning',
          icon: 'alert-circle',
          title: `Gastos subindo há ${consecutiveUp + 1} meses`,
          description: 'Tendência de alta persistente. Vale revisar seus hábitos de consumo.',
          detail: ordered.slice(0, consecutiveUp + 2).reverse().map(m => formatCurrency(m!.total)).join(' → '),
        });
      } else if (consecutiveDown >= 3) {
        result.push({
          id: 'trend-long',
          type: 'positive',
          icon: 'checkmark-circle',
          title: `${consecutiveDown + 1} meses em queda!`,
          description: `Excelente! Você está reduzindo gastos há ${consecutiveDown + 1} meses consecutivos.`,
          detail: ordered.slice(0, consecutiveDown + 2).reverse().map(m => formatCurrency(m!.total)).join(' → '),
        });
      } else if (consecutiveUp === 2) {
        result.push({
          id: 'trend-3m',
          type: 'warning',
          icon: 'alert-circle',
          title: 'Tendência de alta',
          description: 'Seus gastos estão subindo há 3 meses seguidos.',
        });
      } else if (consecutiveDown === 2) {
        result.push({
          id: 'trend-3m',
          type: 'positive',
          icon: 'checkmark-circle',
          title: 'Excelente tendência!',
          description: 'Três meses consecutivos de redução nos gastos!',
        });
      }

      // Historical average
      if (last6.length >= 3) {
        const avg6 = last6.reduce((s, m) => s + m.total, 0) / last6.length;
        const diffFromAvg = ((totalCurrent - avg6) / avg6) * 100;
        const abs = Math.abs(diffFromAvg);

        if (abs > 10) {
          result.push({
            id: 'hist-avg',
            type: diffFromAvg > 0 ? 'warning' : 'positive',
            icon: 'bar-chart',
            title: diffFromAvg > 0 ? 'Acima da sua média' : 'Abaixo da sua média!',
            description: diffFromAvg > 0
              ? `${abs.toFixed(0)}% acima da sua média dos últimos ${last6.length} meses.`
              : `${abs.toFixed(0)}% abaixo da sua média dos últimos ${last6.length} meses. Ótimo!`,
            value: `${diffFromAvg > 0 ? '+' : '-'}${abs.toFixed(0)}%`,
            detail: `Atual: ${formatCurrency(totalCurrent)} · Média: ${formatCurrency(avg6)}`,
          });
        }
      }

      // Spending pattern (beginning vs end)
      if (current.transactions.length >= 5) {
        const firstHalf = current.transactions.filter(t => new Date(t.transaction_date).getDate() <= 15);
        const secondHalf = current.transactions.filter(t => new Date(t.transaction_date).getDate() > 15);
        const firstTotal = firstHalf.reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const secondTotal = secondHalf.reduce((s, t) => s + (Number(t.amount) || 0), 0);

        if (totalCurrent > 0 && firstTotal > 0 && secondTotal > 0) {
          const firstPct = (firstTotal / totalCurrent) * 100;
          if (firstPct > 70) {
            result.push({
              id: 'pattern-start',
              type: 'neutral',
              icon: 'calendar',
              title: 'Gastos concentrados no início',
              description: `${firstPct.toFixed(0)}% dos gastos foram nos primeiros 15 dias.`,
              detail: `1ª quinzena: ${formatCurrency(firstTotal)} · 2ª quinzena: ${formatCurrency(secondTotal)}`,
            });
          } else if (firstPct < 30) {
            result.push({
              id: 'pattern-end',
              type: 'neutral',
              icon: 'calendar',
              title: 'Gastos concentrados no final',
              description: `${(100 - firstPct).toFixed(0)}% dos gastos foram na segunda quinzena.`,
              detail: `1ª quinzena: ${formatCurrency(firstTotal)} · 2ª quinzena: ${formatCurrency(secondTotal)}`,
            });
          }
        }
      }
    }

    // ========== PHASE 4: FULL INTELLIGENCE (6+ months) ==========
    if (depth >= 5) {
      // Records - global
      const allSorted = [...historyMonths].sort((a, b) => a.total - b.total);
      const bestMonth = allSorted[0];
      const worstMonth = allSorted[allSorted.length - 1];

      if (totalCurrent < bestMonth.total) {
        result.push({
          id: 'record-best',
          type: 'positive',
          icon: 'trophy',
          title: 'Recorde! Menor gasto!',
          description: `Seu melhor mês desde que começou! Superou ${MESES_FULL[bestMonth.month - 1]}/${bestMonth.year}.`,
          value: formatCurrency(totalCurrent),
          detail: `Recorde anterior: ${formatCurrency(bestMonth.total)} (${MESES[bestMonth.month - 1]}/${bestMonth.year})`,
        });
      }

      if (totalCurrent > worstMonth.total * 1.1) {
        result.push({
          id: 'record-worst',
          type: 'negative',
          icon: 'alert-circle',
          title: 'Mês mais caro do histórico',
          description: `Seus gastos superaram ${MESES_FULL[worstMonth.month - 1]}/${worstMonth.year}, que era o mês mais caro.`,
          value: formatCurrency(totalCurrent),
          detail: `Anterior: ${formatCurrency(worstMonth.total)} (${MESES[worstMonth.month - 1]}/${worstMonth.year})`,
        });
      }

      // Category records
      Object.entries(current.byCategory).forEach(([cat, catTotal]) => {
        const historyForCat = historyMonths.map(m => m.byCategory[cat] || 0).filter(v => v > 0);
        if (historyForCat.length >= 5) {
          const minHist = Math.min(...historyForCat);
          const maxHist = Math.max(...historyForCat);
          const avgHist = historyForCat.reduce((s, v) => s + v, 0) / historyForCat.length;

          if (catTotal < minHist && minHist > 0) {
            result.push({
              id: `record-cat-best-${cat}`,
              type: 'positive',
              icon: CATEGORY_ICONS[cat as Category] || 'pricetag',
              title: `Recorde em ${cat}!`,
              description: `Menor gasto dos últimos ${historyForCat.length + 1} meses. ${((1 - catTotal / avgHist) * 100).toFixed(0)}% abaixo da média.`,
              value: formatCurrency(catTotal),
              detail: `Média: ${formatCurrency(avgHist)}`,
            });
          } else if (catTotal > maxHist * 1.1) {
            result.push({
              id: `record-cat-worst-${cat}`,
              type: 'warning',
              icon: CATEGORY_ICONS[cat as Category] || 'pricetag',
              title: `${cat} acima do histórico`,
              description: `Maior gasto dos últimos ${historyForCat.length + 1} meses. ${((catTotal / avgHist - 1) * 100).toFixed(0)}% acima da média.`,
              value: formatCurrency(catTotal),
              detail: `Média: ${formatCurrency(avgHist)}`,
            });
          }
        }
      });

      // Category vs average
      if (last6.length >= 4) {
        const byCategoryCurrent = current.byCategory;
        Object.entries(byCategoryCurrent).forEach(([cat, curr]) => {
          const histValues = last6.map(m => m.byCategory[cat] || 0).filter(v => v > 0);
          if (histValues.length >= 4) {
            const avg = histValues.reduce((s, v) => s + v, 0) / histValues.length;
            const diff = ((curr - avg) / avg) * 100;
            if (diff > 50 && !result.find(r => r.id === `record-cat-worst-${cat}`)) {
              result.push({
                id: `cat-vs-avg-${cat}`,
                type: 'warning',
                icon: CATEGORY_ICONS[cat as Category] || 'pricetag',
                title: `${cat} acima da média`,
                description: `${diff.toFixed(0)}% acima da sua média de ${formatCurrency(avg)}.`,
                value: formatCurrency(curr),
                detail: `Média dos últimos ${histValues.length} meses`,
              });
            }
          }
        });
      }
    }

    // ========== PACE (always, if income configured) ==========
    if (totalIncome > 0 && totalCurrent > 0) {
      const dayOfMonth = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const pctMonthElapsed = (dayOfMonth / daysInMonth) * 100;
      const pctBudgetUsed = ((totalCurrent + totalFixed) / totalIncome) * 100;

      if (pctBudgetUsed > pctMonthElapsed + 15) {
        result.push({
          id: 'pace',
          type: depth >= 2 ? 'negative' : 'warning',
          icon: 'speedometer',
          title: depth >= 2 ? 'Ritmo acelerado!' : 'Fique de olho no ritmo',
          description: `Você já usou ${pctBudgetUsed.toFixed(0)}% da renda e estamos em ${pctMonthElapsed.toFixed(0)}% do mês.`,
          value: `${pctBudgetUsed.toFixed(0)}%`,
          detail: `Dia ${dayOfMonth} de ${daysInMonth} · Restam ${daysInMonth - dayOfMonth} dias`,
        });
      } else if (pctBudgetUsed < pctMonthElapsed - 10 && dayOfMonth > 15) {
        result.push({
          id: 'pace',
          type: 'positive',
          icon: 'shield-checkmark',
          title: 'Bom ritmo!',
          description: 'Você está gastando abaixo do esperado para este ponto do mês.',
          detail: `Usado: ${pctBudgetUsed.toFixed(0)}% da renda · Mês: ${pctMonthElapsed.toFixed(0)}% completo`,
        });
      }
    }

    // ========== PROJECT INSIGHTS ==========
    const activeProjects = projects.filter(p => p.is_active);
    if (activeProjects.length > 0 && current) {
      activeProjects.forEach(project => {
        const projectTxCurrent = current.transactions.filter(t => t.project_id === project.id);
        const projectTotal = projectTxCurrent.reduce((s, t) => s + (Number(t.amount) || 0), 0);

        if (projectTxCurrent.length === 0) return;

        // Budget usage
        if (project.budget && project.budget > 0) {
          const allProjectTx = allTx.filter(t => t.project_id === project.id);
          const totalSpent = allProjectTx.reduce((s, t) => s + (Number(t.amount) || 0), 0);
          const budgetPct = (totalSpent / project.budget) * 100;

          if (budgetPct >= 100) {
            result.push({
              id: `project-over-${project.id}`,
              type: 'negative',
              icon: 'alert-circle',
              title: `${project.name}: orçamento estourado`,
              description: `Já gastou ${formatCurrency(totalSpent)} de ${formatCurrency(project.budget)} (${budgetPct.toFixed(0)}%).`,
              value: `${budgetPct.toFixed(0)}%`,
              detail: `Excedido em ${formatCurrency(totalSpent - project.budget)}`,
            });
          } else if (budgetPct >= 75) {
            result.push({
              id: `project-warn-${project.id}`,
              type: 'warning',
              icon: 'warning',
              title: `${project.name}: orçamento quase no limite`,
              description: `${budgetPct.toFixed(0)}% do orçamento usado. Restam ${formatCurrency(project.budget - totalSpent)}.`,
              value: `${budgetPct.toFixed(0)}%`,
              detail: `Gasto: ${formatCurrency(totalSpent)} de ${formatCurrency(project.budget)}`,
            });
          } else if (budgetPct >= 50) {
            result.push({
              id: `project-half-${project.id}`,
              type: 'neutral',
              icon: 'pie-chart',
              title: `${project.name}: metade do orçamento`,
              description: `${budgetPct.toFixed(0)}% usado. Ainda disponível: ${formatCurrency(project.budget - totalSpent)}.`,
              value: formatCurrency(totalSpent),
              detail: `Orçamento: ${formatCurrency(project.budget)}`,
            });
          }
        }

        // Project month-over-month
        if (depth >= 1 && prev) {
          const projectTxPrev = prev.transactions.filter(t => t.project_id === project.id);
          const prevProjectTotal = projectTxPrev.reduce((s, t) => s + (Number(t.amount) || 0), 0);

          if (prevProjectTotal > 0 && projectTotal > 0) {
            const change = ((projectTotal - prevProjectTotal) / prevProjectTotal) * 100;
            const abs = Math.abs(change);
            if (abs > 20) {
              result.push({
                id: `project-mom-${project.id}`,
                type: change > 0 ? (depth >= 3 ? 'warning' : 'neutral') : 'positive',
                icon: change > 0 ? 'trending-up' : 'trending-down',
                title: `${project.name}: ${change > 0 ? 'gastos subiram' : 'gastos caíram'}`,
                description: `${abs.toFixed(0)}% ${change > 0 ? 'a mais' : 'a menos'} que no mês anterior.`,
                value: `${change > 0 ? '+' : '-'}${abs.toFixed(0)}%`,
                detail: `Atual: ${formatCurrency(projectTotal)} · Anterior: ${formatCurrency(prevProjectTotal)}`,
              });
            }
          }
        }

        // Project spending this month (if no budget, just informative)
        if (!project.budget && projectTotal > 0) {
          const pctOfTotal = totalCurrent > 0 ? (projectTotal / totalCurrent) * 100 : 0;
          result.push({
            id: `project-spend-${project.id}`,
            type: 'neutral',
            icon: 'folder',
            title: `Projeto: ${project.name}`,
            description: `${formatCurrency(projectTotal)} este mês (${pctOfTotal.toFixed(0)}% dos gastos totais).`,
            value: formatCurrency(projectTotal),
            detail: `${projectTxCurrent.length} transaç${projectTxCurrent.length === 1 ? 'ão' : 'ões'} no mês`,
          });
        }
      });
    }

    return result;
  }, [allTx, fixedExpenses, incomes, workspace, monthsData, current, prev, last6, historyMonths, projects, now.getMonth()]);

  const typeStyles: Record<string, { bg: string; border: string; iconColor: string }> = {
    positive: { bg: isDark ? 'bg-emerald-900/15' : 'bg-emerald-50', border: isDark ? 'border-emerald-800' : 'border-emerald-200', iconColor: '#10b981' },
    negative: { bg: isDark ? 'bg-red-900/15' : 'bg-red-50', border: isDark ? 'border-red-800' : 'border-red-200', iconColor: '#ef4444' },
    warning: { bg: isDark ? 'bg-amber-900/15' : 'bg-amber-50', border: isDark ? 'border-amber-800' : 'border-amber-200', iconColor: '#f59e0b' },
    neutral: { bg: isDark ? 'bg-slate-800' : 'bg-white', border: isDark ? 'border-slate-700' : 'border-gray-200', iconColor: isDark ? '#94a3b8' : '#6b7280' },
  };

  const [mesAtual] = currentMonthKey.split('/');
  const mesLabel = MESES[parseInt(mesAtual) - 1];

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
        {onGoBack && (
          <TouchableOpacity onPress={onGoBack}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#111827'} />
          </TouchableOpacity>
        )}
        <Text className="text-lg font-bold text-gray-900 dark:text-slate-100">Insights</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-sm text-gray-400 mt-3">Analisando seu histórico...</Text>
        </View>
      ) : (
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-10"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2196f3" colors={['#2196f3']} />}
      >
        {/* Header */}
        <View className="flex-row items-center gap-3 mb-4">
          <View className="w-12 h-12 rounded-2xl items-center justify-center bg-blue-500">
            <Ionicons name="bulb" size={24} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900 dark:text-slate-100">
              Análise de {mesLabel} {now.getFullYear()}
            </Text>
            <Text className="text-xs text-gray-400 dark:text-slate-500">
              {insights.length} insight{insights.length !== 1 ? 's' : ''} · baseado em {current?.transactions.length || 0} transações · {monthsData.length} meses de histórico
            </Text>
          </View>
        </View>

        {/* Score bar */}
        {(() => {
          const positives = insights.filter(i => i.type === 'positive').length;
          const negatives = insights.filter(i => i.type === 'negative').length;
          const total = positives + negatives;
          const score = total > 0 ? Math.round((positives / total) * 100) : 50;
          const emoji = score >= 70 ? '🟢' : score >= 40 ? '🟡' : '🔴';
          const label = score >= 70 ? 'Saúde financeira boa' : score >= 40 ? 'Atenção necessária' : 'Situação crítica';

          return (
            <View className="rounded-xl p-4 mb-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">{emoji} {label}</Text>
                <Text className="text-xl font-black text-gray-900 dark:text-slate-100">{score}/100</Text>
              </View>
              <View className="h-3 rounded-full bg-gray-200 dark:bg-slate-600 overflow-hidden">
                <View
                  className={`h-full rounded-full ${score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${score}%` }}
                />
              </View>
              <View className="flex-row justify-between mt-2">
                <Text className="text-xs text-emerald-500">{positives} positivo{positives !== 1 ? 's' : ''}</Text>
                <Text className="text-xs text-red-500">{negatives} alerta{negatives !== 1 ? 's' : ''}</Text>
              </View>
            </View>
          );
        })()}

        {/* Insight Cards */}
        {insights.map((insight) => {
          const style = typeStyles[insight.type];
          return (
            <View
              key={insight.id}
              className={`rounded-xl p-4 mb-3 border ${style.bg} ${style.border}`}
            >
              <View className="flex-row items-start gap-3">
                <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: style.iconColor + '20' }}>
                  <Ionicons name={insight.icon as any} size={20} color={style.iconColor} />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-bold text-gray-900 dark:text-slate-100 flex-1">
                      {insight.title}
                    </Text>
                    {insight.value && (
                      <Text
                        className={`text-lg font-black ml-2 ${
                          insight.type === 'positive' ? 'text-emerald-600 dark:text-emerald-400'
                          : insight.type === 'negative' ? 'text-red-600 dark:text-red-400'
                          : insight.type === 'warning' ? 'text-amber-600 dark:text-amber-400'
                          : 'text-gray-600 dark:text-slate-300'
                        }`}
                      >
                        {insight.value}
                      </Text>
                    )}
                  </View>
                  <Text className="text-xs text-gray-500 dark:text-slate-400 leading-4">
                    {insight.description}
                  </Text>
                  {insight.detail && (
                    <Text className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">
                      {insight.detail}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
      )}
    </SafeAreaView>
  );
};
