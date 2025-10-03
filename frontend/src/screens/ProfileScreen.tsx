import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Ionicons from '@expo/vector-icons/Ionicons';
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
  navigation.navigate({ name: 'Login', params: undefined });
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
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView}>
          {/* Profile Header */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={48} color="#4F46E5" />
            </View>
            <Text style={styles.name}>
              John Doe
            </Text>
            <Text style={styles.email}>john.doe@example.com</Text>
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item.route)}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color="#4F46E5" />
                </View>
                <Text style={styles.menuItemText}>
                  {item.title}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Dark Mode Toggle */}
          <View style={styles.darkModeContainer}>
            <View style={styles.darkModeRow}>
              <View style={styles.darkModeLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name="moon" size={20} color="#4F46E5" />
                </View>
                <Text style={styles.menuItemText}>Dark Mode</Text>
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
          <View style={styles.logoutContainer}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>
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
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  email: {
    color: '#6B7280',
  },
  menuContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  darkModeContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  darkModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  darkModeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  logoutButton: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutText: {
    color: '#DC2626',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },
}); 