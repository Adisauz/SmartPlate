import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type RecipeRatingProps = {
  recipeId: string;
  onRate: (rating: number, tip: string) => void;
};

const TIPS = [
  'Add more seasoning for better flavor',
  'Try cooking at a lower temperature',
  'Let it rest for 5 minutes before serving',
  'Double the sauce for extra flavor',
  'Add fresh herbs at the end',
];

export default function RecipeRating({ recipeId, onRate }: RecipeRatingProps) {
  const [rating, setRating] = useState(0);
  const [showTipModal, setShowTipModal] = useState(false);
  const [selectedTip, setSelectedTip] = useState('');

  const handleRate = (value: number) => {
    setRating(value);
    setShowTipModal(true);
  };

  const handleSubmit = () => {
    onRate(rating, selectedTip);
    setShowTipModal(false);
    setRating(0);
    setSelectedTip('');
  };

  return (
    <>
      <View className="p-4 bg-surface rounded-xl">
        <Text className="text-lg font-semibold text-text mb-4">Rate this Recipe</Text>
        <View className="flex-row justify-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => handleRate(star)}
              className="mx-2"
            >
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={32}
                color={star <= rating ? '#F59E0B' : '#D1D5DB'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Modal
        visible={showTipModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTipModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-surface rounded-2xl w-full max-w-sm">
            <View className="p-6">
              <Text className="text-xl font-bold text-text mb-4">Share a Tip</Text>
              <Text className="text-text-secondary mb-6">
                Help others by sharing your cooking tip for this recipe
              </Text>

              {TIPS.map((tip, index) => (
                <TouchableOpacity
                  key={index}
                  className={`p-4 rounded-xl mb-3 ${
                    selectedTip === tip ? 'bg-primary/10 border-primary' : 'bg-gray-50'
                  }`}
                  onPress={() => setSelectedTip(tip)}
                >
                  <Text
                    className={`font-medium ${
                      selectedTip === tip ? 'text-primary' : 'text-text'
                    }`}
                  >
                    {tip}
                  </Text>
                </TouchableOpacity>
              ))}

              <View className="flex-row mt-6">
                <TouchableOpacity
                  className="flex-1 bg-gray-100 rounded-xl py-4 mr-2"
                  onPress={() => setShowTipModal(false)}
                >
                  <Text className="text-text text-center font-semibold">Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-primary rounded-xl py-4 ml-2"
                  onPress={handleSubmit}
                >
                  <Text className="text-white text-center font-semibold">Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
} 