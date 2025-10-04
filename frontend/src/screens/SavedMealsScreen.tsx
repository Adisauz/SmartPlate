import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Toast } from '../components/Toast';
import api from '../utils/api';

type SavedMealsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SavedMeals'>;

interface SavedMeal {
  id: number;
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
}

export const SavedMealsScreen = () => {
  const navigation = useNavigation<SavedMealsScreenNavigationProp>();
  const [meals, setMeals] = useState<SavedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/meals/');
      setMeals(response.data);
    } catch (error) {
      console.error('Error loading meals:', error);
      setToast({
        visible: true,
        message: 'Failed to load saved meals',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteMeal = async (mealId: number) => {
    try {
      await api.delete(`/meals/${mealId}`);
      setMeals(meals.filter(m => m.id !== mealId));
      setToast({
        visible: true,
        message: 'Meal deleted successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Error deleting meal:', error);
      setToast({
        visible: true,
        message: 'Failed to delete meal',
        type: 'error',
      });
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2';
    if (imagePath.startsWith('http')) return imagePath;
    const filename = imagePath.includes('/') ? imagePath.split('/').pop() : imagePath;
    return `http://192.168.1.11:8000/static/${filename}`;
  };

  const handleMealPress = (meal: SavedMeal) => {
    navigation.navigate({
      name: 'RecipeDetail',
      params: { recipe: meal },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading saved meals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color="#4F46E5" />
            </TouchableOpacity>
            <Text style={styles.title}>Saved Meals</Text>
          </View>
          <Text style={styles.subtitle}>
            {meals.length} {meals.length === 1 ? 'meal' : 'meals'} saved
          </Text>
        </View>

        {/* Meals List */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {meals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No saved meals yet</Text>
              <Text style={styles.emptySubtitle}>
                Save meals from AI Chef or add your own recipes
              </Text>
              <TouchableOpacity
                style={styles.aiChefButton}
                onPress={() => navigation.navigate({ name: 'AIChef', params: undefined })}
              >
                <Text style={styles.aiChefButtonText}>Ask AI Chef</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.mealsContainer}>
              {meals.map((meal) => (
                <TouchableOpacity
                  key={meal.id}
                  style={styles.mealCard}
                  onPress={() => handleMealPress(meal)}
                >
                  <Image
                    source={{ uri: getImageUrl(meal.image) }}
                    style={styles.mealImage}
                    resizeMode="cover"
                  />
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealName} numberOfLines={2}>
                      {meal.name}
                    </Text>
                    <View style={styles.mealMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={16} color="#6B7280" />
                        <Text style={styles.metaText}>
                          {meal.prep_time + meal.cook_time} min
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="flame-outline" size={16} color="#6B7280" />
                        <Text style={styles.metaText}>{meal.nutrients.calories} cal</Text>
                      </View>
                    </View>
                    <View style={styles.nutritionRow}>
                      <Text style={styles.nutritionText}>
                        P: {meal.nutrients.protein}g
                      </Text>
                      <Text style={styles.nutritionText}>
                        C: {meal.nutrients.carbs}g
                      </Text>
                      <Text style={styles.nutritionText}>
                        F: {meal.nutrients.fat}g
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      deleteMeal(meal.id);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 52,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  aiChefButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
  },
  aiChefButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  mealsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  mealCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mealImage: {
    width: 120,
    height: 120,
  },
  mealInfo: {
    flex: 1,
    padding: 12,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  nutritionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nutritionText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
  },
});

