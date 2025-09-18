import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type SubscriptionModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => void;
};

const FEATURES = [
  'Unlimited meal plans',
  'Advanced recipe suggestions',
  'Grocery delivery integration',
  'Pantry management',
  'Nutritional analysis',
  'Premium recipes',
];

export default function SubscriptionModal({ visible, onClose, onSubscribe }: SubscriptionModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-surface rounded-t-3xl">
          {/* Header */}
          <View className="p-6 border-b border-gray-100">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-2xl font-bold text-text">Upgrade to Pro</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text className="text-text-secondary">
              Get access to all premium features and take your meal planning to the next level
            </Text>
          </View>

          {/* Features */}
          <ScrollView className="p-6">
            {FEATURES.map((feature, index) => (
              <View key={index} className="flex-row items-center mb-4">
                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3">
                  <Ionicons name="checkmark" size={20} color="#4F46E5" />
                </View>
                <Text className="text-text font-medium">{feature}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Pricing */}
          <View className="p-6 border-t border-gray-100">
            <View className="flex-row justify-center items-baseline mb-6">
              <Text className="text-4xl font-bold text-text">$4.99</Text>
              <Text className="text-text-secondary ml-2">/month</Text>
            </View>

            <TouchableOpacity
              className="bg-primary rounded-xl py-4 mb-4"
              onPress={onSubscribe}
            >
              <Text className="text-white text-center font-semibold text-lg">
                Subscribe Now
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-surface rounded-xl py-4 border border-gray-200"
              onPress={onClose}
            >
              <Text className="text-text text-center font-semibold">
                Maybe Later
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
} 