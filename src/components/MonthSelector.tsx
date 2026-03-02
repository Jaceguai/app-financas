import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';
import { getIconColor } from '../utils/iconColors';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
               'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const MESES_CURTO = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                     'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const getCurrentMonth = () => {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
};

interface MonthSelectorProps {
  selectedMonth: string;
  onChangeMonth: (month: string) => void;
  compact?: boolean;
  hideValues?: boolean;
  onToggleHide?: () => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({ selectedMonth, onChangeMonth, compact, hideValues, onToggleHide }) => {
  const { isDark } = useTheme();
  const [pickerVisible, setPickerVisible] = useState(false);

  const [mes, ano] = (selectedMonth || getCurrentMonth()).split('/');
  const mesIndex = parseInt(mes, 10) - 1;
  const mesNome = MESES[mesIndex] || 'Janeiro';
  const [pickerAno, setPickerAno] = useState(parseInt(ano, 10));

  const navigateMonth = (direction: number) => {
    let newMes = parseInt(mes, 10) + direction;
    let newAno = parseInt(ano, 10);
    if (newMes < 1) { newMes = 12; newAno--; }
    if (newMes > 12) { newMes = 1; newAno++; }
    onChangeMonth(`${String(newMes).padStart(2, '0')}/${newAno}`);
  };

  const selectMonth = (monthIndex: number) => {
    onChangeMonth(`${String(monthIndex + 1).padStart(2, '0')}/${pickerAno}`);
    setPickerVisible(false);
  };

  const openPicker = () => {
    setPickerAno(parseInt(ano, 10));
    setPickerVisible(true);
  };

  return (
    <>
      <View className={`flex-row justify-between items-center rounded-xl p-4 border bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 ${compact ? '' : 'mx-4 mt-4'}`}>
        <TouchableOpacity onPress={() => navigateMonth(-1)} className="p-1">
          <Ionicons name="chevron-back" size={24} color={getIconColor('primary', isDark)} />
        </TouchableOpacity>

        <TouchableOpacity onPress={openPicker} className="flex-row items-center gap-2">
          <Ionicons name="calendar-outline" size={18} color={isDark ? '#94a3b8' : '#6b7280'} />
          <Text className="text-lg font-bold text-gray-900 dark:text-slate-100">{mesNome} {ano}</Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-1">
          {onToggleHide && (
            <TouchableOpacity onPress={onToggleHide} className="p-1 mr-1">
              <Ionicons name={hideValues ? 'eye-off' : 'eye'} size={22} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigateMonth(1)} className="p-1">
            <Ionicons name="chevron-forward" size={24} color={getIconColor('primary', isDark)} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Month Picker Modal */}
      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
          className="flex-1 justify-center items-center bg-black/50"
        >
          <TouchableOpacity activeOpacity={1} className="w-80 rounded-2xl p-5 bg-white dark:bg-slate-800">
            {/* Year Navigation */}
            <View className="flex-row justify-between items-center mb-5">
              <TouchableOpacity onPress={() => setPickerAno(pickerAno - 1)} className="p-2">
                <Ionicons name="chevron-back" size={24} color={getIconColor('primary', isDark)} />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-gray-900 dark:text-slate-100">{pickerAno}</Text>
              <TouchableOpacity onPress={() => setPickerAno(pickerAno + 1)} className="p-2">
                <Ionicons name="chevron-forward" size={24} color={getIconColor('primary', isDark)} />
              </TouchableOpacity>
            </View>

            {/* Month Grid */}
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {MESES_CURTO.map((m, i) => {
                const isSelected = i === mesIndex && pickerAno === parseInt(ano, 10);
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => selectMonth(i)}
                    className={`w-[30%] py-3 rounded-xl items-center ${
                      isSelected
                        ? 'bg-blue-500 dark:bg-blue-600'
                        : 'bg-gray-100 dark:bg-slate-700'
                    }`}
                  >
                    <Text className={`text-sm font-semibold ${
                      isSelected
                        ? 'text-white'
                        : 'text-gray-700 dark:text-slate-300'
                    }`}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Close */}
            <TouchableOpacity onPress={() => setPickerVisible(false)} className="mt-4 py-3 rounded-xl bg-gray-100 dark:bg-slate-700">
              <Text className="text-center font-semibold text-gray-500 dark:text-slate-400">Fechar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};
