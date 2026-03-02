import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast } from '../../components/Toast';
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS } from '../../constants/categories';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useFixedExpenses, useIncomes, useProjects, useSavingsGoals } from '../../hooks/useSupabaseQuery';
import { fetchTransactions } from '../../services/api';
import { useTheme } from '../../theme';
import { generateReportHtml } from '../../utils/reportPdf';

const MESES_CURTO = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const ReportsScreen: React.FC<{ onGoBack?: () => void }> = ({ onGoBack }) => {
  const { isDark } = useTheme();
  const { workspace, members } = useWorkspace();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([currentMonth]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'success' });

  const { data: projects = [] } = useProjects(workspace?.id);
  const { data: fixedExpenses = [] } = useFixedExpenses(workspace?.id);
  const { data: incomes = [] } = useIncomes(workspace?.id);
  const { data: savingsGoals = [] } = useSavingsGoals(workspace?.id);

  const toggleMonth = (month: number) => {
    setSelectedMonths(prev =>
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month].sort((a, b) => a - b)
    );
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const selectAllMonths = () => setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const selectSemester = (sem: 1 | 2) => setSelectedMonths(sem === 1 ? [1, 2, 3, 4, 5, 6] : [7, 8, 9, 10, 11, 12]);
  const selectQuarter = (q: number) => { const b = (q - 1) * 3; setSelectedMonths([b + 1, b + 2, b + 3]); };

  const memberNames: Record<string, string> = {};
  members.forEach(m => { memberNames[m.user_id] = m.display_name; });

  const savingsGoalNames: Record<string, string> = {};
  savingsGoals.forEach(g => { savingsGoalNames[g.id] = g.name; });

  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) || null : null;

  const handleGenerate = async () => {
    if (!workspace || selectedMonths.length === 0) return;
    setGenerating(true);

    try {
      const rawTransactions = await fetchTransactions(workspace.id);

      let allTransactions = rawTransactions.filter(t => {
        const d = new Date(t.transaction_date);
        return d.getFullYear() === selectedYear && selectedMonths.includes(d.getMonth() + 1);
      });

      if (selectedProjectId) {
        allTransactions = allTransactions.filter(t => t.project_id === selectedProjectId);
      }

      if (selectedCategories.length > 0) {
        allTransactions = allTransactions.filter(t => selectedCategories.includes(t.category));
      }

      const html = generateReportHtml({
        workspaceName: workspace.name,
        year: selectedYear,
        months: selectedMonths,
        transactions: allTransactions,
        fixedExpenses: fixedExpenses.map(f => ({
          description: f.description,
          amount: Number(f.amount),
          payment_method: f.payment_method,
        })),
        incomes: incomes.map(i => ({
          description: i.description,
          amount: Number(i.amount),
        })),
        project: selectedProject,
        selectedCategories: selectedCategories.length > 0 ? selectedCategories : null,
        savingsGoalNames,
        memberNames,
        generatedAt: new Date().toLocaleDateString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }),
      });

      const { uri } = await Print.printToFileAsync({ html, base64: false });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Relatório Financeiro',
          UTI: 'com.adobe.pdf',
        });
      }

      setToast({ visible: true, message: 'Relatório gerado!', type: 'success' });
    } catch (err: any) {
      setToast({ visible: true, message: `Erro: ${err.message || 'falha ao gerar'}`, type: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={() => setToast({ ...toast, visible: false })} />

      <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
        {onGoBack && (
          <TouchableOpacity onPress={onGoBack}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#111827'} />
          </TouchableOpacity>
        )}
        <Text className="text-lg font-bold text-gray-900 dark:text-slate-100">Relatórios</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">

          {/* Year Selector */}
          <View className="rounded-xl p-4 mb-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <Text className="text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">Ano</Text>
            <View className="flex-row gap-2">
              {[currentYear - 2, currentYear - 1, currentYear].map(y => (
                <TouchableOpacity
                  key={y}
                  onPress={() => setSelectedYear(y)}
                  className={`flex-1 py-3 rounded-xl items-center border-2 ${
                    selectedYear === y
                      ? 'bg-blue-500 dark:bg-blue-600 border-blue-500 dark:border-blue-600'
                      : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'
                  }`}
                >
                  <Text className={`font-bold ${selectedYear === y ? 'text-white' : 'text-gray-600 dark:text-slate-300'}`}>{y}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Month Selector */}
          <View className="rounded-xl p-4 mb-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">Meses</Text>
              <Text className="text-xs text-gray-400 dark:text-slate-500">
                {selectedMonths.length} selecionado{selectedMonths.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 mb-3">
              <TouchableOpacity onPress={selectAllMonths} className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Text className="text-xs font-semibold text-blue-600 dark:text-blue-400">Ano todo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => selectSemester(1)} className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Text className="text-xs font-semibold text-blue-600 dark:text-blue-400">1° Sem</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => selectSemester(2)} className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Text className="text-xs font-semibold text-blue-600 dark:text-blue-400">2° Sem</Text>
              </TouchableOpacity>
              {[1, 2, 3, 4].map(q => (
                <TouchableOpacity key={q} onPress={() => selectQuarter(q)} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700">
                  <Text className="text-xs font-semibold text-gray-500 dark:text-slate-400">{q}° Tri</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View className="flex-row flex-wrap gap-2">
              {MESES_CURTO.map((m, i) => {
                const monthNum = i + 1;
                const isSelected = selectedMonths.includes(monthNum);
                return (
                  <TouchableOpacity
                    key={monthNum}
                    onPress={() => toggleMonth(monthNum)}
                    className={`w-[23%] py-3 rounded-xl items-center border-2 ${
                      isSelected
                        ? 'bg-blue-500 dark:bg-blue-600 border-blue-500 dark:border-blue-600'
                        : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'
                    }`}
                  >
                    <Text className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-600 dark:text-slate-300'}`}>{m}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Category Filter */}
          <View className="rounded-xl p-4 mb-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">Categorias (opcional)</Text>
              {selectedCategories.length > 0 && (
                <TouchableOpacity onPress={() => setSelectedCategories([])}>
                  <Text className="text-xs font-semibold text-blue-500 dark:text-blue-400">Limpar</Text>
                </TouchableOpacity>
              )}
            </View>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const isSelected = selectedCategories.includes(cat);
                const color = CATEGORY_COLORS[cat];
                const icon = CATEGORY_ICONS[cat];
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => toggleCategory(cat)}
                    className={`flex-row items-center px-3 py-2 rounded-xl border gap-1.5 ${
                      isSelected ? 'border-transparent' : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'
                    }`}
                    style={isSelected ? { backgroundColor: color } : {}}
                  >
                    <Ionicons name={icon as any} size={13} color={isSelected ? '#ffffff' : color} />
                    <Text className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-gray-600 dark:text-slate-300'}`}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedCategories.length === 0 && (
              <Text className="text-xs text-gray-400 dark:text-slate-500 mt-2">Nenhuma selecionada = todas as categorias</Text>
            )}
          </View>

          {/* Project Filter */}
          {projects.length > 0 && (
            <View className="rounded-xl p-4 mb-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">Projeto (opcional)</Text>
                {selectedProjectId && (
                  <TouchableOpacity onPress={() => setSelectedProjectId(null)}>
                    <Text className="text-xs font-semibold text-blue-500 dark:text-blue-400">Limpar</Text>
                  </TouchableOpacity>
                )}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
                <TouchableOpacity
                  onPress={() => setSelectedProjectId(null)}
                  className={`flex-row items-center px-4 py-2.5 rounded-xl border gap-2 ${
                    selectedProjectId === null
                      ? 'bg-gray-700 dark:bg-gray-200 border-gray-700 dark:border-gray-200'
                      : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'
                  }`}
                >
                  <Ionicons name="globe-outline" size={16} color={selectedProjectId === null ? (isDark ? '#111827' : '#ffffff') : (isDark ? '#94a3b8' : '#6b7280')} />
                  <Text className={`text-xs font-semibold ${selectedProjectId === null ? 'text-white dark:text-gray-900' : 'text-gray-600 dark:text-slate-300'}`}>
                    Geral
                  </Text>
                </TouchableOpacity>
                {projects.map((proj) => (
                  <TouchableOpacity
                    key={proj.id}
                    onPress={() => setSelectedProjectId(proj.id)}
                    className={`flex-row items-center px-4 py-2.5 rounded-xl border gap-2 ${
                      selectedProjectId === proj.id ? 'border-transparent' : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'
                    }`}
                    style={selectedProjectId === proj.id ? { backgroundColor: proj.color } : {}}
                  >
                    <Ionicons name={proj.icon as any} size={16} color={selectedProjectId === proj.id ? '#ffffff' : proj.color} />
                    <Text className={`text-xs font-semibold ${selectedProjectId === proj.id ? 'text-white' : 'text-gray-600 dark:text-slate-300'}`}>
                      {proj.name}{!proj.is_active ? ' (finalizado)' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Active filters summary */}
          {(selectedCategories.length > 0 || selectedProjectId) && (
            <View className="rounded-xl p-3 mb-4 bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-800 flex-row flex-wrap gap-2 items-center">
              <Ionicons name="filter" size={14} color="#3b82f6" />
              <Text className="text-xs font-semibold text-blue-600 dark:text-blue-400">Filtros ativos:</Text>
              {selectedProjectId && (
                <View className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-800">
                  <Text className="text-xs text-blue-700 dark:text-blue-300">
                    {projects.find(p => p.id === selectedProjectId)?.name}
                  </Text>
                </View>
              )}
              {selectedCategories.map(c => (
                <View key={c} className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-800">
                  <Text className="text-xs text-blue-700 dark:text-blue-300">{c}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Info Card */}
          <View className="rounded-xl p-4 mb-4 bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800">
            <View className="flex-row items-start gap-3">
              <Ionicons name="information-circle" size={20} color="#059669" />
              <View className="flex-1">
                <Text className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">O que o relatório inclui:</Text>
                <Text className="text-xs text-emerald-700 dark:text-emerald-400 leading-4">
                  • Resumo geral (entradas × saídas × saldo){'\n'}
                  • Retiradas da poupança (seção separada){'\n'}
                  • Despesas dedutíveis no IR (Saúde e Educação){'\n'}
                  • Despesas por categoria e por mês{'\n'}
                  • Compras parceladas ativas{'\n'}
                  • Gastos por membro{'\n'}
                  • Listagem completa de transações
                </Text>
              </View>
            </View>
          </View>

          {/* Generate Button */}
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={generating || selectedMonths.length === 0}
            className={`rounded-xl py-4 flex-row items-center justify-center gap-2 ${
              generating || selectedMonths.length === 0
                ? 'bg-gray-300 dark:bg-slate-700'
                : 'bg-blue-500 dark:bg-blue-600'
            }`}
          >
            {generating ? (
              <>
                <ActivityIndicator color="#ffffff" size="small" />
                <Text className="text-white text-base font-bold">Gerando PDF...</Text>
              </>
            ) : (
              <>
                <Ionicons name="document-text" size={20} color="#ffffff" />
                <Text className="text-white text-base font-bold">Gerar Relatório PDF</Text>
              </>
            )}
          </TouchableOpacity>

          {selectedMonths.length === 0 && (
            <Text className="text-xs text-center mt-2 text-red-500">Selecione pelo menos um mês</Text>
          )}

          <View className="h-6" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
