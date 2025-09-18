import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Toast } from '../components/Toast';
import api from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const res = await api.post('/auth/login', { username: email, password });
      await AsyncStorage.setItem('token', res.data.access_token);
      await AsyncStorage.setItem('name', res.data.name || '');
      navigation.replace('Home');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Login failed');
      }
    }
  };

  const handleSkipAsGuest = () => {
    // Navigate to Home screen as guest
    navigation.replace('Home');
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            >
              <View className="flex-1 px-6 py-8">
                <View className="items-center mb-12">
                  <Ionicons name="restaurant" size={64} color="#4F46E5" />
                  <Text className="text-3xl font-bold text-gray-900 mt-4">
                    Welcome Back
                  </Text>
                  <Text className="text-base text-gray-600 mt-2">
                    Sign in to continue
                  </Text>
                </View>

                <View className="space-y-4">
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Username/Email
                    </Text>
                    <TextInput
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-indigo-500"
                      placeholder="Enter your username or email"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Password
                    </Text>
                    <View className="relative">
                      <TextInput
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-indigo-500"
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity
                        className="absolute right-4 top-3"
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off' : 'eye'}
                          size={24}
                          color="#6B7280"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => navigation.navigate('ForgotPassword')}
                    className="self-end"
                  >
                    <Text className="text-indigo-600 font-medium">
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="w-full bg-indigo-600 py-3 rounded-lg mt-6"
                    onPress={handleLogin}
                  >
                    <Text className="text-white text-center font-semibold text-lg">
                      Sign In
                    </Text>
                  </TouchableOpacity>

                  <View className="flex-row items-center justify-center mt-4">
                    <View className="flex-1 h-px bg-gray-300" />
                    <Text className="mx-4 text-gray-500">or</Text>
                    <View className="flex-1 h-px bg-gray-300" />
                  </View>

                  <TouchableOpacity
                    onPress={handleSkipAsGuest}
                    className="bg-gray-100 py-4 rounded-xl"
                  >
                    <Text className="text-gray-700 text-center font-semibold text-lg">
                      Skip as Guest
                    </Text>
                  </TouchableOpacity>

                  <View className="flex-row justify-center mt-6">
                    <Text className="text-gray-600">Don't have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Onboarding')}>
                      <Text className="text-indigo-600 font-medium">Sign Up</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
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