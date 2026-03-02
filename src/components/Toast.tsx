import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  visible: boolean;
  onHide: () => void;
  duration?: number;
  position?: 'top' | 'bottom';
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  visible,
  onHide,
  duration = 3000,
  position = 'top'
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(position === 'top' ? -20 : 20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(translateY, {
            toValue: position === 'top' ? -20 : 20,
            duration: 200,
            useNativeDriver: true
          }),
        ]).start(() => onHide());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide, opacity, translateY, position]);

  if (!visible) return null;

  const getToastIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle' as const;
      case 'error':
        return 'close-circle' as const;
      case 'warning':
        return 'warning' as const;
      default:
        return 'information-circle' as const;
    }
  };

  const getToastColorClass = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-amber-500';
      default:
        return 'bg-blue-500';
    }
  };

  const icon = getToastIcon();
  const colorClass = getToastColorClass();

  return (
    <Animated.View
      className={`absolute left-4 right-4 p-4 rounded-xl z-50 flex-row items-center shadow-lg ${colorClass}`}
      style={{
        opacity,
        transform: [{ translateY }],
        [position]: 50,
      }}
    >
      <Ionicons name={icon} size={20} color="#fff" className="mr-3" />
      <Text className="text-white text-sm font-semibold flex-1">{message}</Text>
    </Animated.View>
  );
};
