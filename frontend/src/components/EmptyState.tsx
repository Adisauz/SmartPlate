import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-6">
        <Ionicons name={icon} size={40} color="#4F46E5" />
      </View>
      <Text className="text-2xl font-bold text-text text-center mb-2">
        {title}
      </Text>
      <Text className="text-text-secondary text-center mb-8">
        {description}
      </Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          className="bg-primary rounded-xl py-4 px-8"
          onPress={onAction}
        >
          <Text className="text-white font-semibold text-lg">
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
} 