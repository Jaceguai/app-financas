# Plano: Reestruturação UI + Drawer Navigation

## Objetivo
Adicionar menu lateral (drawer/hamburger), perfil de usuário, troca de workspace acessível, e separar a SettingsScreen (606 linhas) em telas dedicadas. Zero quebras na funcionalidade existente.

---

## Visão Geral da Nova Navegação

```
NavigationContainer
├── AuthStack (se !user)
│   ├── Login
│   └── Register
├── WorkspaceScreen (se user && !workspace) — sem mudanças
└── DrawerNavigator (se user && workspace) ← NOVO
    ├── MainTabs (nested) — hamburger no header
    │   ├── Home (Início)
    │   ├── Dashboard
    │   └── Histórico
    ├── ProfileScreen ← NOVO
    ├── IncomesScreen ← NOVO (extraído do Settings)
    ├── FixedExpensesScreen ← NOVO (extraído do Settings)
    ├── SavingsGoalsScreen ← NOVO (extraído do Settings)
    ├── AppSettingsScreen ← NOVO (tema + config)
    ├── WorkspaceSettingsScreen ← NOVO (info ws + membros)
    └── WorkspaceManagementScreen ← NOVO (listar/trocar ws)
```

**Mudança chave**: Tabs reduzem de 4 para 3 (remove aba Config). Config vira AppSettingsScreen acessível pelo drawer. Tab "Histórico" permanece.

---

## Fase 1: Instalar dependências

```bash
npx expo install react-native-reanimated
npm install @react-navigation/drawer@^6
```

- `react-native-gesture-handler` já instalado
- `react-native-reanimated` é necessário para o drawer

**Editar** `babel.config.js` — adicionar plugin `react-native-reanimated/plugin` (deve ser o último)

---

## Fase 2: Telas novas (extrair do SettingsScreen)

### 2.1 ProfileScreen
**Novo**: `src/screens/profile/ProfileScreen.tsx`
- Avatar com iniciais do `display_name`
- Nome, email, role no workspace atual
- Membro desde (joined_at do currentMember)
- Workspace atual
- Dados via: `useAuth()`, `useWorkspace()`

### 2.2 IncomesScreen
**Novo**: `src/screens/financial/IncomesScreen.tsx`
- Extrair linhas 320-379 do SettingsScreen
- Header com total + toggle hide values
- Form: descrição, valor, responsável (membros dinâmicos)
- Lista de rendas com delete
- Hooks: `useIncomes`, `useAddIncome`, `useDeleteIncome`
- Schema: `rendaSchema`

### 2.3 FixedExpensesScreen
**Novo**: `src/screens/financial/FixedExpensesScreen.tsx`
- Extrair linhas 381-457 do SettingsScreen
- Header com total comprometido + toggle hide values
- Form: descrição, valor, responsável, método pagamento (débito/crédito)
- Lista com badges de crédito/débito + delete
- Hooks: `useFixedExpenses`, `useAddFixedExpense`, `useDeleteFixedExpense`
- Schema: `fixedExpenseSchema`

### 2.4 SavingsGoalsScreen
**Novo**: `src/screens/financial/SavingsGoalsScreen.tsx`
- Extrair linhas 459-523 do SettingsScreen
- Form: nome, alvo, atual (opcional)
- Lista com progress bar, % completo, botão depositar, delete
- Modal de depósito (mesmo modal que já existe)
- Hooks: `useSavingsGoals`, `useAddSavingsGoal`, `useDepositToGoal`, `useDeleteSavingsGoal`
- Schemas: `metaSchema`, `depositoMetaSchema`
- Componente: `ProgressBar` (existente)

### 2.5 AppSettingsScreen
**Novo**: `src/screens/settings/AppSettingsScreen.tsx`
- Extrair linhas 300-318 (tema) + 525-540 (config) do SettingsScreen
- Seletor de tema: Claro/Escuro/Auto (botões com ícones)
- Teto de gastos variáveis: input + botão salvar
- Hooks: `useWorkspaceConfig`, `useUpdateConfig`
- Schema: `configSchema`

