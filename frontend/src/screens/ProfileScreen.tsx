import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import Toast from '../components/Toast';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

type Profile = {
  id: number;
  username: string;
  name?: string;
  email?: string;
  height?: number;
  weight?: number;
  daily_calorie_goal?: number;
  daily_protein_goal?: number;
  daily_carbs_goal?: number;
  daily_fat_goal?: number;
};

type TodayNutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayNutrition, setTodayNutrition] = useState<TodayNutrition>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  
  // Edit profile fields
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editWeight, setEditWeight] = useState('');
  
  // Edit goals fields
  const [editCalorieGoal, setEditCalorieGoal] = useState('');
  const [editProteinGoal, setEditProteinGoal] = useState('');
  const [editCarbsGoal, setEditCarbsGoal] = useState('');
  const [editFatGoal, setEditFatGoal] = useState('');

  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    loadProfile();
    loadTodayNutrition();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/profile/');
      setProfile(res.data);
      
      // Set edit fields
      setEditName(res.data.name || '');
      setEditEmail(res.data.email || '');
      setEditHeight(res.data.height?.toString() || '');
      setEditWeight(res.data.weight?.toString() || '');
      setEditCalorieGoal(res.data.daily_calorie_goal?.toString() || '2000');
      setEditProteinGoal(res.data.daily_protein_goal?.toString() || '50');
      setEditCarbsGoal(res.data.daily_carbs_goal?.toString() || '250');
      setEditFatGoal(res.data.daily_fat_goal?.toString() || '70');
    } catch (err: any) {
      console.error('Error loading profile:', err);
      if (err.response?.status === 401) {
        setToast({
          visible: true,
          message: 'Session expired. Please login again.',
          type: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTodayNutrition = async () => {
    try {
      const res = await api.get('/profile/nutrition/today');
      setTodayNutrition(res.data);
    } catch (err) {
      console.error('Error loading today nutrition:', err);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updates: any = {};
      if (editName) updates.name = editName;
      if (editEmail) updates.email = editEmail;
      if (editHeight) updates.height = parseFloat(editHeight);
      if (editWeight) updates.weight = parseFloat(editWeight);

      const res = await api.put('/profile/', updates);
      setProfile(res.data);
      
      // Update AsyncStorage
      if (editName) {
        await AsyncStorage.setItem('name', editName);
      }

      setShowEditModal(false);
      setToast({
        visible: true,
        message: 'Profile updated successfully!',
        type: 'success',
      });
    } catch (err) {
      setToast({
        visible: true,
        message: 'Failed to update profile',
        type: 'error',
      });
    }
  };

  const handleSaveGoals = async () => {
    try {
      const updates: any = {};
      if (editCalorieGoal) updates.daily_calorie_goal = parseInt(editCalorieGoal);
      if (editProteinGoal) updates.daily_protein_goal = parseInt(editProteinGoal);
      if (editCarbsGoal) updates.daily_carbs_goal = parseInt(editCarbsGoal);
      if (editFatGoal) updates.daily_fat_goal = parseInt(editFatGoal);

      const res = await api.put('/profile/', updates);
      setProfile(res.data);

      setShowGoalsModal(false);
      setToast({
        visible: true,
        message: 'Goals updated successfully!',
        type: 'success',
      });
    } catch (err) {
      setToast({
        visible: true,
        message: 'Failed to update goals',
        type: 'error',
      });
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            setToast({
              visible: true,
              message: 'Logged out successfully',
              type: 'success',
            });
            setTimeout(() => {
              navigation.navigate('Login');
            }, 1000);
          },
        },
      ]
    );
  };

  const calculatePercentage = (current: number, goal: number) => {
    if (!goal) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const NutritionCard = ({ 
    title, 
    current, 
    goal, 
    unit, 
    color, 
    icon 
  }: { 
    title: string; 
    current: number; 
    goal: number; 
    unit: string; 
    color: string; 
    icon: any;
  }) => {
    const percentage = calculatePercentage(current, goal);
    
    return (
      <View style={styles.nutritionCard}>
        <View style={styles.nutritionHeader}>
          <View style={[styles.nutritionIcon, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
          <Text style={styles.nutritionTitle}>{title}</Text>
        </View>
        
        <View style={styles.nutritionProgress}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${percentage}%`, backgroundColor: color }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{Math.round(percentage)}%</Text>
        </View>
        
        <View style={styles.nutritionStats}>
          <Text style={styles.currentValue}>{current}{unit}</Text>
          <Text style={styles.goalValue}>/ {goal}{unit}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile?.name || profile?.username || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          
          <Text style={styles.profileName}>{profile?.name || profile?.username}</Text>
          <Text style={styles.profileEmail}>{profile?.email || 'No email set'}</Text>
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setShowEditModal(true)}
          >
            <Ionicons name="create-outline" size={18} color="#4F46E5" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="resize-outline" size={24} color="#4F46E5" />
            <Text style={styles.statValue}>{profile?.height || '--'}</Text>
            <Text style={styles.statLabel}>Height (cm)</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="fitness-outline" size={24} color="#059669" />
            <Text style={styles.statValue}>{profile?.weight || '--'}</Text>
            <Text style={styles.statLabel}>Weight (kg)</Text>
          </View>
        </View>

        {/* Daily Nutrition Dashboard */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Nutrition</Text>
            <TouchableOpacity onPress={() => setShowGoalsModal(true)}>
              <Ionicons name="settings-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <NutritionCard
            title="Calories"
            current={todayNutrition.calories}
            goal={profile?.daily_calorie_goal || 2000}
            unit=" kcal"
            color="#EF4444"
            icon="flame"
          />

          <NutritionCard
            title="Protein"
            current={todayNutrition.protein}
            goal={profile?.daily_protein_goal || 50}
            unit="g"
            color="#3B82F6"
            icon="barbell"
          />

          <NutritionCard
            title="Carbs"
            current={todayNutrition.carbs}
            goal={profile?.daily_carbs_goal || 250}
            unit="g"
            color="#F59E0B"
            icon="nutrition"
          />

          <NutritionCard
            title="Fat"
            current={todayNutrition.fat}
            goal={profile?.daily_fat_goal || 70}
            unit="g"
            color="#8B5CF6"
            icon="water"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => navigation.navigate('MealPlanner')}
          >
            <Ionicons name="calendar-outline" size={24} color="#4F46E5" />
            <Text style={styles.actionText}>View Meal Plan</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => navigation.navigate('SavedMeals')}
          >
            <Ionicons name="bookmark-outline" size={24} color="#059669" />
            <Text style={styles.actionText}>Saved Meals</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => setShowGoalsModal(true)}
          >
            <Ionicons name="trophy-outline" size={24} color="#F59E0B" />
            <Text style={styles.actionText}>Set Daily Goals</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter your name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={editHeight}
                  onChangeText={setEditHeight}
                  placeholder="Enter your height"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={editWeight}
                  onChangeText={setEditWeight}
                  placeholder="Enter your weight"
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Goals Modal */}
      <Modal
        visible={showGoalsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGoalsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Daily Nutrition Goals</Text>
              <TouchableOpacity onPress={() => setShowGoalsModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Daily Calorie Goal (kcal)</Text>
                <TextInput
                  style={styles.input}
                  value={editCalorieGoal}
                  onChangeText={setEditCalorieGoal}
                  placeholder="2000"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Daily Protein Goal (g)</Text>
                <TextInput
                  style={styles.input}
                  value={editProteinGoal}
                  onChangeText={setEditProteinGoal}
                  placeholder="50"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Daily Carbs Goal (g)</Text>
                <TextInput
                  style={styles.input}
                  value={editCarbsGoal}
                  onChangeText={setEditCarbsGoal}
                  placeholder="250"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Daily Fat Goal (g)</Text>
                <TextInput
                  style={styles.input}
                  value={editFatGoal}
                  onChangeText={setEditFatGoal}
                  placeholder="70"
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveGoals}
              >
                <Text style={styles.saveButtonText}>Save Goals</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  logoutButton: {
    padding: 8,
  },
  profileCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    gap: 6,
  },
  editButtonText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  nutritionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nutritionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  nutritionProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    minWidth: 40,
    textAlign: 'right',
  },
  nutritionStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  goalValue: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalForm: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});