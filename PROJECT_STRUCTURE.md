# 📁 Estrutura do Projeto - Finanças App

## Arquitetura: Feature-Sliced Design (Adaptado)

```
src/
├── app/                    # Configuração global da aplicação
│   ├── navigation/        # Navegação e rotas
│   └── providers/         # Providers globais (Theme, Query, etc)
│
├── features/              # Features da aplicação (lógica de negócio)
│   ├── transactions/      # Gerenciamento de transações
│   │   ├── components/   # Componentes específicos
│   │   ├── hooks/        # Hooks customizados
│   │   ├── schemas/      # Validações Zod
│   │   └── api/          # Chamadas API
│   │
│   ├── budget/           # Orçamento e metas
│   ├── settings/         # Configurações
│   └── dashboard/        # Dashboard e relatórios
│
├── entities/             # Entidades de negócio
│   ├── transaction/      # Modelo de transação
│   ├── user/            # Modelo de usuário
│   └── category/        # Modelo de categoria
│
├── shared/              # Código compartilhado
│   ├── ui/             # Componentes UI reutilizáveis
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   └── Toast/
│   │
│   ├── lib/            # Utilitários e helpers
│   │   ├── formatters/
│   │   ├── validators/
│   │   └── constants/
│   │
│   ├── api/            # Configuração base da API
│   ├── hooks/          # Hooks globais
│   └── types/          # Tipos TypeScript globais
│
└── theme/              # Sistema de temas
    ├── colors.ts
    ├── spacing.ts
    ├── typography.ts
    └── index.ts
```

## Princípios

1. **Separação de Responsabilidades**: Cada pasta tem um propósito claro
2. **Escalabilidade**: Fácil adicionar novas features
3. **Reutilização**: Componentes compartilhados em `shared/ui`
4. **Type-Safety**: TypeScript em todo o projeto
5. **Validação**: Zod para todos os formulários
6. **Estado**: Zustand para estado global

## Convenções

- **Componentes**: PascalCase (ex: `TransactionForm.tsx`)
- **Hooks**: camelCase com prefixo `use` (ex: `useTransactions.ts`)
- **Utilitários**: camelCase (ex: `formatCurrency.ts`)
- **Tipos**: PascalCase com sufixo `Type` ou `Interface`
- **Constantes**: UPPER_SNAKE_CASE
