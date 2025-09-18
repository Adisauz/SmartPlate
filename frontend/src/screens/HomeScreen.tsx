import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
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
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-4 py-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-gray-900">
                  Hello, {userName}
                </Text>
                <Text className="text-gray-600">What's cooking today?</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Profile')}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              >
                <Ionicons name="person-outline" size={24} color="#4F46E5" />
              </TouchableOpacity>
            </View>
          </View>

          {/* AI Chef Feature Card */}
          <View className="px-4 mb-6">
            <TouchableOpacity
              onPress={() => navigation.navigate('AIChef')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6"
              style={{
                backgroundColor: '#4F46E5',
                shadowColor: '#4F46E5',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <Text className="text-2xl mr-2">🤖</Text>
                    <Text className="text-white font-bold text-lg">AI Chef Assistant</Text>
                  </View>
                  <Text className="text-blue-100 text-sm mb-3">
                    Get instant cooking advice, recipe suggestions, and meal planning help
                  </Text>
                  <View className="bg-white/20 self-start px-3 py-1 rounded-full">
                    <Text className="text-white text-xs font-medium">Ask me anything! 💬</Text>
                  </View>
                </View>
                <View className="ml-4">
                  <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                    <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Recipes You Can Make & Almost There */}
          <View className="mt-4">
            <View className="px-4 mb-4">
              <Text className="text-xl font-bold text-gray-900">
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
                  onPress={() => navigation.navigate('RecipeDetail')}
                  className="mr-4"
                  style={{ width: CARD_WIDTH }}
                >
                  <View className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <Image
                      source={{ uri: recipe.image }}
                      className="w-full h-48"
                      resizeMode="cover"
                    />
                    <View className="p-4">
                      <Text className="text-lg font-bold text-gray-900 mb-2">
                        {recipe.name}
                      </Text>
                      {recipe.canMake ? (
                        <Text className="text-green-600 font-medium mb-2">All ingredients available</Text>
                      ) : (
                        <Text className="text-orange-600 font-medium mb-2">
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
          <View className="px-4 mt-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Quick Actions
            </Text>
            <View className="flex-row flex-wrap justify-between">
              <TouchableOpacity
                onPress={() => navigation.navigate('MealPlanner')}
                className="w-[48%] bg-indigo-50 p-4 rounded-xl mb-4"
              >
                <View className="w-12 h-12 bg-indigo-100 rounded-full items-center justify-center mb-2">
                  <Ionicons name="calendar-outline" size={24} color="#4F46E5" />
                </View>
                <Text className="text-gray-900 font-medium">Meal Planner</Text>
                <Text className="text-gray-500 text-sm">Plan your meals</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('GroceryList')}
                className="w-[48%] bg-green-50 p-4 rounded-xl mb-4"
              >
                <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mb-2">
                  <Ionicons name="cart-outline" size={24} color="#059669" />
                </View>
                <Text className="text-gray-900 font-medium">Grocery List</Text>
                <Text className="text-gray-500 text-sm">View your list</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Pantry')}
                className="w-[48%] bg-orange-50 p-4 rounded-xl"
              >
                <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mb-2">
                  <Ionicons name="cube-outline" size={24} color="#D97706" />
                </View>
                <Text className="text-gray-900 font-medium">My Pantry</Text>
                <Text className="text-gray-500 text-sm">Check inventory</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('AIChef')}
                className="w-[48%] bg-blue-50 p-4 rounded-xl mb-4"
              >
                <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-2">
                  <Ionicons name="chatbubble-ellipses-outline" size={24} color="#2563EB" />
                </View>
                <Text className="text-gray-900 font-medium">AI Chef</Text>
                <Text className="text-gray-500 text-sm">Ask cooking questions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Profile')}
                className="w-[48%] bg-purple-50 p-4 rounded-xl"
              >
                <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mb-2">
                  <Ionicons name="person-outline" size={24} color="#7C3AED" />
                </View>
                <Text className="text-gray-900 font-medium">Profile</Text>
                <Text className="text-gray-500 text-sm">View settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}; 