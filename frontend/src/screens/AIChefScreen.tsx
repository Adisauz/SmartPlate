import React, { useState, useRef } from 'react';
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
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../utils/api';

const { height } = Dimensions.get('window');

type AIChefScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AIChef'>;

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
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: inputMessage.trim(),
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
      const response = await api.post('/ask-ai/', { question: inputMessage.trim() });
      
      // Try to parse JSON recipes from the response
      let recipes: Recipe[] = [];
      let messageText = response.data.answer;
      
      try {
        const parsed = JSON.parse(response.data.answer);
        if (Array.isArray(parsed)) {
          recipes = parsed;
          messageText = `Here are some recipe suggestions for you:`;
        }
      } catch (e) {
        // If not JSON, use the response as is
      }
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        message: messageText,
        timestamp: new Date(),
        recipes: recipes.length > 0 ? recipes : undefined,
      };

      // Add AI response with animation
      setMessages(prev => [...prev, aiMessage]);
      
      // Animate new message
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
      // Auto-scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
      
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: 'ai',
        message: '❌ Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipe });
  };


  const RecipeCard = ({ recipe }: { recipe: Recipe }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => handleRecipePress(recipe)}
    >
      <View style={styles.recipeImageContainer}>
        {recipe.image ? (
          <Image source={{ uri: `http://localhost:8000/${recipe.image}` }} style={styles.recipeImage} />
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
  );

  const RecipeModal = () => (
    <Modal
      visible={showRecipeModal}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => setShowRecipeModal(false)}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Recipe Details</Text>
          <TouchableOpacity
            onPress={addToMealPlan}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color="#4F46E5" />
          </TouchableOpacity>
        </View>
        
        {selectedRecipe && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.fullRecipeImageContainer}>
              {selectedRecipe.image ? (
                <Image 
                  source={{ uri: `http://localhost:8000/${selectedRecipe.image}` }} 
                  style={styles.fullRecipeImage} 
                />
              ) : (
                <View style={styles.fullPlaceholderImage}>
                  <Ionicons name="restaurant" size={48} color="#9CA3AF" />
                </View>
              )}
            </View>
            
            <View style={styles.recipeDetails}>
              <Text style={styles.fullRecipeName}>{selectedRecipe.name}</Text>
              
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={20} color="#6B7280" />
                  <Text style={styles.detailText}>
                    Prep: {selectedRecipe.prep_time} min
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="flame-outline" size={20} color="#6B7280" />
                  <Text style={styles.detailText}>
                    Cook: {selectedRecipe.cook_time} min
                  </Text>
                </View>
              </View>
              
              <View style={styles.nutritionSection}>
                <Text style={styles.sectionTitle}>Nutrition (per serving)</Text>
                <View style={styles.nutritionGrid}>
                  <View style={styles.nutritionBox}>
                    <Text style={styles.nutritionNumber}>{selectedRecipe.nutrients.calories}</Text>
                    <Text style={styles.nutritionText}>Calories</Text>
                  </View>
                  <View style={styles.nutritionBox}>
                    <Text style={styles.nutritionNumber}>{selectedRecipe.nutrients.protein}g</Text>
                    <Text style={styles.nutritionText}>Protein</Text>
                  </View>
                  <View style={styles.nutritionBox}>
                    <Text style={styles.nutritionNumber}>{selectedRecipe.nutrients.carbs}g</Text>
                    <Text style={styles.nutritionText}>Carbs</Text>
                  </View>
                  <View style={styles.nutritionBox}>
                    <Text style={styles.nutritionNumber}>{selectedRecipe.nutrients.fat}g</Text>
                    <Text style={styles.nutritionText}>Fat</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.ingredientsSection}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                {selectedRecipe.ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientItem}>
                    <Text style={styles.ingredientBullet}>•</Text>
                    <Text style={styles.ingredientText}>{ingredient}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.instructionsSection}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                <Text style={styles.instructionsText}>{selectedRecipe.instructions}</Text>
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

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
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 16, marginRight: 4 }}>🍳</Text>
              <Text style={{ fontWeight: 'bold', color: '#4F46E5', fontSize: 12 }}>
                AI Chef
              </Text>
            </View>
          )}
          <Text
            style={{
              color: isUser ? '#FFFFFF' : '#374151',
              fontSize: 16,
              lineHeight: 22,
            }}
          >
            {message.message}
          </Text>
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
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
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

