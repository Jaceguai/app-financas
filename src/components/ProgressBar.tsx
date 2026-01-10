import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface Props {
  // Support both interfaces for flexibility
  current?: number;
  total?: number;
  progress?: number; // 0-1 range
  color?: string;
  showLabels?: boolean;
}

export const ProgressBar: React.FC<Props> = ({ 
  current, 
  total, 
  progress,
  color,
  showLabels = true 
}) => {
  const { theme } = useTheme();

  // Calculate percentage based on which props are provided
  let percentageCalc: number;
  let safeCurrent: number;
  let safeTotal: number;
  
  if (progress !== undefined) {
    // Using progress prop (0-1 range)
    percentageCalc = progress * 100;
    safeCurrent = 0;
    safeTotal = 0;
  } else {
    // Using current/total props
    safeCurrent = Number(current) || 0;
    safeTotal = Number(total) || 0;
    percentageCalc = safeTotal > 0 ? (safeCurrent / safeTotal) * 100 : 0;
  }
  
  const visualPercentage = Math.min(percentageCalc, 100);
  const isOverBudget = percentageCalc > 100;
  
  // Determine fill color
  const fillColor = color || (isOverBudget ? theme.colors.error : theme.colors.secondary);

  return (
    <View style={styles.container}>
      {showLabels && current !== undefined && total !== undefined && (
        <View style={styles.labelsRow}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
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
      
      <View style={[styles.progressBar, { backgroundColor: theme.colors.borderLight }]}>
        <View 
          style={[
            styles.progressFill, 
            { 
              flex: visualPercentage / 100 || 0,
              backgroundColor: fillColor
            }
          ]} 
        />
      </View>
      
      {isOverBudget && showLabels && (
        <Text style={[styles.warningText, { color: theme.colors.error }]}>
          Orçamento excedido!
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%' },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 14 },
  percentage: { fontSize: 14, fontWeight: '600' },
  progressBar: { 
    height: 12, 
    borderRadius: 999, 
    overflow: 'hidden', 
    flexDirection: 'row',
    width: '100%'
  },
  progressFill: { 
    height: 12, 
    borderRadius: 999,
  },
  warningText: { fontSize: 12, marginTop: 4, fontWeight: 'bold' },
});