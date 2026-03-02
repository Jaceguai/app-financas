import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS, Category } from '../constants';

interface Props {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategorySelector: React.FC<Props> = ({ selectedCategory, onSelectCategory }) => {
  return (
    <View className="mx-4 mt-4">
      <Text className="text-base font-semibold mb-3 text-gray-500 dark:text-slate-400">Categoria</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="flex-row pb-1">
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category;
          const categoryColor = CATEGORY_COLORS[category as Category];

          return (
            <TouchableOpacity
              key={category}
              onPress={() => onSelectCategory(category)}
              className={`mr-3 px-4 py-2.5 rounded-xl flex-row items-center shadow-sm border-2 ${
                isSelected
                  ? 'bg-primary-500 dark:bg-primary-600 border-primary-500 dark:border-primary-600'
                  : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600'
              }`}
            >
              <Ionicons
                name={CATEGORY_ICONS[category as Category] as any}
                size={18}
                color={isSelected ? '#fff' : '#6b7280'}
                className="mr-1.5"
              />
              <Text className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-500 dark:text-slate-400'}`}>
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
