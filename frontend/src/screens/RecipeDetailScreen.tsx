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
  StyleSheet,
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
    
    // Convert image path to static URL
    const getImageUrl = (imagePath: string) => {
      if (!imagePath) return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2';
      if (imagePath.startsWith('http')) return imagePath;
      // Extract filename from path like "uploaded_images/recipe_xxx.png"
      const filename = imagePath.includes('/') ? imagePath.split('/').pop() : imagePath;
      return `http://192.168.0.193:8000/static/${filename}`;
    };
    
    return {
      id: aiRecipe.id || '1',
      name: aiRecipe.name || 'Unknown Recipe',
      image: getImageUrl(aiRecipe.image),
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
        ? aiRecipe.instructions
            .split(/\n+/)  // Split by one or more newlines
            .map((step: string) => step.trim())
            .filter((step: string) => step.length > 0)
            .map((step: string) => {
              // Remove markdown numbering (1. 2. etc) and bullet points (- *)
              return step
                .replace(/^\d+\.\s*/, '')
                .replace(/^[-*]\s*/, '')
                .trim();
            })
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

  const handleAddToMealPlan = () => {
    setToast({
      visible: true,
      message: 'Navigating to Meal Planner...',
      type: 'success',
    });
    setTimeout(() => {
      navigation.navigate('MealPlanner');
    }, 500);
  };

  const handleAddToGroceryList = async () => {
    try {
      // Add all ingredients to grocery list
      for (const ingredient of displayRecipe.ingredients) {
        await api.post('/grocery/', { name: ingredient.name });
      }
      setToast({
        visible: true,
        message: 'All ingredients added to grocery list',
        type: 'success',
      });
    } catch (err) {
      setToast({
        visible: true,
        message: 'Failed to add to grocery list',
        type: 'error',
      });
    }
  };

  const addSingleIngredientToGrocery = async (ingredientName: string) => {
    try {
      await api.post('/grocery/', { name: ingredientName });
      setToast({
        visible: true,
        message: `Added ${ingredientName} to grocery list`,
        type: 'success',
      });
    } catch (err) {
      setToast({
        visible: true,
        message: 'Failed to add to grocery list',
        type: 'error',
      });
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    setToast({
      visible: true,
      message: isFavorite ? 'Removed from favorites' : 'Added to favorites',
      type: 'success',
    });
  };

  const saveMeal = async () => {
    try {
      const payload = {
        name: displayRecipe.name,
        ingredients: Array.isArray(displayRecipe.ingredients)
          ? displayRecipe.ingredients.map((i: any) => i.name)
          : [],
        instructions: Array.isArray(displayRecipe.instructions)
          ? displayRecipe.instructions.join('\n')
          : '',
        nutrients: {
          calories: Number(displayRecipe.nutrition?.calories ?? 0) || 0,
          protein: Number(String(displayRecipe.nutrition?.protein ?? '0').replace(/\D/g, '')) || 0,
          carbs: Number(String(displayRecipe.nutrition?.carbs ?? '0').replace(/\D/g, '')) || 0,
          fat: Number(String(displayRecipe.nutrition?.fat ?? '0').replace(/\D/g, '')) || 0,
        },
        prep_time: 0,
        cook_time: 0,
        image: (recipeData?.image as string) ?? '',
      };
      await api.post('/meals/', payload);
      setToast({ visible: true, message: 'Meal saved', type: 'success' });
    } catch (e) {
      setToast({ visible: true, message: 'Failed to save meal', type: 'error' });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
            keyboardShouldPersistTaps="handled"
          >
            {/* Recipe Image with Back Button and Favorite Button */}
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: displayRecipe.image }}
                style={styles.recipeImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay} />
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={[styles.headerButton, styles.headerButtonShadow]}
                >
                  <Ionicons name="chevron-back" size={24} color="#4F46E5" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={toggleFavorite}
                  style={[styles.headerButton, styles.headerButtonShadow]}
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
            <View style={styles.infoContainer}>
              <Text style={styles.recipeName}>
                {displayRecipe.name}
              </Text>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={20} color="#6B7280" />
                  <Text style={styles.metaText}>{displayRecipe.time}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={20} color="#6B7280" />
                  <Text style={styles.metaText}>{displayRecipe.servings} servings</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="flame-outline" size={20} color="#6B7280" />
                  <Text style={styles.metaText}>{displayRecipe.calories} cal</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={saveMeal}
                >
                  <Ionicons name="bookmark-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveButtonText}>
                    Save Meal
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.mealPlanButton]}
                  onPress={handleAddToMealPlan}
                >
                  <Ionicons name="calendar-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.mealPlanButtonText}>
                    Add to Meal Plan
                  </Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.groceryButton, { marginTop: 12 }]}
                onPress={handleAddToGroceryList}
              >
                <Ionicons name="cart-outline" size={18} color="#059669" style={{ marginRight: 6 }} />
                <Text style={styles.groceryButtonText}>
                  Add All to Grocery List
                </Text>
              </TouchableOpacity>

              {/* Ingredients */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Ingredients
                </Text>
                {displayRecipe.ingredients.map((ingredient: any) => (
                  <View
                    key={ingredient.id}
                    style={styles.ingredientItem}
                  >
                    <View style={styles.ingredientBullet} />
                    <Text style={styles.ingredientName}>
                      {ingredient.name}
                    </Text>
                    <Text style={styles.ingredientAmount}>
                      {ingredient.amount} {ingredient.unit}
                    </Text>
                    <TouchableOpacity
                      style={styles.addIngredientButton}
                      onPress={() => addSingleIngredientToGrocery(ingredient.name)}
                    >
                      <Ionicons name="cart-outline" size={16} color="#059669" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Instructions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Instructions
                </Text>
                {displayRecipe.instructions.map((instruction: any, index: number) => (
                  <View
                    key={index}
                    style={styles.instructionItem}
                  >
                    <View style={styles.instructionNumber}>
                      <Text style={styles.instructionNumberText}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={styles.instructionText}>
                      {instruction}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Nutrition */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Nutrition
                </Text>
                <View style={styles.nutritionCard}>
                  <View style={styles.nutritionRow}>
                    <Text style={styles.nutritionLabel}>Calories</Text>
                    <Text style={styles.nutritionValue}>
                      {displayRecipe.nutrition.calories}
                    </Text>
                  </View>
                  <View style={styles.nutritionRow}>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                    <Text style={styles.nutritionValue}>
                      {displayRecipe.nutrition.protein}
                    </Text>
                  </View>
                  <View style={styles.nutritionRow}>
                    <Text style={styles.nutritionLabel}>Carbs</Text>
                    <Text style={styles.nutritionValue}>
                      {displayRecipe.nutrition.carbs}
                    </Text>
                  </View>
                  <View style={styles.nutritionRow}>
                    <Text style={styles.nutritionLabel}>Fat</Text>
                    <Text style={styles.nutritionValue}>
                      {displayRecipe.nutrition.fat}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>

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

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 288,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  headerButtons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  recipeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    color: '#6B7280',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    marginRight: 8,
  },
  mealPlanButton: {
    backgroundColor: '#059669',
    marginLeft: 8,
  },
  groceryButton: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  mealPlanButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  groceryButtonText: {
    color: '#059669',
    textAlign: 'center',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  ingredientBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    marginRight: 12,
  },
  ingredientName: {
    flex: 1,
    color: '#111827',
  },
  ingredientAmount: {
    color: '#6B7280',
    marginRight: 8,
  },
  addIngredientButton: {
    padding: 6,
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
    marginLeft: 'auto',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 4,
  },
  instructionNumberText: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  instructionText: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
    lineHeight: 22,
  },
  nutritionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nutritionLabel: {
    color: '#6B7280',
  },
  nutritionValue: {
    color: '#111827',
    fontWeight: '500',
  },
}); 