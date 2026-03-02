import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HappyDog from '../../../assets/animations/Happy Dog.json';
import { Toast } from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { LoginFormData, loginSchema } from '../../schemas';
import { useTheme } from '../../theme';

interface Props {
  onNavigateRegister: () => void;
  prefilledEmail?: string;
}

export const LoginScreen: React.FC<Props> = ({ onNavigateRegister, prefilledEmail }) => {
  const { isDark } = useTheme();
  const { signIn, resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false, message: '', type: 'info',
  });

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (prefilledEmail) {
      setValue('email', prefilledEmail);
    }
  }, [prefilledEmail, setValue]);

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    const { error } = await signIn(data.email.trim().toLowerCase(), data.password);
    setLoading(false);
    if (error) {
      setToast({ visible: true, message: error, type: 'error' });
    }
  };

  const handleForgotPassword = async () => {
    const email = forgotEmail.trim().toLowerCase();
    if (!email) {
      setToast({ visible: true, message: 'Digite seu email', type: 'error' });
      return;
    }
    setForgotLoading(true);
    const { error } = await resetPassword(email);
    setForgotLoading(false);
    if (error) {
      setToast({ visible: true, message: error, type: 'error' });
    } else {
      setToast({ visible: true, message: 'Email de recuperação enviado! Verifique sua caixa de entrada.', type: 'success' });
      setShowForgot(false);
      setForgotEmail('');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={() => setToast(t => ({ ...t, visible: false }))} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerClassName="grow justify-center p-6" keyboardShouldPersistTaps="handled">
          <View className="items-center mb-8">
            <View style={{ width: 380, height: 200 }}>
              <LottieView
                source={HappyDog}
                autoPlay
                loop
                style={{ width: '100%', height: '100%' }}
              />
            </View>
            <Text className="text-4xl font-extrabold mt-2 text-gray-900 dark:text-slate-100">Finanças Pro</Text>
            <Text className="text-base mt-2 text-center text-gray-600 dark:text-slate-400">
              Gerencie suas finanças em equipe ou sozinho
            </Text>
          </View>

          <View className="rounded-2xl p-6 border bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <Text className="text-xl font-bold mb-5 text-center text-gray-900 dark:text-slate-100">Entrar</Text>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className={`border rounded-xl p-3.5 text-base mb-3 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${errors.email ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'}`}
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
                    className={`border rounded-xl p-3.5 pr-12 text-base mb-3 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${errors.password ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'}`}
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
            {errors.password && <Text className="text-red-500 text-xs -mt-1 mb-2 ml-1">{errors.password.message}</Text>}

            <TouchableOpacity onPress={() => { setForgotEmail(''); setShowForgot(true); }} className="self-end mb-3">
              <Text className="text-sm font-semibold text-blue-500 dark:text-blue-400">Esqueci minha senha</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`rounded-xl py-4 items-center mt-2 bg-blue-500 dark:bg-blue-600 ${loading ? 'opacity-60' : ''}`}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-bold">Entrar</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={onNavigateRegister} className="mt-4 items-center">
              <Text className="text-base font-semibold text-blue-500 dark:text-blue-400">Criar conta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal visible={showForgot} transparent animationType="fade" onRequestClose={() => setShowForgot(false)}>
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="w-full max-w-md rounded-2xl p-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
                <Ionicons name="lock-open" size={32} color={isDark ? '#60a5fa' : '#3b82f6'} />
              </View>
            </View>
            <Text className="text-xl font-bold text-center mb-2 text-gray-900 dark:text-slate-100">
              Recuperar Senha
            </Text>
            <Text className="text-sm text-center mb-4 text-gray-500 dark:text-slate-400">
              Digite seu email e enviaremos um link para redefinir sua senha.
            </Text>
            <TextInput
              className="border rounded-xl p-3.5 text-base mb-4 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-600"
              placeholder="Seu email"
              placeholderTextColor="#9ca3af"
              value={forgotEmail}
              onChangeText={setForgotEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              className={`rounded-xl py-3.5 items-center bg-blue-500 dark:bg-blue-600 ${forgotLoading ? 'opacity-60' : ''}`}
              onPress={handleForgotPassword}
              disabled={forgotLoading}
            >
              {forgotLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-base font-bold">Enviar Email</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowForgot(false)} className="mt-3 py-2 items-center">
              <Text className="text-sm font-semibold text-gray-500 dark:text-slate-400">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
