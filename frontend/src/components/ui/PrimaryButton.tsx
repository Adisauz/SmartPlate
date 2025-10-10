import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, shadow } from '../../theme/tokens';

export const PrimaryButton = ({ title, onPress, style }: { title: string; onPress: () => void; style?: ViewStyle }) => {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.btn, style]}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    ...shadow.medium,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
