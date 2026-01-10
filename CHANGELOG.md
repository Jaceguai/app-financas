# 📝 Changelog - Finanças App

## [2.0.0] - 2026-01-10

### ✨ Adicionado

#### Componentes UI Compartilhados (`/src/shared/ui/`)
- **Button** - Botão reutilizável com 4 variantes e 3 tamanhos
  - Variantes: primary, secondary, danger, success
  - Tamanhos: small, medium, large
  - Estados: loading, disabled
  - Suporte a fullWidth

- **Input** - Input com validação integrada
  - Label opcional
  - Mensagens de erro
  - Campo obrigatório (asterisco)
  - Feedback visual de erro (borda vermelha)

- **Card** - Container com 3 variantes
  - default: sombra padrão
  - elevated: sombra elevada
  - outlined: apenas borda

- **ProgressBar** - Barra de progresso melhorada
  - Suporte a current/total ou progress (0-1)
  - Labels personalizáveis
  - Altura configurável
  - Indicador de orçamento excedido
  - Cores dinâmicas

- **Toast** - Notificações aprimoradas
  - 4 tipos: success, error, info, warning
  - Ícones Ionicons
  - Animações suaves (fade + slide)
  - Posição configurável (top/bottom)
  - Duração personalizável

#### Validação com React Hook Form + Zod
- Schemas de validação para todos os formulários
- TransactionForm migrado para React Hook Form
- Validação type-safe com TypeScript
- Mensagens de erro em português

#### Constantes Organizadas (`/src/constants/`)
- **CATEGORIES** - 9 categorias de gastos
- **CATEGORY_ICONS** - Ícones Ionicons para cada categoria
- **CATEGORY_COLORS** - Cores personalizadas por categoria
- **PAYMENT_METHODS** - Débito/Crédito tipados
- **RESPONSAVEIS** - A/B/Ambos com labels
- **MESES** - Array de meses tipado

#### Utilitários Melhorados (`/src/utils/formatters.ts`)
- `formatCurrency()` - Formata valores monetários
- `formatPercentage()` - Formata percentuais
- `formatDate()` - Formata datas (dd/mm/yyyy)
- `formatDateTime()` - Formata data + hora
- `parseCurrency()` - Parse string → número
- `formatCurrencyInput()` - Formata durante digitação

### 🎨 Melhorado

#### CategorySelector
- Adicionados ícones coloridos para cada categoria
- Cores dinâmicas baseadas em constantes
- Design melhorado com sombras e bordas
- Scroll horizontal mais suave
- Feedback visual ao selecionar

#### Toast
- Animações mais suaves
- Ícones para cada tipo
- Melhor posicionamento
- Sombras mais pronunciadas

#### ProgressBar
- API mais flexível
- Melhor feedback visual
- Suporte a labels customizados

### 📚 Documentação

- **PROJECT_STRUCTURE.md** - Arquitetura Feature-Sliced Design
- **IMPROVEMENTS.md** - Lista completa de melhorias
- **MIGRATION_GUIDE.md** - Guia de migração passo a passo
- **README.md** - Documentação principal atualizada
- **CHANGELOG.md** - Este arquivo

### 🔧 Técnico

- Removidas referências ao Tailwind (não usado)
- Melhor organização de imports
- Type-safety aprimorado
- Código mais limpo e manutenível
- Componentes mais reutilizáveis

### 🐛 Corrigido

- Scroll duplo na HomeScreen
- Layout quebrando ao abrir teclado
- Valores de Lazer não aparecendo no gráfico
- Cache desatualizado no APK

---

## [1.0.0] - 2026-01-01

### Funcionalidades Iniciais

- Registro de transações (débito/crédito)
- Categorização de gastos
- Orçamento de lazer
- Gastos fixos mensais
- Metas de poupança
- Dashboard com gráficos
- Histórico de transações
- Sincronização com Google Drive
- Tema claro/escuro
- Pull-to-refresh
- Ocultação de valores (privacidade)

---

## 📋 Próximas Versões

### [2.1.0] - Planejado
- [ ] Migrar todos os formulários para React Hook Form
- [ ] Implementar testes unitários
- [ ] Adicionar Storybook
- [ ] Melhorar performance com React.memo

### [3.0.0] - Futuro
- [ ] Migrar para Feature-Sliced Design completo
- [ ] Adicionar internacionalização (i18n)
- [ ] Implementar analytics
- [ ] Adicionar notificações push
- [ ] Exportação de relatórios (PDF/CSV)

---

**Legenda:**
- ✨ Adicionado
- 🎨 Melhorado
- 🐛 Corrigido
- 🔧 Técnico
- 📚 Documentação
- ⚠️ Depreciado
- 🗑️ Removido
