import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  userName: string;
  totalSpent: number;
  color: string;
}

export const UserExpenseCard: React.FC<Props> = ({ userName, totalSpent, color }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.colorDot, { backgroundColor: color }]} />
        <Text style={styles.userName}>{userName}</Text>
      </View>
      <Text style={styles.value}>R$ {totalSpent.toFixed(2)}</Text>
      <Text style={styles.label}>Total gasto</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flex: 1, marginHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  userName: { color: '#757575', fontSize: 14, fontWeight: '500' },
  value: { fontSize: 24, fontWeight: 'bold', color: '#212121' },
  label: { fontSize: 12, color: '#9e9e9e', marginTop: 4 },
});