import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

export const Skeleton = ({ style }: { style?: ViewStyle }) => {
  return <View style={[styles.skeleton, style]} />;
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
  },
});
