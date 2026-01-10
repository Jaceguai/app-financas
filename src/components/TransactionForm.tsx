import React, { useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '../theme';
import { CategorySelector } from './CategorySelector';
import { Toast } from './Toast';
import { useTransactions } from '../hooks/useTransactions';
import { useFinanceStore } from '../store/useFinanceStore';
import { transactionSchema, TransactionFormData } from '../schemas';

export const TransactionForm: React.FC = () => {
  const { theme } = useTheme();
  const currentUser = useFinanceStore((state) => state.currentUser);
  const { sendTransaction, isLoading, isSuccess, reset: resetTransaction, toast, hideToast } = useTransactions();

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      value: '',
      description: '',
      category: 'Alimentação',
      paymentMethod: 'debit',
    },
  });

  useEffect(() => {
    if (isSuccess) {
      reset();
      resetTransaction();
    }
  }, [isSuccess, reset, resetTransaction]);

  const formatCurrency = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    const amount = parseFloat(numbers) / 100;
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseValue = (formattedValue: string): number => parseFloat(formattedValue.replace(/\D/g, '')) / 100;

  const onSubmit = (data: TransactionFormData) => {
    const numericValue = parseValue(data.value);
    
    sendTransaction({ 
      description: data.description.trim(), 
      value: numericValue, 
      category: data.category, 
      user: currentUser,
      paymentMethod: data.paymentMethod 
    });
  };

  return (
    <>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
      
      {/* Valor */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Valor</Text>
        <Controller
          control={control}
          name="value"
          render={({ field: { onChange, value } }) => (
            <View style={[styles.inputCard, { backgroundColor: theme.colors.surface, borderColor: errors.value ? '#ef4444' : theme.colors.border }]}>
              <Text style={[styles.currency, { color: theme.colors.textTertiary }]}>R$</Text>
              <TextInput 
                style={[styles.valueInput, { color: theme.colors.primary }]} 
                value={value} 
                onChangeText={(text) => onChange(formatCurrency(text))} 
                keyboardType="numeric" 
                placeholder="0,00" 
                placeholderTextColor={theme.colors.inputPlaceholder} 
              />
            </View>
          )}
        />
        {errors.value && <Text style={styles.errorText}>{errors.value.message}</Text>}
      </View>

      {/* Forma de Pagamento */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Forma de Pagamento</Text>
        <Controller
          control={control}
          name="paymentMethod"
          render={({ field: { onChange, value } }) => (
            <View style={styles.paymentRow}>
              <TouchableOpacity 
                style={[
                  styles.paymentBtn, 
                  { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
                  value === 'debit' && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                ]} 
                onPress={() => onChange('debit')}
              >
                <Text style={[
                  styles.paymentText, 
                  { color: theme.colors.textSecondary },
                  value === 'debit' && { color: '#fff' }
                ]}>
                  Débito / Pix
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.paymentBtn, 
                  { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
                  value === 'credit' && { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }
                ]} 
                onPress={() => onChange('credit')}
              >
                <Text style={[
                  styles.paymentText, 
                  { color: theme.colors.textSecondary },
                  value === 'credit' && { color: '#fff' }
                ]}>
                  Crédito (Fatura)
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      {/* Descrição */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Descrição</Text>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <TextInput 
              style={[
                styles.descriptionInput, 
                { 
                  backgroundColor: theme.colors.surface, 
                  color: theme.colors.textPrimary,
                  borderColor: errors.description ? '#ef4444' : theme.colors.border
                }
              ]} 
              value={value} 
              onChangeText={onChange} 
              placeholder="Ex: Supermercado" 
              placeholderTextColor={theme.colors.inputPlaceholder} 
            />
          )}
        />
        {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}
      </View>

      {/* Categoria */}
      <Controller
        control={control}
        name="category"
        render={({ field: { onChange, value } }) => (
          <CategorySelector selectedCategory={value} onSelectCategory={onChange} />
        )}
      />

      {/* Botão de Envio */}
      <View style={styles.section}>
        <TouchableOpacity 
          onPress={handleSubmit(onSubmit)} 
          disabled={isLoading} 
          style={[
            styles.button, 
            { backgroundColor: theme.colors.primary },
            isLoading && { backgroundColor: theme.colors.textTertiary }
          ]}
        >
          {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Confirmar Gasto</Text>}
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  section: { marginHorizontal: 16, marginTop: 24 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  inputCard: { 
    borderRadius: 12, 
    padding: 16, 
    borderWidth: 1,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3 
  },
  currency: { fontSize: 14, marginBottom: 8 },
  valueInput: { fontSize: 32, fontWeight: 'bold' },
  descriptionInput: { 
    borderRadius: 12, 
    padding: 16, 
    fontSize: 16, 
    borderWidth: 1,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3 
  },
  button: { borderRadius: 12, paddingVertical: 16 },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  
  paymentRow: { flexDirection: 'row', gap: 12 },
  paymentBtn: { 
    flex: 1, 
    paddingVertical: 14, 
    borderRadius: 8, 
    alignItems: 'center',
    borderWidth: 1
  },
  paymentText: { fontSize: 14, fontWeight: '600' },
  errorText: { 
    color: '#ef4444', 
    fontSize: 12, 
    marginTop: 4,
    marginLeft: 4 
  },
});