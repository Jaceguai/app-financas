import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS, Category } from '../constants';

interface Props {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategorySelector: React.FC<Props> = ({ selectedCategory, onSelectCategory }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Categoria</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category;
          const categoryColor = CATEGORY_COLORS[category as Category];
          
          return (
            <TouchableOpacity 
              key={category} 
              onPress={() => onSelectCategory(category)} 
              style={[
                styles.categoryButton, 
                { 
                  backgroundColor: isSelected ? categoryColor : theme.colors.surfaceSecondary,
                  borderColor: isSelected ? categoryColor : theme.colors.border 
                }
              ]}
            >
              <Ionicons 
                name={CATEGORY_ICONS[category as Category] as any} 
                size={18} 
                color={isSelected ? '#fff' : theme.colors.textSecondary}
                style={styles.icon}
              />
              <Text style={[
                styles.categoryText, 
                { color: isSelected ? '#fff' : theme.colors.textSecondary }
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    marginHorizontal: 16, 
    marginTop: 16 
  },
  label: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 12 
  },
  scrollContent: {
    flexDirection: 'row',
    paddingBottom: 4,
  },
  categoryButton: { 
    marginRight: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    marginRight: 6,
  },
  categoryText: { 
    fontWeight: '600',
    fontSize: 14,
  },
});