### 2.6 WorkspaceSettingsScreen
**Novo**: `src/screens/workspace/WorkspaceSettingsScreen.tsx`
- Extrair linhas 281-298 do SettingsScreen
- Info do workspace: nome, código de convite (copiável)
- Botão "Gerenciar Membros" → navega para MembersScreen
- Botão "Sair do Workspace" (com Alert de confirmação)
- Dados via: `useWorkspace()`

### 2.7 WorkspaceManagementScreen
**Novo**: `src/screens/workspace/WorkspaceManagementScreen.tsx`
- Lista TODOS os workspaces do usuário (query workspace_members → workspaces)
- Indicador visual do workspace ativo (checkmark)
- Tap para trocar de workspace (chama `setActiveWorkspace`)
- Botões: "Criar Workspace" e "Entrar com Código" (reusa lógica do WorkspaceScreen)
- Hook novo: `useUserWorkspaces` (React Query)

---

## Fase 3: Hook novo para listar workspaces

**Novo**: `src/hooks/useUserWorkspaces.ts`

```typescript
// Query: workspace_members(user_id) → workspaces(ids)
// Retorna todos os workspaces onde o usuário é membro
// queryKey: ['user_workspaces', userId]
```

---

## Fase 4: Drawer Content customizado

**Novo**: `src/components/CustomDrawerContent.tsx`

Layout do drawer (de cima para baixo):
1. **Seção perfil** — avatar + display_name + email → tap navega para ProfileScreen
2. **Divider**
3. **Workspace ativo** — nome do ws + "X membros" + ícone swap → tap navega para WorkspaceManagementScreen
4. **Divider**
5. **Navegação Principal** (header "NAVEGAÇÃO")
   - Início → MainTabs(Home)
   - Dashboard → MainTabs(Dashboard)
   - Histórico → MainTabs(Histórico)
6. **Divider**
7. **Gestão Financeira** (header "GESTÃO FINANCEIRA")
   - Rendas Mensais → IncomesScreen
   - Gastos Fixos → FixedExpensesScreen
   - Metas de Poupança → SavingsGoalsScreen
8. **Divider**
9. **Configurações** (header "CONFIGURAÇÕES")
   - Config do App → AppSettingsScreen
   - Config do Workspace → WorkspaceSettingsScreen
10. **Sair da Conta** (botão vermelho no rodapé)

Cada item usa ícones Ionicons. Estilo segue o tema (theme.colors).

---

## Fase 5: Atualizar App.tsx

### Mudanças:
1. Importar `createDrawerNavigator` de `@react-navigation/drawer`
2. Importar `CustomDrawerContent`
3. Importar todas as novas telas
4. Criar `DrawerNavigator` que aninha `MainTabs`
5. `MainTabs` perde a aba "Config" (ficam 3 tabs: Home, Dashboard, Histórico)
6. `MainTabs` ganha botão hamburger no `headerLeft` de cada tab
7. `NavigationContent`: onde tinha `<MainTabs />` agora tem `<DrawerNavigator />`
8. Remover import do `SettingsScreen`

### Configuração do Drawer:
```typescript
<Drawer.Navigator
  drawerContent={(props) => <CustomDrawerContent {...props} />}
  screenOptions={{
    headerShown: false,  // Tabs e telas internas têm seu próprio header
    drawerType: 'front',
    swipeEnabled: true,
    drawerStyle: { width: 280, backgroundColor: theme.colors.surface },
  }}
>
  <Drawer.Screen name="MainTabs" component={MainTabs} />
  <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
  {/* ... demais telas */}
</Drawer.Navigator>
```

### Hamburger nos tabs:
```typescript
// Em MainTabs, screenOptions.headerLeft:
headerLeft: () => (
  <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ marginLeft: 16 }}>
    <Ionicons name="menu" size={28} color={theme.colors.textPrimary} />
  </TouchableOpacity>
)
```

---

## Fase 6: Atualizar MembersScreen

O `MembersScreen` atualmente recebe `onGoBack` como prop e é renderizado condicionalmente dentro do SettingsScreen. Precisa ser atualizado para funcionar como tela de navegação:

