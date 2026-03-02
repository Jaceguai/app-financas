import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import LottieView from 'lottie-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView,
    Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HappyDog from '../../../assets/animations/Happy Dog.json';
import { EmailConfirmationModal } from '../../components/EmailConfirmationModal';
import { Toast } from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { RegisterFormData, registerSchema } from '../../schemas';
import { useTheme } from '../../theme';

interface Props {
  onNavigateLogin: (email?: string) => void;
}

export const RegisterScreen: React.FC<Props> = ({ onNavigateLogin }) => {
  const { isDark } = useTheme();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false, message: '', type: 'info',
  });

  const { control, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
  });

  const passwordValue = watch('password');
  const getPasswordStrength = (pwd: string): { label: string; color: string; width: string } => {
    if (!pwd || pwd.length === 0) return { label: '', color: '', width: '0%' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: 'Fraca', color: '#ef4444', width: '20%' };
    if (score === 2) return { label: 'Fraca', color: '#f97316', width: '40%' };
    if (score === 3) return { label: 'Média', color: '#eab308', width: '60%' };
    if (score === 4) return { label: 'Boa', color: '#22c55e', width: '80%' };
    return { label: 'Forte', color: '#10b981', width: '100%' };
  };
  const strength = getPasswordStrength(passwordValue);

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    const email = data.email.trim().toLowerCase();
    const { error } = await signUp(email, data.password, data.displayName.trim());
    setLoading(false);
    if (error) {
      setToast({ visible: true, message: error, type: 'error' });
    } else {
      setRegisteredEmail(email);
      setShowConfirmModal(true);
    }
  };

  const handleResendEmail = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: registeredEmail,
      });

      if (error) throw error;
      setToast({ visible: true, message: 'Email reenviado com sucesso!', type: 'success' });
    } catch (error: any) {
      setToast({ visible: true, message: error.message || 'Erro ao reenviar email', type: 'error' });
      throw error;
    }
  };

  const handleEmailConfirmed = () => {
    setShowConfirmModal(false);
    onNavigateLogin(registeredEmail);
  };

  const inputClass = (hasError: boolean) =>
    `border rounded-xl p-3.5 text-base mb-3 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${hasError ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'}`;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={() => setToast(t => ({ ...t, visible: false }))} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerClassName="grow justify-center p-6" keyboardShouldPersistTaps="handled">
          <View className="items-center mb-6">
            <View style={{ width: 380, height: 160 }}>
              <LottieView
                source={HappyDog}
                autoPlay
                loop
                style={{ width: '100%', height: '100%' }}
              />
            </View>
            <Text className="text-3xl font-extrabold mt-2 text-gray-900 dark:text-slate-100">Criar Conta</Text>
            <Text className="text-sm mt-1 text-center text-gray-600 dark:text-slate-400">
              Junte-se ao Finanças Pro
            </Text>
          </View>

          <View className="rounded-2xl p-6 border bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <Controller
              control={control}
              name="displayName"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className={inputClass(!!errors.displayName)}
                  placeholder="Seu nome"
                  placeholderTextColor="#9ca3af"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="words"
                />
              )}
            />
            {errors.displayName && <Text className="text-red-500 text-xs -mt-1 mb-2 ml-1">{errors.displayName.message}</Text>}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className={inputClass(!!errors.email)}
                  placeholder="Email"
                  placeholderTextColor="#9ca3af"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            />
            {errors.email && <Text className="text-red-500 text-xs -mt-1 mb-2 ml-1">{errors.email.message}</Text>}

            <View>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    className={`${inputClass(!!errors.password)} pr-12`}
                    placeholder="Senha"
                    placeholderTextColor="#9ca3af"
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={!showPassword}
                  />
                )}
              />
              <TouchableOpacity
                className="absolute right-3 top-3.5"
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            {passwordValue?.length > 0 && (
              <View className="-mt-1 mb-2 ml-1">
                <View className="h-1.5 rounded-full bg-gray-200 dark:bg-slate-600 overflow-hidden">
                  <View style={{ width: strength.width as any, backgroundColor: strength.color, height: '100%', borderRadius: 999 }} />
                </View>
                <Text style={{ color: strength.color }} className="text-xs mt-1">
                  Senha {strength.label}
                </Text>
              </View>
            )}
            {errors.password && <Text className="text-red-500 text-xs -mt-1 mb-2 ml-1">{errors.password.message}</Text>}

            <View>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    className={`${inputClass(!!errors.confirmPassword)} pr-12`}
                    placeholder="Confirmar Senha"
                    placeholderTextColor="#9ca3af"
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={!showConfirmPassword}
                  />
                )}
              />
              <TouchableOpacity
                className="absolute right-3 top-3.5"
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text className="text-red-500 text-xs -mt-1 mb-2 ml-1">{errors.confirmPassword.message}</Text>}

            <TouchableOpacity
              className={`rounded-xl py-4 items-center mt-2 bg-blue-500 dark:bg-blue-600 ${loading ? 'opacity-60' : ''}`}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-bold">Criar Conta</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onNavigateLogin()} className="mt-4 items-center">
              <Text className="text-base font-semibold text-blue-500 dark:text-blue-400">Já tenho conta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <EmailConfirmationModal
        visible={showConfirmModal}
        email={registeredEmail}
        onResendEmail={handleResendEmail}
        onConfirmed={handleEmailConfirmed}
        onClose={() => setShowConfirmModal(false)}
      />
    </SafeAreaView>
  );
};
