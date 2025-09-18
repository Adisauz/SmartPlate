import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { Toast } from '../components/Toast';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

const menuItems = [
  {
    id: '1',
    title: 'Personal Information',
    icon: 'person',
    route: 'EditProfile',
  },
  {
    id: '2',
    title: 'Dietary Preferences',
    icon: 'nutrition',
    route: 'DietaryPreferences',
  },
  {
    id: '3',
    title: 'Shopping Lists',
    icon: 'cart',
    route: 'ShoppingLists',
  },
  {
    id: '4',
    title: 'Favorites',
    icon: 'heart',
    route: 'Favorites',
  },
  {
    id: '5',
    title: 'Notifications',
    icon: 'notifications',
    route: 'Notifications',
  },
  {
    id: '6',
    title: 'Help & Support',
    icon: 'help-circle',
    route: 'Support',
  },
];

export const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const handleLogout = () => {
    setToast({
      visible: true,
      message: 'Logged out successfully',
      type: 'success',
    });
    // Navigate to login screen after a short delay
    setTimeout(() => {
      navigation.navigate('Login');
    }, 1500);
  };

  const handleMenuItemPress = (route: string) => {
    setToast({
      visible: true,
      message: `${route} screen coming soon!`,
      type: 'success',
    });
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1">
          {/* Profile Header */}
          <View className="px-6 py-8 items-center">
            <View className="w-24 h-24 rounded-full bg-indigo-100 items-center justify-center mb-4">
              <Ionicons name="person" size={48} color="#4F46E5" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              John Doe
            </Text>
            <Text className="text-gray-600">john.doe@example.com</Text>
          </View>

          {/* Menu Items */}
          <View className="px-6 py-4">
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="flex-row items-center py-4 border-b border-gray-100"
                onPress={() => handleMenuItemPress(item.route)}
              >
                <View className="w-8 h-8 rounded-full bg-indigo-100 items-center justify-center mr-4">
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color="#4F46E5" />
                </View>
                <Text className="flex-1 text-base text-gray-900">
                  {item.title}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Dark Mode Toggle */}
          <View className="px-6 py-4">
            <View className="flex-row items-center justify-between py-4">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-indigo-100 items-center justify-center mr-4">
                  <Ionicons name="moon" size={20} color="#4F46E5" />
                </View>
                <Text className="text-base text-gray-900">Dark Mode</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
                thumbColor={darkMode ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>
          </View>

          {/* Logout Button */}
          <View className="px-6 py-4">
            <TouchableOpacity
              className="w-full bg-red-50 py-3 rounded-lg"
              onPress={handleLogout}
            >
              <Text className="text-red-600 text-center font-semibold text-lg">
                Log Out
              </Text>
            </TouchableOpacity>
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
  );
}; 