# 💰 Finanças App

Aplicativo de controle financeiro pessoal desenvolvido com React Native e Expo.

## 🚀 Tecnologias

- **React Native** + **Expo** - Framework mobile
- **TypeScript** - Type safety
- **React Hook Form** + **Zod** - Validação de formulários
- **Zustand** - Gerenciamento de estado
- **React Query** - Cache e sincronização de dados
- **React Navigation** - Navegação
- **Google Sheets API** - Backend/Database

## 📱 Funcionalidades

### ✅ Implementadas
- [x] Registro de transações (débito/crédito)
- [x] Categorização de gastos com ícones
- [x] Orçamento de lazer
- [x] Gastos fixos mensais
- [x] Metas de poupança
- [x] Dashboard com gráficos
- [x] Histórico de transações
- [x] Sincronização com Google Drive
- [x] Tema claro/escuro
- [x] Pull-to-refresh
- [x] Ocultação de valores (privacidade)

### 🔄 Em Desenvolvimento
- [ ] Relatórios mensais
- [ ] Exportação de dados (PDF/CSV)
- [ ] Notificações de gastos
- [ ] Múltiplas contas bancárias
- [ ] Compartilhamento familiar

## 🏗️ Arquitetura

```
src/
├── components/        # Componentes reutilizáveis
├── constants/        # Constantes (categorias, etc)
├── hooks/           # Hooks customizados
├── schemas/         # Validações Zod
├── screens/         # Telas da aplicação
├── services/        # API e serviços externos
├── store/          # Estado global (Zustand)
├── theme/          # Sistema de temas
├── types/          # Tipos TypeScript
└── utils/          # Utilitários e helpers
```

## 🎨 Design System

### Componentes UI
- **Toast**: Notificações
- **ProgressBar**: Barra de progresso
- **CategorySelector**: Seletor de categorias com ícones

### Cores
```typescript
Primary: #3b82f6    // Azul
Secondary: #10b981  // Verde
Accent: #f59e0b     // Laranja
Error: #ef4444      // Vermelho
Success: #10b981    // Verde
```

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Rodar no iOS
npm run ios

# Rodar no Android
npm run android

# Rodar no web
npm run web
```

## 🔧 Configuração

### 1. Google Sheets API
1. Criar projeto no Google Cloud Console
2. Ativar Google Sheets API
3. Criar credenciais (API Key)
4. Configurar planilha com as abas:
   - `transacoes`
   - `fixos`
   - `metas`
   - `rendas`
   - `config`

### 2. Variáveis de Ambiente
```bash
# .env
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## 🧪 Testes

```bash
# Rodar todos os testes
npm test

# Rodar em modo watch
npm test -- --watch

# Gerar coverage
npm test -- --coverage
```

## 📱 Build

### Development
```bash
# Build de desenvolvimento
eas build --profile development --platform android
```

### Preview
```bash
# Build de preview (APK)
eas build --profile preview --platform android
```

### Production
```bash
# Build de produção
eas build --profile production --platform android
eas build --profile production --platform ios
```

## 📚 Documentação

- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Estrutura do projeto
- [IMPROVEMENTS.md](./IMPROVEMENTS.md) - Melhorias implementadas
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Guia de migração

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Convenções de Código

- **Componentes**: PascalCase (ex: `TransactionForm.tsx`)
- **Hooks**: camelCase com `use` (ex: `useTransactions.ts`)
- **Utilitários**: camelCase (ex: `formatCurrency.ts`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `CATEGORIES`)

## 📝 Licença

Este projeto é privado e de uso pessoal.

## 👨‍💻 Autor

Desenvolvido com ❤️ para controle financeiro familiar.

## 🐛 Reportar Bugs

Encontrou um bug? Abra uma issue descrevendo:
- Passos para reproduzir
- Comportamento esperado
- Comportamento atual
- Screenshots (se aplicável)
- Versão do app

## 💡 Sugestões

Tem uma ideia? Compartilhe abrindo uma issue com a tag `enhancement`.

## 📊 Status do Projeto

![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey.svg)

---

**Última atualização**: Janeiro 2026
