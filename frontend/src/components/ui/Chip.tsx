import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius } from '../../theme/tokens';

export const Chip = ({ label, selected, onPress, style }: { label: string; selected?: boolean; onPress?: () => void; style?: ViewStyle }) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, selected && styles.chipSelected, style]}> 
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#CCFBF1',
    borderColor: colors.accent,
  },
  text: {
    color: colors.accent,
    fontWeight: '600',
  },
  textSelected: {
    color: colors.accent,
  },
});
