import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

interface SectionProps {
  icon: string;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ icon, iconColor, title, children }) => {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(true);

  return (
    <View className="mb-4 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
      <TouchableOpacity
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.8}
        className="flex-row items-center p-4 gap-3"
      >
        <View className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: iconColor + '22' }}>
          <Ionicons name={icon as any} size={20} color={iconColor} />
        </View>
        <Text className="flex-1 text-base font-bold text-gray-900 dark:text-slate-100">{title}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={isDark ? '#64748b' : '#9ca3af'}
        />
      </TouchableOpacity>
      {open && (
        <View className="px-4 pb-4 border-t border-gray-100 dark:border-slate-700 pt-3">
          {children}
        </View>
      )}
    </View>
  );
};

const Tip: React.FC<{ icon?: string; color?: string; children: React.ReactNode }> = ({
  icon = 'information-circle-outline',
  color = '#3b82f6',
  children,
}) => (
  <View className="flex-row gap-2 mb-2.5">
    <Ionicons name={icon as any} size={16} color={color} style={{ marginTop: 2 }} />
    <Text className="flex-1 text-sm leading-5 text-gray-700 dark:text-slate-300">{children}</Text>
  </View>
);

const Tag: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <View className="px-2.5 py-1 rounded-full mr-2 mb-2" style={{ backgroundColor: color + '22' }}>
    <Text className="text-xs font-semibold" style={{ color }}>{label}</Text>
  </View>
);

