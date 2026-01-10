# 🔄 Guia de Migração - Arquitetura Melhorada

## Fase 1: Componentes UI ✅ COMPLETO

### O que foi feito:
- ✅ Criados componentes base: `Button`, `Input`, `Card`
- ✅ Organizadas constantes em `/src/constants/`
- ✅ Melhorados utilitários em `/src/utils/formatters.ts`
- ✅ Atualizado `CategorySelector` com ícones e cores

### Como usar os novos componentes:

#### Button
```tsx
import { Button } from '@/shared/ui';

<Button
  title="Confirmar"
  onPress={handleSubmit}
  variant="primary"  // primary | secondary | danger | success
  size="medium"      // small | medium | large
  loading={isLoading}
  fullWidth
/>
```

#### Input
```tsx
import { Input } from '@/shared/ui';

<Input
  label="Descrição"
  value={description}
  onChangeText={setDescription}
  error={errors.description?.message}
  required
  placeholder="Ex: Supermercado"
/>
```

#### Card
```tsx
import { Card } from '@/shared/ui';

<Card variant="elevated">
  <Text>Conteúdo do card</Text>
</Card>
```

## Fase 2: React Hook Form + Zod ✅ COMPLETO

### TransactionForm migrado:
```tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionSchema, TransactionFormData } from '@/schemas';

const { control, handleSubmit, formState: { errors } } = useForm<TransactionFormData>({
  resolver: zodResolver(transactionSchema),
  defaultValues: { /* ... */ },
});
```

### Próximos formulários para migrar:
1. ⏳ SettingsScreen - Gastos Fixos
2. ⏳ SettingsScreen - Rendas
3. ⏳ SettingsScreen - Metas
4. ⏳ SettingsScreen - Configurações

## Fase 3: Migração de Componentes (Próximo)

### Componentes para atualizar:

#### 1. Toast → Usar componente compartilhado
```tsx
// Antes
<Toast message={toast.message} type={toast.type} visible={toast.visible} />

// Depois (mover para /src/shared/ui/Toast/)
import { Toast } from '@/shared/ui';
```

#### 2. ProgressBar → Padronizar
```tsx
// Mover para /src/shared/ui/ProgressBar/
// Adicionar variantes e melhorar API
```

#### 3. UserSelector → Simplificar
```tsx
// Mover para /src/features/user/components/
// Usar constantes RESPONSAVEIS
```

## Fase 4: Organização por Features (Futuro)

### Estrutura proposta:

```
src/features/
├── transactions/
│   ├── components/
│   │   ├── TransactionForm/
│   │   ├── TransactionList/
│   │   └── TransactionItem/
│   ├── hooks/
│   │   └── useTransactions.ts
│   ├── schemas/
│   │   └── transaction.schema.ts
│   └── api/
│       └── transactions.api.ts
│
├── budget/
│   ├── components/
│   │   ├── SummaryCard/
│   │   └── BudgetChart/
│   └── hooks/
│       └── useBudget.ts
│
└── settings/
    ├── components/
    │   ├── FixedExpenseForm/
    │   ├── IncomeForm/
    │   └── GoalForm/
    └── schemas/
        └── settings.schema.ts
```

### Passos para migração:

1. **Criar estrutura de pastas**
```bash
mkdir -p src/features/{transactions,budget,settings}/{components,hooks,schemas,api}
```

2. **Mover componentes relacionados**
```bash
# Exemplo: TransactionForm
mv src/components/TransactionForm.tsx src/features/transactions/components/TransactionForm/
mv src/schemas/index.ts src/features/transactions/schemas/transaction.schema.ts
```

3. **Atualizar imports**
```tsx
// Antes
import { TransactionForm } from '../components/TransactionForm';

// Depois
import { TransactionForm } from '@/features/transactions/components';
```

4. **Configurar path aliases no tsconfig.json**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/theme": ["./src/theme"]
    }
  }
}
```

## Fase 5: Testes (Futuro)

### Setup de testes:
```bash
npm install --save-dev @testing-library/react-native jest
```

### Estrutura de testes:
```
src/shared/ui/Button/
├── Button.tsx
├── Button.test.tsx
└── index.ts
```

### Exemplo de teste:
```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('should call onPress when clicked', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Click me" onPress={onPress} />);
    
    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

## Checklist de Migração

### Componentes UI
- [x] Button
- [x] Input
- [x] Card
- [ ] Toast
- [ ] ProgressBar
- [ ] Modal
- [ ] Badge
- [ ] Chip

### Formulários com React Hook Form
- [x] TransactionForm
- [ ] FixedExpenseForm
- [ ] IncomeForm
- [ ] GoalForm
- [ ] ConfigForm

### Constantes
- [x] CATEGORIES
- [x] CATEGORY_ICONS
- [x] CATEGORY_COLORS
- [x] PAYMENT_METHODS
- [x] RESPONSAVEIS
- [x] MESES

### Utilitários
- [x] formatCurrency
- [x] formatPercentage
- [x] formatDate
- [x] parseCurrency
- [x] formatCurrencyInput
- [ ] validateEmail
- [ ] validateCPF
- [ ] debounce
- [ ] throttle

### Hooks Customizados
- [ ] useDebounce
- [ ] useThrottle
- [ ] useLocalStorage
- [ ] useAsync
- [ ] useToggle

## Comandos Úteis

### Criar novo componente UI:
```bash
mkdir -p src/shared/ui/ComponentName
touch src/shared/ui/ComponentName/{ComponentName.tsx,index.ts}
```

### Criar nova feature:
```bash
mkdir -p src/features/feature-name/{components,hooks,schemas,api}
```

### Rodar testes:
```bash
npm test
npm test -- --watch
npm test -- --coverage
```

### Build:
```bash
npm run build
eas build --profile preview
```

## Dicas de Migração

1. **Migre incrementalmente**: Não tente migrar tudo de uma vez
2. **Teste após cada mudança**: Garanta que tudo funciona antes de continuar
3. **Mantenha backward compatibility**: Não quebre código existente
4. **Use aliases de importação**: Facilita refatoração futura
5. **Documente mudanças**: Atualize README e comentários

## Problemas Comuns

### Erro: "Cannot find module '@/shared/ui'"
**Solução**: Configure path aliases no `tsconfig.json` e `babel.config.js`

### Erro: "Hooks can only be called inside the body of a function component"
**Solução**: Certifique-se de que hooks estão sendo usados dentro de componentes

### Erro: "Invalid hook call"
**Solução**: Verifique se há múltiplas versões do React instaladas

## Recursos

- [React Hook Form Docs](https://react-hook-form.com/)
- [Zod Docs](https://zod.dev/)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [React Native Best Practices](https://reactnative.dev/docs/performance)
