import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

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
  const { theme } = useTheme();
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

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return { backgroundColor: '#10b981', icon: 'checkmark-circle' as const };
      case 'error':
        return { backgroundColor: '#ef4444', icon: 'close-circle' as const };
      case 'warning':
        return { backgroundColor: '#f59e0b', icon: 'warning' as const };
      default:
        return { backgroundColor: '#3b82f6', icon: 'information-circle' as const };
    }
  };

  const { backgroundColor, icon } = getToastConfig();

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor,
          opacity,
          transform: [{ translateY }],
          [position]: 50,
        }
      ]}
    >
      <Ionicons name={icon} size={20} color="#fff" style={styles.icon} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 12,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});