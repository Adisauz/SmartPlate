import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet,
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
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Ionicons name="chevron-back" size={24} color="#4F46E5" />
              </TouchableOpacity>
              <Text style={styles.title}>Meal Planner</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.addButton}
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
            style={styles.daySelector}
          >
            {days.map((day, index) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  selectedDay === index && styles.dayButtonActive
                ]}
                onPress={() => setSelectedDay(index)}
              >
                <Text
                  style={[
                    styles.dayText,
                    selectedDay === index && styles.dayTextActive
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Meals */}
          <View style={styles.mealsContainer}>
            {meals.map((meal) => (
              <View
                key={meal}
                style={styles.mealCard}
              >
                <View style={styles.mealHeader}>
                  <Text style={styles.mealTitle}>
                    {meal}
                  </Text>
                  <TouchableOpacity
                    style={styles.mealAddButton}
                    onPress={() => onPressAddForDay(selectedDay)}
                  >
                    <Ionicons name="add" size={20} color="#4F46E5" />
                  </TouchableOpacity>
                </View>

                {/* Planned meals for selected day */}
                <View style={styles.plannedMeals}>
                  {dayMeals[selectedDay] && dayMeals[selectedDay].length > 0 ? (
                    dayMeals[selectedDay].map((m) => (
                      <View key={m.id} style={styles.plannedMealItem}>
                        <View style={styles.mealBullet} />
                        <Text style={styles.plannedMealText}>{m.name}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noMealsText}>No meals planned</Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsTitle}>
              Quick Actions
            </Text>
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={[styles.quickActionCard, styles.quickActionGrocery]}
                onPress={() => navigation.navigate({ name: 'GroceryList', params: undefined })}
              >
                <Ionicons name="cart" size={24} color="#4F46E5" />
                <Text style={styles.quickActionGroceryText}>
                  Generate Shopping List
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickActionCard, styles.quickActionSave]}
                onPress={() => {
                  // TODO: Save meal plan
                }}
              >
                <Ionicons name="save" size={24} color="#10B981" />
                <Text style={styles.quickActionSaveText}>
                  Save Plan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Meal Picker Modal */}
      <Modal visible={pickerVisible} animationType="slide" transparent onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a meal</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
            {loadingMeals ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#4F46E5" />
              </View>
            ) : (
              <ScrollView style={styles.modalScroll}>
                {availableMeals.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.modalMealItem}
                    onPress={async () => {
                      if (pendingDay == null) return;
                      await ensurePlanAndAdd(pendingDay, m.id);
                      setPickerVisible(false);
                    }}
                  >
                    <Text style={styles.modalMealText}>{m.name}</Text>
                  </TouchableOpacity>
                ))}
                {availableMeals.length === 0 && (
                  <Text style={styles.modalNoMeals}>No saved meals yet</Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

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
    marginBottom: 16,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelector: {
    paddingHorizontal: 24,
  },
  dayButton: {
    marginRight: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  dayButtonActive: {
    backgroundColor: '#4F46E5',
  },
  dayText: {
    fontWeight: '500',
    color: '#6B7280',
  },
  dayTextActive: {
    color: 'white',
  },
  mealsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  mealCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  mealAddButton: {
    width: 32,
    height: 32,
    backgroundColor: 'white',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plannedMeals: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
  },
  plannedMealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  mealBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    marginRight: 12,
  },
  plannedMealText: {
    flex: 1,
    color: '#111827',
  },
  noMealsText: {
    color: '#6B7280',
    textAlign: 'center',
  },
  quickActionsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  quickActionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
  },
  quickActionGrocery: {
    backgroundColor: '#EEF2FF',
  },
  quickActionSave: {
    backgroundColor: '#D1FAE5',
  },
  quickActionGroceryText: {
    color: '#4F46E5',
    fontWeight: '500',
    marginTop: 8,
  },
  quickActionSaveText: {
    color: '#059669',
    fontWeight: '500',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  modalCloseText: {
    color: '#4F46E5',
  },
  modalLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalMealItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalMealText: {
    color: '#111827',
  },
  modalNoMeals: {
    color: '#6B7280',
    paddingVertical: 24,
    textAlign: 'center',
  },
});