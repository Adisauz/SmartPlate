import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { Toast } from '../components/Toast';
import api from '../utils/api';

type RecipeDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RecipeDetail'>;
type RecipeDetailScreenRouteProp = RouteProp<RootStackParamList, 'RecipeDetail'>;

const { width } = Dimensions.get('window');

const recipe = {
  id: '1',
  name: 'Grilled Salmon with Lemon Butter Sauce',
  image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2',
  time: '30 mins',
  servings: 4,
  difficulty: 'Medium',
  calories: 450,
  ingredients: [
    { id: '1', name: 'Salmon fillets', amount: '4', unit: 'pieces' },
    { id: '2', name: 'Butter', amount: '4', unit: 'tbsp' },
    { id: '3', name: 'Lemon', amount: '1', unit: 'whole' },
    { id: '4', name: 'Garlic', amount: '2', unit: 'cloves' },
    { id: '5', name: 'Fresh dill', amount: '2', unit: 'tbsp' },
    { id: '6', name: 'Salt', amount: '1', unit: 'tsp' },
    { id: '7', name: 'Black pepper', amount: '1/2', unit: 'tsp' },
  ],
  instructions: [
    'Preheat the grill to medium-high heat.',
    'Season the salmon fillets with salt and pepper.',
    'In a small saucepan, melt the butter over medium heat.',
    'Add minced garlic and cook for 1 minute.',
    'Add lemon juice and dill, stir well.',
    'Grill the salmon for 4-5 minutes per side.',
    'Serve with the lemon butter sauce.',
  ],
  nutrition: {
    calories: 450,
    protein: '35g',
    carbs: '2g',
    fat: '32g',
  },
};

