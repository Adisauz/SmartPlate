import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TouchableOpacity } from 'react-native';

// Screens
import { LoginScreen } from '../screens/LoginScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MealPlannerScreen } from '../screens/MealPlannerScreen';
import { GroceryListScreen } from '../screens/GroceryListScreen';
import { PantryScreen } from '../screens/PantryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RecipeDetailScreen } from '../screens/RecipeDetailScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { AIChefScreen } from '../screens/AIChefScreen';
import { SavedMealsScreen } from '../screens/SavedMealsScreen';
import { UtensilsScreen } from '../screens/UtensilsScreen';

// Types
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: { resetToken?: string };
  Home: undefined;
  MealPlanner: undefined;
  GroceryList: undefined;
  Pantry: undefined;
  Utensils: undefined;
  Profile: undefined;
  RecipeDetail: { recipe: any };
  AIChef: { initialPrompt?: string };
  SavedMeals: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={({ route, navigation }) => ({
        headerShown: route.name !== 'Onboarding' && route.name !== 'Login' && route.name !== 'ForgotPassword' && route.name !== 'ResetPassword',
        headerTitle: '',
        headerTransparent: true,
        headerBackTitleVisible: false,
        headerLeft: ({ canGoBack }) =>
          canGoBack ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="ml-4 p-2 rounded-full bg-white/80"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color="#4F46E5"
              />
            </TouchableOpacity>
          ) : null,
        contentStyle: { backgroundColor: 'white' },
      })}
      initialRouteName="Onboarding"
    >
      <Stack.Screen 
        name="Onboarding" 
        component={OnboardingScreen}
        options={{ 
          headerShown: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ 
          headerShown: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="ResetPassword" 
        component={ResetPasswordScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          headerShown: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="MealPlanner" 
        component={MealPlannerScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Pantry"
        component={PantryScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="GroceryList"
        component={GroceryListScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          headerShown: true,
          headerTitle: 'Profile',
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: '600',
            color: '#1F2937',
          },
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{
          headerShown: false,
          headerTransparent: true,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="AIChef"
        component={AIChefScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="SavedMeals"
        component={SavedMealsScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Utensils"
        component={UtensilsScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}; 