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
  // Store meals by day and meal type: { 0: { 'Breakfast': [...], 'Lunch': [...] }, 1: {...}, ... }
  const [dayMeals, setDayMeals] = useState<Record<number, Record<string, Array<{ id: number; name: string }>>>>({});
  const [pendingDay, setPendingDay] = useState<number | null>(null);
  const [pendingMealType, setPendingMealType] = useState<string | null>(null);

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

  const loadMealPlan = async () => {
    try {
      const res = await api.get('/plans/');
      if (res.data && res.data.length > 0) {
        const plan = res.data[0]; // Get the first/active plan
        setPlanId(plan.id);
        
        // Load all meals for this plan
        const planRes = await api.get(`/plans/${plan.id}`);
        if (planRes.data && planRes.data.items) {
          // Group meals by day and meal type
          const groupedMeals: Record<number, Record<string, Array<{ id: number; name: string }>>> = {};
          
          for (const item of planRes.data.items) {
            try {
              const mealRes = await api.get(`/meals/${item.meal_id}`);
              const meal = { id: mealRes.data.id, name: mealRes.data.name };
              
              if (!groupedMeals[item.day]) {
                groupedMeals[item.day] = {};
              }
              
              // Use the meal_type from the backend
              const mealType = item.meal_type || 'Breakfast';
              if (!groupedMeals[item.day][mealType]) {
                groupedMeals[item.day][mealType] = [];
              }
              groupedMeals[item.day][mealType].push(meal);
            } catch (mealError) {
              // Skip meals that no longer exist (404 errors)
              console.log(`Skipping meal ${item.meal_id} - not found in database`);
            }
          }
          
          setDayMeals(groupedMeals);
        }
      }
    } catch (e) {
      console.error('Error loading meal plan:', e);
    }
  };

  useEffect(() => {
    fetchMeals();
    loadMealPlan();
  }, []);

  const ensurePlanAndAdd = async (day: number, mealType: string, mealId: number) => {
    if (planId == null) {
      const startDate = new Date();
      const iso = startDate.toISOString().slice(0, 10);
      const res = await api.post('/plans/', {
        start_date: iso,
        items: [{ day, meal_id: mealId, meal_type: mealType }],
      });
      setPlanId(res.data.id);
    } else {
      await api.post(`/plans/${planId}/add-meal`, { day, meal_id: mealId, meal_type: mealType });
    }

    setDayMeals((prev) => {
      const dayData = prev[day] ?? {};
      const current = dayData[mealType] ?? [];
      const exists = current.some((m) => m.id === mealId);
      const meal = availableMeals.find((m) => m.id === mealId);
      if (!meal) return prev;
      
      return {
        ...prev,
        [day]: {
          ...dayData,
          [mealType]: exists ? current : [...current, meal]
        }
      };
    });
  };

  const onPressAddForMealType = (day: number, mealType: string) => {
    setPendingDay(day);
    setPendingMealType(mealType);
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
            {meals.map((meal) => {
              const mealsForType = dayMeals[selectedDay]?.[meal] ?? [];
              
              return (
                <View
                  key={meal}
                  style={styles.mealCard}
                >
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealTitle}>
                      {meal}
                    </Text>
                    <View style={styles.mealHeaderButtons}>
                      <TouchableOpacity
                        style={styles.aiButton}
                        onPress={() => navigation.navigate({ 
                          name: 'AIChef', 
                          params: { 
                            initialPrompt: `Suggest some ${meal.toLowerCase()} recipes for me` 
                          } 
                        })}
                      >
                        <Ionicons name="sparkles" size={18} color="#9333EA" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.mealAddButton}
                        onPress={() => onPressAddForMealType(selectedDay, meal)}
                      >
                        <Ionicons name="add" size={20} color="#4F46E5" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Planned meals for selected day and meal type */}
                  <View style={styles.plannedMeals}>
                    {mealsForType.length > 0 ? (
                      mealsForType.map((m, index) => (
                        <View 
                          key={`${m.id}-${index}`} 
                          style={styles.plannedMealItem}
                        >
                          <TouchableOpacity 
                            style={styles.plannedMealTouchable}
                            onPress={async () => {
                              try {
                                // Fetch full meal details
                                const res = await api.get(`/meals/${m.id}`);
                                navigation.navigate('RecipeDetail', { recipe: res.data });
                              } catch (err) {
                                console.error('Error loading meal:', err);
                              }
                            }}
                          >
                            <View style={styles.mealBullet} />
                            <Text style={styles.plannedMealText}>{m.name}</Text>
                            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginLeft: 8 }} />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.removeMealButton}
                            onPress={async () => {
                              try {
                                // Remove meal from plan
                                await api.delete(`/plans/${planId}/meals/${m.id}?day=${selectedDay}&meal_type=${meal}`);
                                // Reload the meal plan
                                await loadMealPlan();
                              } catch (err) {
                                console.error('Error removing meal:', err);
                              }
                            }}
                          >
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noMealsText}>No meals planned</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Meal Picker Modal - Large & Colorful */}
      <Modal visible={pickerVisible} animationType="slide" transparent onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Colorful Header */}
            <View style={styles.modalHeaderGradient}>
              <View style={styles.modalHeaderContent}>
                <View style={styles.modalIconCircle}>
                  <Ionicons 
                    name={
                      pendingMealType === 'Breakfast' ? 'sunny' :
                      pendingMealType === 'Lunch' ? 'fast-food' :
                      pendingMealType === 'Dinner' ? 'restaurant' :
                      'nutrition'
                    }
                    size={32} 
                    color="#FFFFFF" 
                  />
                </View>
                <Text style={styles.modalTitle}>
                  Add to {pendingMealType || 'Meal'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Choose a meal from your saved recipes
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setPickerVisible(false)} 
                style={styles.modalCloseButton}
              >
                <Ionicons name="close-circle" size={36} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Meals List */}
            {loadingMeals ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Loading your meals...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {availableMeals.map((m, index) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.modalMealItem,
                      index % 2 === 0 ? styles.modalMealItemEven : styles.modalMealItemOdd
                    ]}
                    onPress={async () => {
                      if (pendingDay == null || pendingMealType == null) return;
                      await ensurePlanAndAdd(pendingDay, pendingMealType, m.id);
                      setPickerVisible(false);
                    }}
                  >
                    <View style={styles.modalMealIcon}>
                      <Ionicons name="restaurant" size={20} color="#4F46E5" />
                    </View>
                    <Text style={styles.modalMealText}>{m.name}</Text>
                    <Ionicons name="add-circle" size={28} color="#10B981" />
                  </TouchableOpacity>
                ))}
                {availableMeals.length === 0 && (
                  <View style={styles.modalEmptyState}>
                    <Ionicons name="restaurant-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.modalNoMeals}>No saved meals yet</Text>
                    <Text style={styles.modalEmptyHint}>
                      Save meals from AI Chef or Recipe Details
                    </Text>
                  </View>
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
  mealHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiButton: {
    width: 32,
    height: 32,
    backgroundColor: '#FAF5FF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
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
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    borderRadius: 8,
  },
  plannedMealTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  removeMealButton: {
    padding: 8,
    marginLeft: 8,
  },
  noMealsText: {
    color: '#6B7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeaderGradient: {
    backgroundColor: '#4F46E5',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
    position: 'relative',
  },
  modalHeaderContent: {
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  modalLoading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalMealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modalMealItemEven: {
    backgroundColor: '#F0F9FF',
  },
  modalMealItemOdd: {
    backgroundColor: '#FAF5FF',
  },
  modalMealIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalMealText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  modalEmptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  modalNoMeals: {
    color: '#6B7280',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  modalEmptyHint: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});