export const RecipeDetailScreen = () => {
  const navigation = useNavigation<RecipeDetailScreenNavigationProp>();
  const route = useRoute<RecipeDetailScreenRouteProp>();
  const recipeData = route.params?.recipe;
  
  // Transform AI recipe data to match expected format
  const transformRecipe = (aiRecipe: any) => {
    if (!aiRecipe) return recipe;
    
    return {
      id: aiRecipe.id || '1',
      name: aiRecipe.name || 'Unknown Recipe',
      image: aiRecipe.image ? `http://192.168.0.111:8000/${aiRecipe.image}` : 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2',
      time: `${(aiRecipe.prep_time || 0) + (aiRecipe.cook_time || 0)} mins`,
      servings: 4, // Default servings
      difficulty: 'Medium', // Default difficulty
      calories: aiRecipe.nutrients?.calories || 0,
      ingredients: Array.isArray(aiRecipe.ingredients) 
        ? aiRecipe.ingredients.map((ingredient: string, index: number) => ({
            id: index.toString(),
            name: ingredient,
            amount: '1',
            unit: 'unit'
          }))
        : [],
      instructions: aiRecipe.instructions 
        ? aiRecipe.instructions.split('\n').filter((step: string) => step.trim())
        : [],
      nutrition: {
        calories: aiRecipe.nutrients?.calories || 0,
        protein: `${aiRecipe.nutrients?.protein || 0}g`,
        carbs: `${aiRecipe.nutrients?.carbs || 0}g`,
        fat: `${aiRecipe.nutrients?.fat || 0}g`,
      },
    };
  };

  // Use passed recipe data or fallback to default recipe
  const displayRecipe = transformRecipe(recipeData);
  const [isFavorite, setIsFavorite] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });
  const [AIAnswer, setAIAnswer] = useState('');
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const slideUpAnimation = useRef(new Animated.Value(0)).current;
  const answerOpacity = useRef(new Animated.Value(0)).current;

  const handleAddToMealPlan = () => {
    setToast({
      visible: true,
      message: 'Added to meal plan',
      type: 'success',
    });
  };

  const handleAddToGroceryList = () => {
    setToast({
      visible: true,
      message: 'Added to grocery list',
      type: 'success',
    });
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    setToast({
      visible: true,
      message: isFavorite ? 'Removed from favorites' : 'Added to favorites',
      type: 'success',
    });
  };

  const resetAnimation = () => {
    slideUpAnimation.setValue(0);
    answerOpacity.setValue(0);
    setAIAnswer('');
  };

  const handleQuestionChange = (text: string) => {
    setQuestion(text);
    // Reset animation if user starts typing a new question after getting an answer
    if (AIAnswer && text !== question) {
      resetAnimation();
    }
  };

  const askAI = async (question: string) => {
    if (!question.trim()) return;
    
    setIsAsking(true);
    
    // Reset previous answer opacity if exists
    if (AIAnswer) {
      answerOpacity.setValue(0);
    }
    
    // Animate textbox up
    Animated.timing(slideUpAnimation, {
      toValue: -50, // Move up by 50 pixels
      duration: 300,
      useNativeDriver: true,
    }).start();

    try {
      const res = await api.post('/ask-ai/', { question });
      setAIAnswer(res.data.answer);
      
      // Fade in the answer
      Animated.timing(answerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      setAIAnswer('Error getting answer');
      // Still show error with fade in
      Animated.timing(answerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <View className="flex-1 bg-white">
        <SafeAreaView className="flex-1">
          <ScrollView
            showsVerticalScrollIndicator={false}
            className="flex-1"
            keyboardShouldPersistTaps="handled"
          >
            {/* Recipe Image with Back Button and Favorite Button */}
            <View className="relative h-72">
              <Image
                source={{ uri: displayRecipe.image }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-black/20" />
              <View className="absolute top-0 left-0 right-0 flex-row justify-between items-center p-4">
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  className="w-10 h-10 rounded-full bg-white/90 items-center justify-center"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Ionicons name="chevron-back" size={24} color="#4F46E5" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={toggleFavorite}
                  className="w-10 h-10 rounded-full bg-white/90 items-center justify-center"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Ionicons
                    name={isFavorite ? 'heart' : 'heart-outline'}
                    size={24}
                    color={isFavorite ? '#EF4444' : '#4F46E5'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Recipe Info */}
            <View className="px-6 py-4 bg-white rounded-t-3xl -mt-6">
              <Text className="text-2xl font-bold text-gray-900 mb-2">
                {displayRecipe.name}
              </Text>
              <View className="flex-row items-center mb-4">
                <View className="flex-row items-center mr-4">
                  <Ionicons name="time-outline" size={20} color="#6B7280" />
                  <Text className="text-gray-600 ml-1">{displayRecipe.time}</Text>
                </View>
                <View className="flex-row items-center mr-4">
                  <Ionicons name="people-outline" size={20} color="#6B7280" />
                  <Text className="text-gray-600 ml-1">{displayRecipe.servings} servings</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="flame-outline" size={20} color="#6B7280" />
                  <Text className="text-gray-600 ml-1">{displayRecipe.calories} cal</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row mb-6">
                <TouchableOpacity
                  className="flex-1 bg-indigo-600 py-3 rounded-lg mr-2"
                  onPress={handleAddToMealPlan}
                >
                  <Text className="text-white text-center font-semibold">
                    Add to Meal Plan
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-indigo-100 py-3 rounded-lg ml-2"
                  onPress={handleAddToGroceryList}
                >
                  <Text className="text-indigo-600 text-center font-semibold">
                    Add to Grocery List
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Ingredients */}
              <View className="mb-6">
                <Text className="text-xl font-bold text-gray-900 mb-4">
                  Ingredients
                </Text>
                {displayRecipe.ingredients.map((ingredient: any) => (
                  <View
                    key={ingredient.id}
                    className="flex-row items-center py-2 border-b border-gray-100"
                  >
                    <View className="w-2 h-2 rounded-full bg-indigo-600 mr-3" />
                    <Text className="flex-1 text-gray-900">
                      {ingredient.name}
                    </Text>
                    <Text className="text-gray-600">
                      {ingredient.amount} {ingredient.unit}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Instructions */}
              <View className="mb-6">
                <Text className="text-xl font-bold text-gray-900 mb-4">
                  Instructions
                </Text>
                {displayRecipe.instructions.map((instruction: any, index: number) => (
                  <View
                    key={index}
                    className="flex-row items-start py-2 border-b border-gray-100"
                  >
                    <View className="w-6 h-6 rounded-full bg-indigo-100 items-center justify-center mr-3 mt-1">
                      <Text className="text-indigo-600 font-medium">
                        {index + 1}
                      </Text>
                    </View>
                    <Text className="flex-1 text-gray-900">
                      {instruction}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Nutrition */}
              <View className="mb-6">
                <Text className="text-xl font-bold text-gray-900 mb-4">
                  Nutrition
                </Text>
                <View className="bg-gray-50 rounded-xl p-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600">Calories</Text>
                    <Text className="text-gray-900 font-medium">
                      {displayRecipe.nutrition.calories}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600">Protein</Text>
                    <Text className="text-gray-900 font-medium">
                      {displayRecipe.nutrition.protein}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600">Carbs</Text>
                    <Text className="text-gray-900 font-medium">
                      {displayRecipe.nutrition.carbs}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Fat</Text>
                    <Text className="text-gray-900 font-medium">
                      {displayRecipe.nutrition.fat}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>

        {/* AI Q&A Section */}
        <View style={{ padding: 16, minHeight: 120 }}>
          <Animated.View 
            style={{
              transform: [{ translateY: slideUpAnimation }],
            }}
          >
            <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Ask AI about this recipe:</Text>
            <TextInput
              placeholder="Type your question..."
              value={question}
              onChangeText={handleQuestionChange}
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                padding: 8,
                marginBottom: 8,
                backgroundColor: '#fff',
              }}
              editable={!isAsking}
              multiline={true}
              numberOfLines={2}
            />
            <TouchableOpacity
              style={{
                backgroundColor: isAsking ? '#9CA3AF' : '#4F46E5',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={() => askAI(question)}
              disabled={isAsking}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>
                {isAsking ? 'Asking...' : 'Ask AI'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
          
          {AIAnswer ? (
            <Animated.View 
              style={{ 
                marginTop: 16,
                opacity: answerOpacity,
                backgroundColor: '#F3F4F6',
                padding: 12,
                borderRadius: 8,
                borderLeftWidth: 4,
                borderLeftColor: '#4F46E5',
              }}
            >
              <Text style={{ fontWeight: 'bold', marginBottom: 4, color: '#4F46E5' }}>
                AI Chef Says:
              </Text>
              <Text style={{ color: '#374151', lineHeight: 20 }}>
                {AIAnswer}
              </Text>
            </Animated.View>
          ) : null}
        </View>

        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast({ ...toast, visible: false })}
        />
      </View>
    </KeyboardAvoidingView>
  );
}; 