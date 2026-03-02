import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';
import { getIconColor } from '../utils/iconColors';

interface EmailConfirmationModalProps {
  visible: boolean;
  email: string;
  onResendEmail: () => Promise<void>;
  onConfirmed: () => void;
  onClose: () => void;
}

export const EmailConfirmationModal: React.FC<EmailConfirmationModalProps> = ({
  visible,
  email,
  onResendEmail,
  onConfirmed,
  onClose,
}) => {
  const { isDark } = useTheme();
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (visible && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [visible, countdown]);

  const handleResend = async () => {
    setResending(true);
    try {
      await onResendEmail();
      setCountdown(60);
      setCanResend(false);
    } catch {
      // Silently handle resend failure
    } finally {
      setResending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className="w-full max-w-md rounded-2xl p-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          {/* Ícone */}
          <View className="items-center mb-4">
            <View className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
              <Ionicons name="mail" size={40} color={getIconColor('primary', isDark)} />
            </View>
          </View>

          {/* Título */}
          <Text className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-slate-100">
            Confirme seu Email
          </Text>

          {/* Mensagem */}
          <Text className="text-base text-center mb-4 text-gray-600 dark:text-slate-400">
            Enviamos um email de confirmação para:
          </Text>
          <Text className="text-base font-semibold text-center mb-6 text-blue-500 dark:text-blue-400">
            {email}
          </Text>

          <Text className="text-sm text-center mb-6 text-gray-500 dark:text-slate-500">
            Verifique sua caixa de entrada e clique no link de confirmação.
          </Text>

          {/* Botão de Reenviar */}
          <TouchableOpacity
            className={`rounded-xl py-3 items-center mb-3 border ${
              canResend && !resending
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400'
                : 'bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600'
            }`}
            onPress={handleResend}
            disabled={!canResend || resending}
          >
            {resending ? (
              <ActivityIndicator color={isDark ? '#60a5fa' : '#3b82f6'} />
            ) : (
              <View className="flex-row items-center gap-2">
                <Ionicons
                  name="refresh"
                  size={20}
                  color={canResend ? (isDark ? '#60a5fa' : '#3b82f6') : (isDark ? '#64748b' : '#9ca3af')}
                />
                <Text className={`text-base font-semibold ${
                  canResend
                    ? 'text-blue-500 dark:text-blue-400'
                    : 'text-gray-400 dark:text-slate-500'
                }`}>
                  {canResend ? 'Reenviar Email' : `Reenviar em ${countdown}s`}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Pergunta de Confirmação */}
          <View className="mt-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <Text className="text-sm font-semibold text-center mb-3 text-gray-900 dark:text-slate-100">
              Já confirmou seu email?
            </Text>
            <TouchableOpacity
              className="rounded-xl py-3 items-center bg-green-500 dark:bg-green-600"
              onPress={onConfirmed}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text className="text-white text-base font-bold">
                  Sim, ir para Login
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Botão Fechar */}
          <TouchableOpacity
            className="mt-4 py-2 items-center"
            onPress={onClose}
          >
            <Text className="text-sm font-semibold text-gray-500 dark:text-slate-400">
              Fechar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
