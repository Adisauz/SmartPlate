import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  SafeAreaView,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../utils/api';

const { height } = Dimensions.get('window');

type AIChefScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AIChef'>;
type AIChefScreenRouteProp = RouteProp<RootStackParamList, 'AIChef'>;

interface Recipe {
  name: string;
  ingredients: string[];
  instructions: string;
  nutrients: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  prep_time: number;
  cook_time: number;
  image: string;
  id: number;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
  recipes?: Recipe[];
}

export const AIChefScreen = () => {
  const navigation = useNavigation<AIChefScreenNavigationProp>();
  const route = useRoute<AIChefScreenRouteProp>();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      message: '👋 Hello! I\'m your AI Chef assistant. I can help you with recipes, meal planning, cooking tips, and suggestions based on your pantry items. What would you like to know?',
      timestamp: new Date(),
    },
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMealTypeModal, setShowMealTypeModal] = useState(false);
  const [selectedRecipeForMeal, setSelectedRecipeForMeal] = useState<Recipe | null>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const sendMessageWithText = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: text.trim(),
      timestamp: new Date(),
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Auto-scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await api.post('/ask-ai/', { question: text.trim() });
      
      // Try to parse JSON recipes from the response
      let recipes: Recipe[] = [];
      let messageText = response.data.answer;
      
      try {
        const parsed = JSON.parse(response.data.answer);
        if (Array.isArray(parsed)) {
          recipes = parsed;
          messageText = `Here are some recipe suggestions for you:`;
        }
      } catch {
        // Not JSON, use as is
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        message: messageText,
        timestamp: new Date(),
        recipes: recipes.length > 0 ? recipes : undefined,
      };

      setMessages(prev => [...prev, aiMessage]);

      // Fade in animation for AI message
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        message: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    await sendMessageWithText(inputMessage);
  };

  // Handle initial prompt from navigation params
  useEffect(() => {
    if (route.params?.initialPrompt) {
      setInputMessage(route.params.initialPrompt);
      // Auto-send the message after a short delay
      const timer = setTimeout(() => {
        sendMessageWithText(route.params.initialPrompt!);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [route.params?.initialPrompt]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipe });
  };

  const handleAddToMealPlan = (recipe: Recipe) => {
    setSelectedRecipeForMeal(recipe);
    setShowMealTypeModal(true);
  };

  const saveMealAndNavigate = async (mealType: string) => {
    if (!selectedRecipeForMeal) return;

    try {
      // First save the meal to the database
      const payload = {
        name: selectedRecipeForMeal.name,
        ingredients: selectedRecipeForMeal.ingredients,
        instructions: selectedRecipeForMeal.instructions,
        nutrients: {
          calories: selectedRecipeForMeal.nutrients.calories,
          protein: selectedRecipeForMeal.nutrients.protein,
          carbs: selectedRecipeForMeal.nutrients.carbs,
          fat: selectedRecipeForMeal.nutrients.fat,
        },
        prep_time: selectedRecipeForMeal.prep_time,
        cook_time: selectedRecipeForMeal.cook_time,
        image: selectedRecipeForMeal.image,
      };
      
      await api.post('/meals/', payload);
      
      // Close modal
      setShowMealTypeModal(false);
      setSelectedRecipeForMeal(null);
      
      // Show success message
      Alert.alert(
        'Success!',
        `"${selectedRecipeForMeal.name}" has been saved to your meals. Go to Meal Planner to add it to ${mealType}.`,
        [
          {
            text: 'Go to Meal Planner',
            onPress: () => navigation.navigate('MealPlanner')
          },
          {
            text: 'Stay Here',
            style: 'cancel'
          }
        ]
      );
      
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', 'Failed to save meal. Please try again.');
    }
  };


  const RecipeCard = ({ recipe }: { recipe: Recipe }) => {
    // Convert image path to static URL
    const getImageUrl = (imagePath: string) => {
      if (!imagePath) return '';
      // If it's already a full URL, return as is
      if (imagePath.startsWith('http')) return imagePath;
      // Extract filename from path like "uploaded_images/recipe_xxx.png"
      const filename = imagePath.includes('/') ? imagePath.split('/').pop() : imagePath;
      return `http://192.168.0.193:8000/static/${filename}`;
    };

    return (
      <View style={styles.recipeCard}>
        <TouchableOpacity
          style={styles.recipeCardTouchable}
          onPress={() => handleRecipePress(recipe)}
        >
          <View style={styles.recipeImageContainer}>
            {recipe.image ? (
              <Image source={{ uri: getImageUrl(recipe.image) }} style={styles.recipeImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="restaurant" size={24} color="#9CA3AF" />
              </View>
            )}
          </View>
          <View style={styles.recipeInfo}>
            <Text style={styles.recipeName} numberOfLines={2}>
              {recipe.name}
            </Text>
            <View style={styles.nutritionRow}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipe.nutrients.calories}</Text>
                <Text style={styles.nutritionLabel}>cal</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipe.nutrients.protein}g</Text>
                <Text style={styles.nutritionLabel}>protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipe.nutrients.carbs}g</Text>
                <Text style={styles.nutritionLabel}>carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipe.nutrients.fat}g</Text>
                <Text style={styles.nutritionLabel}>fat</Text>
              </View>
            </View>
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={styles.timeText}>
                {recipe.prep_time + recipe.cook_time} min
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addToMealPlanButton}
          onPress={() => handleAddToMealPlan(recipe)}
        >
          <Ionicons name="calendar-outline" size={16} color="#4F46E5" />
          <Text style={styles.addToMealPlanText}>Add to Meal Plan</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Helper function to render formatted text with markdown-style elements
  const renderFormattedText = (text: string, isUser: boolean) => {
    const lines = text.split('\n');
    const textColor = isUser ? '#FFFFFF' : '#374151';
    
    return lines.map((line, index) => {
      // Check for bullet points (- or *)
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <View key={index} style={{ flexDirection: 'row', marginBottom: 6 }}>
            <Text style={{ color: textColor, fontSize: 16, marginRight: 8 }}>•</Text>
            <Text style={{ color: textColor, fontSize: 16, lineHeight: 22, flex: 1 }}>
              {line.trim().substring(2)}
            </Text>
          </View>
        );
      }
      
      // Check for numbered lists (1. 2. etc)
      const numberedMatch = line.trim().match(/^(\d+)\.\s+(.+)/);
      if (numberedMatch) {
        return (
          <View key={index} style={{ flexDirection: 'row', marginBottom: 6 }}>
            <Text style={{ color: textColor, fontSize: 16, fontWeight: '600', marginRight: 8, minWidth: 24 }}>
              {numberedMatch[1]}.
            </Text>
            <Text style={{ color: textColor, fontSize: 16, lineHeight: 22, flex: 1 }}>
              {numberedMatch[2]}
            </Text>
          </View>
        );
      }
      
      // Check for bold text (**text**)
      const boldMatch = line.match(/\*\*(.+?)\*\*/g);
      if (boldMatch) {
        const parts = line.split(/(\*\*.+?\*\*)/);
        return (
          <Text key={index} style={{ color: textColor, fontSize: 16, lineHeight: 22, marginBottom: line ? 6 : 0 }}>
            {parts.map((part, partIndex) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <Text key={partIndex} style={{ fontWeight: 'bold' }}>
                    {part.slice(2, -2)}
                  </Text>
                );
              }
              return part;
            })}
          </Text>
        );
      }
      
      // Regular text
      if (line.trim()) {
        return (
          <Text key={index} style={{ color: textColor, fontSize: 16, lineHeight: 22, marginBottom: 6 }}>
            {line}
          </Text>
        );
      }
      
      // Empty line (spacing)
      return <View key={index} style={{ height: 8 }} />;
    });
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.type === 'user';
    const isLastMessage = index === messages.length - 1;
    
    return (
      <Animated.View
        key={message.id}
        style={{
          opacity: isLastMessage && message.type === 'ai' ? fadeAnim : 1,
          marginBottom: 16,
          alignItems: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        <View
          style={{
            maxWidth: '80%',
            backgroundColor: isUser ? '#4F46E5' : '#F3F4F6',
            borderRadius: 18,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomRightRadius: isUser ? 4 : 18,
            borderBottomLeftRadius: isUser ? 18 : 4,
          }}
        >
          {!isUser && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 16, marginRight: 4 }}>🍳</Text>
              <Text style={{ fontWeight: 'bold', color: '#4F46E5', fontSize: 12 }}>
                AI Chef
              </Text>
            </View>
          )}
          <View>
            {renderFormattedText(message.message, isUser)}
          </View>
        </View>
        
        {/* Render recipe cards if available */}
        {!isUser && message.recipes && message.recipes.length > 0 && (
          <View style={styles.recipesContainer}>
            {message.recipes.map((recipe, recipeIndex) => (
              <RecipeCard key={recipeIndex} recipe={recipe} />
            ))}
          </View>
        )}
        
        <Text
          style={{
            fontSize: 12,
            color: '#9CA3AF',
            marginTop: 4,
            marginHorizontal: 8,
          }}
        >
          {formatTime(message.timestamp)}
        </Text>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
          backgroundColor: '#FFFFFF',
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            padding: 8,
            marginRight: 12,
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
            AI Chef
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280' }}>
            Your cooking assistant
          </Text>
        </View>
        
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#10B981',
          }}
        />
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
          
          {isLoading && (
            <View style={{ alignItems: 'flex-start', marginBottom: 16 }}>
              <View
                style={{
                  backgroundColor: '#F3F4F6',
                  borderRadius: 18,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomLeftRadius: 4,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontSize: 16, marginRight: 4 }}>🍳</Text>
                  <Text style={{ fontWeight: 'bold', color: '#4F46E5', fontSize: 12 }}>
                    AI Chef
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#9CA3AF',
                      marginRight: 6,
                    }}
                  />
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#9CA3AF',
                      marginRight: 6,
                    }}
                  />
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#9CA3AF',
                    }}
                  />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          {/* Quick Action Buttons */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 12 }}
          >
            {[
              '🥗 What can I cook?',
              '⏰ Quick meals',
              '🥘 Recipe ideas',
              '🛒 Shopping tips',
            ].map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setInputMessage(suggestion.substring(2))}
                style={{
                  backgroundColor: '#F3F4F6',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  marginRight: 8,
                }}
              >
                <Text style={{ color: '#374151', fontSize: 14 }}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Text Input */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              backgroundColor: '#F9FAFB',
              borderRadius: 24,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
          >
            <TextInput
              style={{
                flex: 1,
                fontSize: 16,
                color: '#111827',
                maxHeight: 100,
                paddingTop: 8,
                paddingBottom: 8,
              }}
              placeholder="Ask me anything about cooking..."
              placeholderTextColor="#9CA3AF"
              value={inputMessage}
              onChangeText={setInputMessage}
              multiline
              editable={!isLoading}
            />
            
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              style={{
                backgroundColor: inputMessage.trim() && !isLoading ? '#4F46E5' : '#D1D5DB',
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 8,
              }}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputMessage.trim() && !isLoading ? '#FFFFFF' : '#9CA3AF'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Meal Type Selection Modal */}
      <Modal
        visible={showMealTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMealTypeModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
                Add to Meal Plan
              </Text>
              <TouchableOpacity onPress={() => setShowMealTypeModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
              Choose which meal type to save this recipe as:
            </Text>

            {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((mealType) => (
              <TouchableOpacity
                key={mealType}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  backgroundColor: '#F9FAFB',
                  borderRadius: 12,
                  marginBottom: 12,
                }}
                onPress={() => saveMealAndNavigate(mealType)}
              >
                <Ionicons
                  name={
                    mealType === 'Breakfast' ? 'sunny-outline' :
                    mealType === 'Lunch' ? 'fast-food-outline' :
                    mealType === 'Dinner' ? 'restaurant-outline' :
                    'nutrition-outline'
                  }
                  size={24}
                  color="#4F46E5"
                  style={{ marginRight: 12 }}
                />
                <Text style={{ fontSize: 16, color: '#111827', flex: 1 }}>
                  {mealType}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  recipesContainer: {
    marginTop: 12,
    width: '100%',
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recipeCardTouchable: {
    flexDirection: 'row',
    padding: 12,
  },
  addToMealPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#EEF2FF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 6,
  },
  addToMealPlanText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
  },
  recipeImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  nutritionLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
});

