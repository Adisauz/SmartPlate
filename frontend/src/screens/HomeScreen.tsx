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

// Recipe data (expand as needed)
const recipes = [
  {
    id: '1',
    name: 'Tomato Rice',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2',
    ingredients: ['Tomato Sauce', 'Rice', 'Olive Oil', 'Black Pepper'],
  },
  {
    id: '2',
    name: 'Tuna Rice Bowl',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
    ingredients: ['Canned Tuna', 'Rice', 'Olive Oil'],
  },
  {
    id: '3',
    name: 'Pepper Pasta',
    image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9',
    ingredients: ['Pasta', 'Black Pepper', 'Olive Oil'],
  },
  {
    id: '4',
    name: 'Simple Tuna',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
    ingredients: ['Canned Tuna', 'Olive Oil'],
  },
  {
    id: '5',
    name: 'Rice & Oil',
    image: 'https://images.unsplash.com/photo-1464306076886-debca5e8a6b0',
    ingredients: ['Rice', 'Olive Oil'],
  },
  {
    id: '6',
    name: 'Tomato Pepper Mix',
    image: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c',
    ingredients: ['Tomato Sauce', 'Black Pepper'],
  },
  {
    id: '7',
    name: 'Tuna Pasta',
    image: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c',
    ingredients: ['Canned Tuna', 'Pasta', 'Olive Oil'],
  },
];

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
  const [pantry, setPantry] = useState<PantryItem[]>([]);

  useEffect(() => {
    (async () => {
      const name = await AsyncStorage.getItem('name');
      if (name) setUserName(name);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<PantryItem[]>('/pantry/');
        setPantry(res.data);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Pantry ingredient names
  const pantryNames = pantry.map((item) => item.name);

  // Recipes you can make (all ingredients in pantry)
  const canMake = recipes.filter((recipe) =>
    recipe.ingredients.every((ing) => pantryNames.includes(ing))
  );

  // Recipes that are almost there (fewest missing ingredients, at least 1 missing)
  const almostThere = recipes
    .filter((recipe) => !canMake.includes(recipe))
    .map((recipe) => ({
      ...recipe,
      missing: recipe.ingredients.filter((ing) => !pantryNames.includes(ing)),
    }))
    .sort((a, b) => a.missing.length - b.missing.length);

  // Combine and limit to 6
  const displayRecipes: DisplayRecipe[] = [
    ...canMake.map((r) => ({ ...r, canMake: true })),
    ...almostThere.map((r) => ({ ...r, canMake: false, missing: r.missing })),
  ].slice(0, 6);

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
                onPress={() => navigation.navigate({ name: 'Profile', params: undefined })}
                style={styles.profileButton}
              >
                <Ionicons name="person-outline" size={24} color="#4F46E5" />
              </TouchableOpacity>
            </View>
          </View>

          {/* AI Chef Feature Card */}
          <View style={styles.aiChefContainer}>
            <TouchableOpacity onPress={() => navigation.navigate({ name: 'AIChef', params: undefined })}>
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

          {/* Recipes You Can Make & Almost There */}
          <View style={styles.recipesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Recipes You Can Make
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH + SPACING}
              decelerationRate="fast"
              contentContainerStyle={{
                paddingHorizontal: (width - CARD_WIDTH) / 2,
              }}
            >
              {displayRecipes.map((recipe, index) => (
                <TouchableOpacity
                  key={recipe.id}
                  onPress={() => navigation.navigate({ name: 'RecipeDetail', params: { recipe } })}
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
                      {recipe.canMake ? (
                        <Text style={styles.availableText}>All ingredients available</Text>
                      ) : (
                        <Text style={styles.missingText}>
                          Missing: {recipe.missing ? recipe.missing.join(', ') : ''}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.sectionTitle}>
              Quick Actions
            </Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                onPress={() => navigation.navigate({ name: 'MealPlanner', params: undefined })}
                style={[styles.quickActionCard, styles.quickActionIndigo]}
              >
                <View style={[styles.quickActionIcon, styles.quickActionIconIndigo]}>
                  <Ionicons name="calendar-outline" size={24} color="#4F46E5" />
                </View>
                <Text style={styles.quickActionTitle}>Meal Planner</Text>
                <Text style={styles.quickActionSubtitle}>Plan your meals</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate({ name: 'GroceryList', params: undefined })}
                style={[styles.quickActionCard, styles.quickActionGreen]}
              >
                <View style={[styles.quickActionIcon, styles.quickActionIconGreen]}>
                  <Ionicons name="cart-outline" size={24} color="#059669" />
                </View>
                <Text style={styles.quickActionTitle}>Grocery List</Text>
                <Text style={styles.quickActionSubtitle}>View your list</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate({ name: 'Pantry', params: undefined })}
                style={[styles.quickActionCard, styles.quickActionOrange]}
              >
                <View style={[styles.quickActionIcon, styles.quickActionIconOrange]}>
                  <Ionicons name="cube-outline" size={24} color="#D97706" />
                </View>
                <Text style={styles.quickActionTitle}>My Pantry</Text>
                <Text style={styles.quickActionSubtitle}>Check inventory</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate({ name: 'AIChef', params: undefined })}
                style={[styles.quickActionCard, styles.quickActionBlue]}
              >
                <View style={[styles.quickActionIcon, styles.quickActionIconBlue]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={24} color="#2563EB" />
                </View>
                <Text style={styles.quickActionTitle}>AI Chef</Text>
                <Text style={styles.quickActionSubtitle}>Ask cooking questions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate({ name: 'Profile', params: undefined })}
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