**Editar**: `src/screens/workspace/MembersScreen.tsx`
- Aceitar `navigation` prop (ou usar `useNavigation()`)
- `onGoBack` → `navigation.goBack()`
- Registrar como tela no DrawerNavigator ou como modal no stack

---

## Fase 7: Deletar SettingsScreen

**Deletar**: `src/screens/SettingsScreen.tsx` (606 linhas)

Toda a funcionalidade já foi distribuída:
- Workspace info → WorkspaceSettingsScreen
- Tema → AppSettingsScreen
- Rendas → IncomesScreen
- Gastos fixos → FixedExpensesScreen
- Metas → SavingsGoalsScreen
- Config → AppSettingsScreen
- Sign out → CustomDrawerContent (rodapé)

---

## Fase 8: Invalidar queries ao trocar workspace

**Editar**: `src/contexts/WorkspaceContext.tsx`

Na função `setActiveWorkspace`, após salvar o novo workspace, invalidar todas as queries exceto `user_workspaces`:

```typescript
// Importar queryClient ou usar useQueryClient
// Ao trocar workspace: queryClient.invalidateQueries()
```

Isso garante que os dados financeiros sejam re-fetched do workspace correto.

---

## Arquivos Criados (9)

| Arquivo | Descrição |
|---------|-----------|
| `src/screens/profile/ProfileScreen.tsx` | Perfil do usuário |
| `src/screens/financial/IncomesScreen.tsx` | CRUD de rendas |
| `src/screens/financial/FixedExpensesScreen.tsx` | CRUD de gastos fixos |
| `src/screens/financial/SavingsGoalsScreen.tsx` | CRUD de metas + depósito |
| `src/screens/settings/AppSettingsScreen.tsx` | Tema + config |
| `src/screens/workspace/WorkspaceSettingsScreen.tsx` | Info + sair do workspace |
| `src/screens/workspace/WorkspaceManagementScreen.tsx` | Listar/trocar workspaces |
| `src/components/CustomDrawerContent.tsx` | Conteúdo do drawer |
| `src/hooks/useUserWorkspaces.ts` | Hook para listar workspaces do user |

## Arquivos Editados (3)

| Arquivo | Mudança |
|---------|---------|
| `App.tsx` | DrawerNavigator, remove tab Config, hamburger button |
| `src/screens/workspace/MembersScreen.tsx` | Adaptar para navegação (não mais condicional) |
| `babel.config.js` | Adicionar plugin reanimated |

## Arquivos Deletados (1)

| Arquivo | Motivo |
|---------|--------|
| `src/screens/SettingsScreen.tsx` | Funcionalidade distribuída nas novas telas |

---

## O que NÃO muda

- HomeScreen, DashboardScreen, HistoryScreen — intactos
- Todos os hooks React Query — intactos
- Todos os hooks de mutação — intactos
- AuthContext, WorkspaceContext — intactos (minor edit no WS para invalidação)
- Schemas, tipos, formatters — intactos
- Theme system — intacto, continua StyleSheet.create()
- API service, Supabase client — intactos
- Auth flow (Login/Register) — intacto
- WorkspaceScreen (seleção inicial) — intacto

---

## Verificação

- [ ] Drawer abre pelo hamburger e swipe
- [ ] Perfil mostra dados do usuário corretos
- [ ] Trocar workspace no WorkspaceManagementScreen atualiza todos os dados
- [ ] Listar todos os workspaces do usuário
- [ ] CRUD rendas funciona na IncomesScreen
- [ ] CRUD gastos fixos funciona na FixedExpensesScreen
- [ ] CRUD metas + depósito funciona na SavingsGoalsScreen
- [ ] Tema claro/escuro/auto funciona na AppSettingsScreen
- [ ] Config teto gastos variáveis salva
- [ ] Info workspace + gerenciar membros funciona
- [ ] Sair do workspace redireciona para WorkspaceScreen
- [ ] Sign out pelo drawer funciona
- [ ] Back button (Android) funciona em todas as telas
- [ ] Tabs (Home, Dashboard, Histórico) continuam funcionando
- [ ] Pull-to-refresh funciona nas telas financeiras
