import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

type PantryItem = { id: number; name: string };

type SavedMeal = {
  id: number;
  name: string;
  ingredients: string[];
  image: string;
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const SPACING = 16;

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

type DisplayRecipe = {
  id: string;
  name: string;
  image: string;
  ingredients: string[];
  canMake: boolean;
  missing?: string[];
};

export const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [userName, setUserName] = useState('User');
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to get image URL
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2';
    if (imagePath.startsWith('http')) return imagePath;
    const filename = imagePath.includes('/') ? imagePath.split('/').pop() : imagePath;
    return `http://192.168.0.193:8000/static/${filename}`;
  };

  useEffect(() => {
    (async () => {
      const name = await AsyncStorage.getItem('name');
      if (name) setUserName(name);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get('/meals/');
        const meals = res.data.map((meal: any) => ({
          id: meal.id,
          name: meal.name,
          ingredients: Array.isArray(meal.ingredients) 
            ? meal.ingredients 
            : (typeof meal.ingredients === 'string' ? meal.ingredients.split(',').map((i: string) => i.trim()) : []),
          image: getImageUrl(meal.image),
        }));
        setSavedMeals(meals.slice(0, 3)); // Get top 3 saved meals
      } catch (e) {
        console.error('Error loading saved meals:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Transform saved meals to display format
  const displayRecipes: DisplayRecipe[] = savedMeals.map((meal) => ({
    id: meal.id.toString(),
    name: meal.name,
    image: meal.image,
    ingredients: meal.ingredients,
    canMake: true, // Assuming saved meals are ones you can make
    missing: [],
  }));

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.greeting}>
                  Hello, {userName}
                </Text>
                <Text style={styles.subGreeting}>What's cooking today?</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Profile')}
                style={styles.profileButton}
              >
                <Ionicons name="person-outline" size={24} color="#4F46E5" />
              </TouchableOpacity>
            </View>
          </View>

          {/* AI Chef Feature Card */}
          <View style={styles.aiChefContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('AIChef', {})}>
              <LinearGradient
                colors={["#3B82F6", "#9333EA"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.aiChefGradient}
              >
                <View style={styles.aiChefContent}>
                  <View style={styles.aiChefLeft}>
                    <View style={styles.aiChefTitleRow}>
                      <Text style={styles.aiChefEmoji}>🤖</Text>
                      <Text style={styles.aiChefTitle}>AI Chef Assistant</Text>
                    </View>
                    <Text style={styles.aiChefDescription}>
                      Get instant cooking advice, recipe suggestions, and meal planning help
                    </Text>
                    <View style={styles.aiChefBadge}>
                      <Text style={styles.aiChefBadgeText}>Ask me anything! 💬</Text>
                    </View>
                  </View>
                  <View style={styles.aiChefRight}>
                    <View style={styles.aiChefIconCircle}>
                      <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Your Saved Recipes */}
          <View style={styles.recipesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Your Saved Recipes
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SavedMeals')}>
                <Text style={styles.seeAllText}>See All →</Text>
              </TouchableOpacity>
            </View>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading recipes...</Text>
              </View>
            ) : displayRecipes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No saved recipes yet</Text>
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('AIChef', {})}
                >
                  <Text style={styles.emptyButtonText}>Ask AI Chef for Recipes</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + SPACING}
                decelerationRate="fast"
                contentContainerStyle={{
                  paddingHorizontal: (width - CARD_WIDTH) / 2,
                }}
              >
                {displayRecipes.map((recipe) => (
                  <TouchableOpacity
                    key={recipe.id}
                    onPress={async () => {
                      try {
                        // Fetch full meal details
                        const res = await api.get(`/meals/${recipe.id}`);
                        navigation.navigate('RecipeDetail', { recipe: res.data });
                      } catch (err) {
                        console.error('Error loading meal:', err);
                      }
                    }}
                    style={[styles.recipeCard, { width: CARD_WIDTH }]}
                  >
                    <View style={styles.recipeCardInner}>
                      <Image
                        source={{ uri: recipe.image }}
                        style={styles.recipeImage}
                        resizeMode="cover"
                      />
                      <View style={styles.recipeInfo}>
                        <Text style={styles.recipeName}>
                          {recipe.name}
                        </Text>
                        <Text style={styles.availableText}>Saved Recipe</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.sectionTitle}>
              Quick Actions
            </Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                onPress={() => navigation.navigate('MealPlanner')}
                style={[styles.quickActionCard, styles.quickActionIndigo]}
              >
                <View style={[styles.quickActionIcon, styles.quickActionIconIndigo]}>
                  <Ionicons name="calendar-outline" size={24} color="#4F46E5" />
                </View>
                <Text style={styles.quickActionTitle}>Meal Planner</Text>
                <Text style={styles.quickActionSubtitle}>Plan your meals</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('GroceryList')}
                style={[styles.quickActionCard, styles.quickActionGreen]}
              >
                <View style={[styles.quickActionIcon, styles.quickActionIconGreen]}>
                  <Ionicons name="cart-outline" size={24} color="#059669" />
                </View>
                <Text style={styles.quickActionTitle}>Grocery List</Text>
                <Text style={styles.quickActionSubtitle}>View your list</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Pantry')}
                style={[styles.quickActionCard, styles.quickActionOrange]}
              >
                <View style={[styles.quickActionIcon, styles.quickActionIconOrange]}>
                  <Ionicons name="cube-outline" size={24} color="#D97706" />
                </View>
                <Text style={styles.quickActionTitle}>My Pantry</Text>
                <Text style={styles.quickActionSubtitle}>Check inventory</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('AIChef', {})}
                style={[styles.quickActionCard, styles.quickActionBlue]}
              >
                <View style={[styles.quickActionIcon, styles.quickActionIconBlue]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={24} color="#2563EB" />
                </View>
                <Text style={styles.quickActionTitle}>AI Chef</Text>
                <Text style={styles.quickActionSubtitle}>Ask cooking questions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('SavedMeals')}
                style={[styles.quickActionCard, styles.quickActionPink]}
              >
                <View style={[styles.quickActionIcon, styles.quickActionIconPink]}>
                  <Ionicons name="bookmark-outline" size={24} color="#DB2777" />
                </View>
                <Text style={styles.quickActionTitle}>Saved Meals</Text>
                <Text style={styles.quickActionSubtitle}>View your recipes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Profile')}
                style={[styles.quickActionCard, styles.quickActionPurple]}
              >
                <View style={[styles.quickActionIcon, styles.quickActionIconPurple]}>
                  <Ionicons name="person-outline" size={24} color="#7C3AED" />
                </View>
                <Text style={styles.quickActionTitle}>Profile</Text>
                <Text style={styles.quickActionSubtitle}>View settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subGreeting: {
    color: '#6B7280',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiChefContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  aiChefGradient: {
    borderRadius: 12,
    padding: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  aiChefContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiChefLeft: {
    flex: 1,
  },
  aiChefTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiChefEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  aiChefTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  aiChefDescription: {
    color: '#DBEAFE',
    fontSize: 14,
    marginBottom: 12,
  },
  aiChefBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  aiChefBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  aiChefRight: {
    marginLeft: 16,
  },
  aiChefIconCircle: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipesSection: {
    marginTop: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  recipeCard: {
    marginRight: 16,
  },
  recipeCardInner: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 192,
  },
  recipeInfo: {
    padding: 16,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  availableText: {
    color: '#059669',
    fontWeight: '500',
    marginBottom: 8,
  },
  missingText: {
    color: '#EA580C',
    fontWeight: '500',
    marginBottom: 8,
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  quickActionCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  quickActionIndigo: {
    backgroundColor: '#EEF2FF',
  },
  quickActionGreen: {
    backgroundColor: '#F0FDF4',
  },
  quickActionOrange: {
    backgroundColor: '#FFF7ED',
  },
  quickActionBlue: {
    backgroundColor: '#EFF6FF',
  },
  quickActionPink: {
    backgroundColor: '#FDF2F8',
  },
  quickActionPurple: {
    backgroundColor: '#FAF5FF',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionIconIndigo: {
    backgroundColor: '#E0E7FF',
  },
  quickActionIconGreen: {
    backgroundColor: '#D1FAE5',
  },
  quickActionIconOrange: {
    backgroundColor: '#FFEDD5',
  },
  quickActionIconBlue: {
    backgroundColor: '#DBEAFE',
  },
  quickActionIconPink: {
    backgroundColor: '#FCE7F3',
  },
  quickActionIconPurple: {
    backgroundColor: '#F3E8FF',
  },
  quickActionTitle: {
    color: '#111827',
    fontWeight: '500',
  },
  quickActionSubtitle: {
    color: '#6B7280',
    fontSize: 12,
  },
}); 