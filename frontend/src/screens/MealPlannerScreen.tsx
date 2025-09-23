import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

type MealPlannerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MealPlanner'>;

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

const createMealPlan = async (plan: any) => {
  try {
    await api.post('/plans/', plan);
    // Refresh plans or show success
  } catch (err) {
    // Handle error
  }
};

export const MealPlannerScreen = () => {
  const navigation = useNavigation<MealPlannerScreenNavigationProp>();
  // Set selectedDay to the current day of the week (0=Mon, 6=Sun)
  const today = new Date();
  // getDay(): 0=Sun, 1=Mon, ..., 6=Sat; adjust to 0=Mon
  const jsDay = today.getDay();
  const initialDay = jsDay === 0 ? 6 : jsDay - 1;
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [planId, setPlanId] = useState<number | null>(null);
  const [availableMeals, setAvailableMeals] = useState<Array<{ id: number; name: string }>>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [dayMeals, setDayMeals] = useState<Record<number, Array<{ id: number; name: string }>>>({});
  const [pendingDay, setPendingDay] = useState<number | null>(null);

  const fetchMeals = async () => {
    try {
      setLoadingMeals(true);
      const res = await api.get('/meals/');
      const items = Array.isArray(res.data)
        ? res.data.map((m: any) => ({ id: m.id, name: m.name }))
        : [];
      setAvailableMeals(items);
    } catch (e) {
      // ignore
    } finally {
      setLoadingMeals(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const ensurePlanAndAdd = async (day: number, mealId: number) => {
    if (planId == null) {
      const startDate = new Date();
      const iso = startDate.toISOString().slice(0, 10);
      const res = await api.post('/plans/', {
        start_date: iso,
        items: [{ day, meal_id: mealId }],
      });
      setPlanId(res.data.id);
    } else {
      await api.post(`/plans/${planId}/add-meal`, { day, meal_id: mealId });
    }

    setDayMeals((prev) => {
      const current = prev[day] ?? [];
      const exists = current.some((m) => m.id === mealId);
      const meal = availableMeals.find((m) => m.id === mealId);
      if (!meal) return prev;
      return { ...prev, [day]: exists ? current : [...current, meal] };
    });
  };

  const onPressAddForDay = (day: number) => {
    setPendingDay(day);
    setPickerVisible(true);
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1">
          {/* Header */}
          <View className="px-4 py-4">
            <View className="flex-row items-center mb-4">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3"
              >
                <Ionicons name="chevron-back" size={24} color="#4F46E5" />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-gray-900">Meal Planner</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center"
                onPress={() => {
                  // TODO: Add new meal plan
                }}
              >
                <Ionicons name="add" size={24} color="#4F46E5" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Day Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-6"
          >
            {days.map((day, index) => (
              <TouchableOpacity
                key={day}
                className={`mr-4 py-2 px-4 rounded-full ${
                  selectedDay === index
                    ? 'bg-indigo-600'
                    : 'bg-gray-100'
                }`}
                onPress={() => setSelectedDay(index)}
              >
                <Text
                  className={`font-medium ${
                    selectedDay === index
                      ? 'text-white'
                      : 'text-gray-600'
                  }`}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Meals */}
          <View className="px-6 py-4">
            {meals.map((meal) => (
              <View
                key={meal}
                className="bg-gray-50 rounded-xl p-4 mb-4"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-lg font-semibold text-gray-900">
                    {meal}
                  </Text>
                  <TouchableOpacity
                    className="w-8 h-8 bg-white rounded-full items-center justify-center"
                    onPress={() => onPressAddForDay(selectedDay)}
                  >
                    <Ionicons name="add" size={20} color="#4F46E5" />
                  </TouchableOpacity>
                </View>

                {/* Planned meals for selected day */}
                <View className="bg-white rounded-lg p-3">
                  {dayMeals[selectedDay] && dayMeals[selectedDay].length > 0 ? (
                    dayMeals[selectedDay].map((m) => (
                      <View key={m.id} className="flex-row items-center py-2 border-b border-gray-100">
                        <View className="w-2 h-2 rounded-full bg-indigo-600 mr-3" />
                        <Text className="flex-1 text-gray-900">{m.name}</Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-gray-600 text-center">No meals planned</Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <View className="px-6 py-4">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </Text>
            <View className="flex-row space-x-4">
              <TouchableOpacity
                className="flex-1 bg-indigo-100 p-4 rounded-xl"
                onPress={() => navigation.navigate('GroceryList')}
              >
                <Ionicons name="cart" size={24} color="#4F46E5" />
                <Text className="text-indigo-600 font-medium mt-2">
                  Generate Shopping List
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-green-100 p-4 rounded-xl"
                onPress={() => {
                  // TODO: Save meal plan
                }}
              >
                <Ionicons name="save" size={24} color="#10B981" />
                <Text className="text-green-600 font-medium mt-2">
                  Save Plan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Meal Picker Modal */}
      <Modal visible={pickerVisible} animationType="slide" transparent onRequestClose={() => setPickerVisible(false)}>
        <View className="flex-1 bg-black/30 justify-end">
          <View className="bg-white rounded-t-2xl p-4" style={{ maxHeight: '60%' }}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-semibold">Select a meal</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)} className="px-3 py-1">
                <Text className="text-indigo-600">Close</Text>
              </TouchableOpacity>
            </View>
            {loadingMeals ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="large" color="#4F46E5" />
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 400 }}>
                {availableMeals.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    className="py-3 border-b border-gray-100"
                    onPress={async () => {
                      if (pendingDay == null) return;
                      await ensurePlanAndAdd(pendingDay, m.id);
                      setPickerVisible(false);
                    }}
                  >
                    <Text className="text-gray-900">{m.name}</Text>
                  </TouchableOpacity>
                ))}
                {availableMeals.length === 0 && (
                  <Text className="text-gray-600 py-6 text-center">No saved meals yet</Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
};