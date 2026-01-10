import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../../theme';

interface ProgressBarProps {
  current?: number;
  total?: number;
  progress?: number; // 0-1 range
  color?: string;
  showLabels?: boolean;
  height?: number;
  animated?: boolean;
  style?: ViewStyle;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  current, 
  total, 
  progress,
  color,
  showLabels = true,
  height = 12,
  animated = false,
  style,
  label,
}) => {
  const { theme } = useTheme();

  // Calculate percentage based on which props are provided
  let percentageCalc: number;
  let safeCurrent: number;
  let safeTotal: number;
  
  if (progress !== undefined) {
    percentageCalc = progress * 100;
    safeCurrent = 0;
    safeTotal = 0;
  } else {
    safeCurrent = Number(current) || 0;
    safeTotal = Number(total) || 0;
    percentageCalc = safeTotal > 0 ? (safeCurrent / safeTotal) * 100 : 0;
  }
  
  const visualPercentage = Math.min(percentageCalc, 100);
  const isOverBudget = percentageCalc > 100;
  
  // Determine fill color
  const fillColor = color || (isOverBudget ? theme.colors.error : theme.colors.secondary);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {label}
        </Text>
      )}
      
      {showLabels && current !== undefined && total !== undefined && (
        <View style={styles.labelsRow}>
          <Text style={[styles.valueText, { color: theme.colors.textSecondary }]}>
            R$ {safeCurrent.toFixed(2)} / R$ {safeTotal.toFixed(2)}
          </Text>
          <Text style={[
            styles.percentage, 
            { color: isOverBudget ? theme.colors.error : theme.colors.success }
          ]}>
            {percentageCalc.toFixed(1)}%
          </Text>
        </View>
      )}
      
      <View style={[
        styles.progressBar, 
        { 
          backgroundColor: theme.colors.borderLight,
          height 
        }
      ]}>
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${visualPercentage}%`,
              backgroundColor: fillColor,
              height
            }
          ]} 
        />
      </View>
      
      {isOverBudget && showLabels && (
        <Text style={[styles.warningText, { color: theme.colors.error }]}>
          ⚠️ Orçamento excedido!
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    width: '100%' 
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  labelsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 8 
  },
  valueText: { 
    fontSize: 14 
  },
  percentage: { 
    fontSize: 14, 
    fontWeight: '700' 
  },
  progressBar: { 
    borderRadius: 999, 
    overflow: 'hidden', 
    width: '100%',
    backgroundColor: '#e5e7eb',
  },
  progressFill: { 
    borderRadius: 999,
  },
  warningText: { 
    fontSize: 12, 
    marginTop: 6, 
    fontWeight: '700' 
  },
});