export const HelpScreen: React.FC<{ onGoBack?: () => void }> = ({ onGoBack }) => {
  const { isDark } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
      <View className="flex-row items-center p-4 border-b border-gray-200 dark:border-slate-700 gap-3">
        {onGoBack && (
          <TouchableOpacity onPress={onGoBack}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#111827'} />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900 dark:text-slate-100">Ajuda</Text>
          <Text className="text-sm text-gray-500 dark:text-slate-400">Como usar o app</Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Banner */}
        <View className="rounded-2xl p-5 mb-5 bg-blue-500">
          <Text className="text-white text-xl font-bold mb-1">Finança Pessoal</Text>
          <Text className="text-blue-100 text-sm leading-5">
            Controle seus gastos, organize por projetos, acompanhe poupanças e tome decisões financeiras mais inteligentes.
          </Text>
        </View>

        {/* Palavras-chave */}
        <View className="mb-5">
          <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-3">
            Conceitos principais
          </Text>
          <View className="flex-row flex-wrap">
            {[
              { label: 'Lançamentos', color: '#ef4444' },
              { label: 'Gastos Fixos', color: '#f59e0b' },
              { label: 'Poupança', color: '#10b981' },
              { label: 'Projetos', color: '#8b5cf6' },
              { label: 'Débito/Pix', color: '#3b82f6' },
              { label: 'Crédito', color: '#f59e0b' },
              { label: 'Parcelas', color: '#ec4899' },
              { label: 'Workspace', color: '#0ea5e9' },
              { label: 'Dashboard', color: '#6366f1' },
              { label: 'Insights', color: '#f97316' },
              { label: 'Relatórios', color: '#14b8a6' },
            ].map(t => (
              <Tag key={t.label} label={t.label} color={t.color} />
            ))}
          </View>
        </View>

        {/* ── LANÇAMENTOS ── */}
        <Section icon="add-circle-outline" iconColor="#ef4444" title="Lançamentos (Gastos Variáveis)">
          <Tip icon="bulb-outline" color="#f59e0b">
            São os gastos do dia a dia que variam todo mês: mercado, combustível, restaurante, farmácia e afins.
          </Tip>
          <Tip icon="phone-portrait-outline" color="#3b82f6">
            Para registrar, toque no botão <Text className="font-bold">+</Text> na tela Início. Preencha valor, descrição e categoria.
          </Tip>

          <View className="mt-2 mb-3 h-px bg-gray-100 dark:bg-slate-700" />
          <Text className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-2">Formas de pagamento</Text>

          <Tip icon="wallet-outline" color="#3b82f6">
            <Text className="font-bold">Débito / Pix</Text> — pagamento imediato. O valor entra nos gastos do mês atual.
          </Tip>
          <Tip icon="card-outline" color="#f59e0b">
            <Text className="font-bold">Crédito</Text> — compra no cartão. Pode ser parcelado em até 48x. Cada parcela é lançada no mês correspondente automaticamente.
          </Tip>

          <View className="mt-2 mb-3 h-px bg-gray-100 dark:bg-slate-700" />
          <Text className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-2">Parcelas</Text>

          <Tip icon="layers-outline" color="#ec4899">
            Ao escolher crédito e informar o número de parcelas, o app cria uma transação para cada mês automaticamente.
          </Tip>
          <Tip icon="trash-outline" color="#9ca3af">
            No Histórico você pode excluir só a parcela atual ou todas de uma vez.
          </Tip>

          <View className="mt-2 mb-3 h-px bg-gray-100 dark:bg-slate-700" />
          <Text className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-2">Retirada da poupança</Text>

          <Tip icon="wallet-outline" color="#10b981">
            Ative o toggle <Text className="font-bold">"Retirar da poupança"</Text> para registrar um gasto que sai de uma meta. O saldo da meta é debitado automaticamente.
          </Tip>
          <Tip icon="bar-chart-outline" color="#10b981">
            Retiradas da poupança aparecem em seção separada no Dashboard e <Text className="font-bold">não</Text> entram nos gastos variáveis normais.
          </Tip>
        </Section>

        {/* ── GASTOS FIXOS ── */}
        <Section icon="card-outline" iconColor="#f59e0b" title="Gastos Fixos">
          <Tip icon="bulb-outline" color="#f59e0b">
            São despesas recorrentes com valor fixo todo mês. Você cadastra uma vez e elas entram automaticamente no cálculo do Dashboard.
          </Tip>

          <View className="mt-2 mb-3 h-px bg-gray-100 dark:bg-slate-700" />
          <Text className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-2">Débito vs. Crédito nos gastos fixos</Text>

          <Tip icon="wallet-outline" color="#3b82f6">
            <Text className="font-bold">Débito</Text> — use para contas pagas diretamente: aluguel, financiamento, academia, água, luz, internet via boleto.
          </Tip>
          <Tip icon="card-outline" color="#f59e0b">
            <Text className="font-bold">Crédito</Text> — use para <Text className="font-bold">assinaturas</Text> que chegam na fatura do cartão todo mês: Netflix, Spotify, Amazon Prime, Disney+, iCloud, Google One, plano do celular, antivírus, ferramentas online, etc.
          </Tip>

          <View className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mt-2 border border-amber-200 dark:border-amber-800">
            <Text className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Dica: classifique tudo que vem automaticamente no cartão como Crédito. Assim o Dashboard separa claramente o que você paga à vista do que vem na fatura.
            </Text>
          </View>
        </Section>

        {/* ── POUPANÇA ── */}
        <Section icon="trending-up-outline" iconColor="#10b981" title="Metas de Poupança">
          <Tip icon="bulb-outline" color="#10b981">
            Crie metas financeiras com um valor objetivo. Acompanhe seu progresso depositando valores ao longo do tempo.
          </Tip>
          <Tip icon="add-circle-outline" color="#10b981">
            <Text className="font-bold">Criar meta:</Text> acesse Menu → Metas de Poupança → preencha nome e valor objetivo.
          </Tip>
          <Tip icon="arrow-down-circle-outline" color="#3b82f6">
            <Text className="font-bold">Depositar:</Text> toque em "Depositar" no card da meta. O saldo é atualizado instantaneamente.
          </Tip>
          <Tip icon="time-outline" color="#6366f1">
            <Text className="font-bold">Ver histórico:</Text> toque em "Histórico" (ou no próprio card) para ver todos os depósitos e retiradas da meta.
          </Tip>
          <Tip icon="arrow-up-circle-outline" color="#f97316">
            <Text className="font-bold">Retirar:</Text> ao registrar um lançamento, ative o toggle "Retirar da poupança" e escolha a meta. O valor é debitado da meta e registrado como gasto separado.
          </Tip>
        </Section>

        {/* ── PROJETOS ── */}
        <Section icon="folder-outline" iconColor="#8b5cf6" title="Projetos">
          <Tip icon="bulb-outline" color="#8b5cf6">
            Projetos agrupam gastos relacionados a um objetivo específico. Exemplos: "Reforma do Quarto", "Viagem para Paris", "Casamento", "Novo Carro".
          </Tip>
          <Tip icon="add-outline" color="#8b5cf6">
            <Text className="font-bold">Criar projeto:</Text> Menu → Projetos → "+ Novo Projeto". Defina nome, ícone, cor e opcionalmente um orçamento.
          </Tip>
          <Tip icon="link-outline" color="#3b82f6">
            <Text className="font-bold">Vincular gasto:</Text> ao registrar qualquer lançamento, selecione o projeto na lista. O gasto aparecerá no detalhamento do projeto.
          </Tip>
          <Tip icon="bar-chart-outline" color="#8b5cf6">
            <Text className="font-bold">Detalhe do projeto:</Text> veja total gasto, comparativo com orçamento e todos os lançamentos vinculados — incluindo retiradas da poupança.
          </Tip>
          <Tip icon="document-text-outline" color="#0ea5e9">
            Nos Relatórios, filtre por projeto para gerar um PDF exclusivo de cada objetivo.
          </Tip>
        </Section>

        {/* ── DASHBOARD ── */}
        <Section icon="stats-chart-outline" iconColor="#6366f1" title="Dashboard">
          <Tip icon="calculator-outline" color="#6366f1">
            O Dashboard mostra o resumo financeiro do mês selecionado.
          </Tip>
          <Tip icon="cash-outline" color="#10b981">
            <Text className="font-bold">Rendas:</Text> total das rendas cadastradas (salário, freela, etc.).
          </Tip>
          <Tip icon="card-outline" color="#f59e0b">
            <Text className="font-bold">Gastos Fixos:</Text> soma de todos os gastos fixos cadastrados.
          </Tip>
          <Tip icon="receipt-outline" color="#ef4444">
            <Text className="font-bold">Gastos Variáveis:</Text> soma dos lançamentos do mês (débito + crédito), excluindo retiradas da poupança.
          </Tip>
          <Tip icon="wallet-outline" color="#10b981">
            <Text className="font-bold">Retiradas da poupança:</Text> exibidas separadamente, sem afetar o saldo disponível.
          </Tip>
          <Tip icon="eye-off-outline" color="#6b7280">
            Toque no ícone do olho para ocultar os valores — útil em lugares públicos.
          </Tip>
        </Section>

        {/* ── HISTÓRICO ── */}
        <Section icon="time-outline" iconColor="#0ea5e9" title="Histórico">
          <Tip icon="filter-outline" color="#0ea5e9">
            Filtre por categoria, membro, forma de pagamento e navegue por meses anteriores.
          </Tip>
          <Tip icon="trash-outline" color="#ef4444">
            Toque no ícone de <Text className="font-bold">lixeira</Text> em qualquer transação para excluí-la.
          </Tip>
          <Tip icon="layers-outline" color="#ec4899">
            Para lançamentos parcelados, o app pergunta se deseja remover só a parcela atual ou todas do grupo.
          </Tip>
          <Tip icon="wallet-outline" color="#10b981">
            Retiradas da poupança exibem um badge verde identificando a meta de origem.
          </Tip>
        </Section>

        {/* ── RELATÓRIOS ── */}
        <Section icon="document-text-outline" iconColor="#14b8a6" title="Relatórios">
          <Tip icon="document-outline" color="#14b8a6">
            Gere relatórios em PDF com o resumo completo do período selecionado.
          </Tip>
          <Tip icon="folder-outline" color="#8b5cf6">
            Filtre por <Text className="font-bold">projeto</Text> para ver só os gastos de um objetivo.
          </Tip>
          <Tip icon="pricetag-outline" color="#ef4444">
            Filtre por <Text className="font-bold">categoria</Text> (alimentação, transporte, etc.) para análises detalhadas.
          </Tip>
          <Tip icon="layers-outline" color="#6366f1">
            Combine filtros de projeto + categoria para relatórios ainda mais precisos.
          </Tip>
          <Tip icon="wallet-outline" color="#10b981">
            Retiradas da poupança aparecem em seção própria no relatório.
          </Tip>
        </Section>

        {/* ── INSIGHTS ── */}
        <Section icon="bulb-outline" iconColor="#f97316" title="Insights">
          <Tip icon="analytics-outline" color="#f97316">
            Análises automáticas dos seus padrões financeiros com base nos dados do workspace.
          </Tip>
          <Tip icon="trending-up-outline" color="#10b981">
            Comparativo com o mês anterior: saiba se está gastando mais ou menos.
          </Tip>
          <Tip icon="flame-outline" color="#ef4444">
            Identifica a maior despesa, categoria dominante e dias com mais gastos.
          </Tip>
          <Tip icon="pie-chart-outline" color="#8b5cf6">
            Distribuição por projeto: veja qual projeto concentra mais gastos.
          </Tip>
        </Section>

        {/* ── WORKSPACE ── */}
        <Section icon="people-outline" iconColor="#0ea5e9" title="Workspace (Compartilhamento)">
          <Tip icon="share-outline" color="#0ea5e9">
            Um workspace é um espaço financeiro compartilhado. Ideal para casais, famílias ou sócios.
          </Tip>
          <Tip icon="key-outline" color="#f59e0b">
            <Text className="font-bold">Convidar:</Text> acesse Menu → Membros e compartilhe o código de 6 dígitos com quem deseja adicionar.
          </Tip>
          <Tip icon="sync-outline" color="#10b981">
            Todos os membros veem os mesmos dados em <Text className="font-bold">tempo real</Text>.
          </Tip>
          <Tip icon="person-outline" color="#6b7280">
            Cada lançamento fica marcado com o nome de quem registrou.
          </Tip>
        </Section>

        {/* ── CRÉDITOS ── */}
        <View className="mt-2 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <View className="p-5">
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-blue-500 items-center justify-center mb-3">
                <Text className="text-white text-2xl font-bold">JJ</Text>
              </View>
              <Text className="text-lg font-bold text-gray-900 dark:text-slate-100">Jaceguai Junior</Text>
              <Text className="text-sm text-gray-500 dark:text-slate-400">Desenvolvedor</Text>
            </View>

            <View className="h-px bg-gray-100 dark:bg-slate-700 mb-4" />

            <Text className="text-sm text-center leading-5 text-gray-600 dark:text-slate-400 mb-4">
              App desenvolvido com React Native + Expo + Supabase. Criado para facilitar o controle financeiro pessoal e familiar, com sincronização em tempo real entre membros.
            </Text>

            <TouchableOpacity
              onPress={() => Linking.openURL('https://www.linkedin.com/in/jaceguai-junior/')}
              className="flex-row items-center justify-center gap-2 py-3 px-5 rounded-xl bg-blue-600 active:bg-blue-700"
            >
              <Ionicons name="logo-linkedin" size={20} color="#ffffff" />
              <Text className="text-white font-bold">LinkedIn — Jaceguai Junior Dev</Text>
            </TouchableOpacity>

            <Text className="text-xs text-center text-gray-400 dark:text-slate-600 mt-4">
              Versão 1.20.2 · 2026
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};
