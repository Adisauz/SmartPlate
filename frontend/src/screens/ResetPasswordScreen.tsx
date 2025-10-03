import React, { useState, useEffect } from 'react';
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
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Toast } from '../components/Toast';
import api from '../utils/api';

type ResetPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>;
type ResetPasswordScreenRouteProp = RouteProp<RootStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen = () => {
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const route = useRoute<ResetPasswordScreenRouteProp>();
  
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });
  const [errors, setErrors] = useState<{
    token?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    // Set reset token from navigation params if provided
    if (route.params?.resetToken) {
      setResetToken(route.params.resetToken);
    }
  }, [route.params]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!resetToken.trim()) {
      newErrors.token = 'Reset token is required';
    }

    if (!newPassword) {
      newErrors.password = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await api.post('/auth/reset-password', {
        token: resetToken.trim(),
        new_password: newPassword,
      });

      setToast({
        visible: true,
        message: 'Password reset successfully! Please login with your new password.',
        type: 'success',
      });

      // Navigate to login screen after a short delay
      setTimeout(() => {
        navigation.navigate({ name: 'Login', params: undefined });
      }, 2000);
    } catch (err: any) {
      let errorMessage = 'Failed to reset password';
      
      if (err.response && err.response.data && err.response.data.detail) {
        errorMessage = err.response.data.detail;
      }

      setToast({
        visible: true,
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
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
                {/* Header */}
                <View className="flex-row items-center mb-8">
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="mr-4"
                  >
                    <Ionicons name="arrow-back" size={24} color="#374151" />
                  </TouchableOpacity>
                  <Text className="text-xl font-semibold text-gray-900">
                    Reset Password
                  </Text>
                </View>

                <View className="items-center mb-8">
                  <Ionicons name="key" size={64} color="#4F46E5" />
                  <Text className="text-2xl font-bold text-gray-900 mt-4">
                    Create New Password
                  </Text>
                  <Text className="text-base text-gray-600 mt-2 text-center">
                    Enter your reset token and choose a new password
                  </Text>
                </View>

                <View className="space-y-4">
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Reset Token
                    </Text>
                    <TextInput
                      className={`w-full px-4 py-3 border rounded-lg focus:border-indigo-500 ${
                        errors.token ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your reset token"
                      value={resetToken}
                      onChangeText={setResetToken}
                      multiline={true}
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                    {errors.token ? (
                      <Text className="text-red-500 text-sm mt-1">{errors.token}</Text>
                    ) : null}
                  </View>

                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </Text>
                    <View className="relative">
                      <TextInput
                        className={`w-full px-4 py-3 border rounded-lg focus:border-indigo-500 ${
                          errors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChangeText={setNewPassword}
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
                    {errors.password ? (
                      <Text className="text-red-500 text-sm mt-1">{errors.password}</Text>
                    ) : null}
                  </View>

                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </Text>
                    <View className="relative">
                      <TextInput
                        className={`w-full px-4 py-3 border rounded-lg focus:border-indigo-500 ${
                          errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                      />
                      <TouchableOpacity
                        className="absolute right-4 top-3"
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <Ionicons
                          name={showConfirmPassword ? 'eye-off' : 'eye'}
                          size={24}
                          color="#6B7280"
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.confirmPassword ? (
                      <Text className="text-red-500 text-sm mt-1">{errors.confirmPassword}</Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    className={`w-full py-3 rounded-lg mt-6 ${
                      isLoading ? 'bg-gray-400' : 'bg-indigo-600'
                    }`}
                    onPress={handleResetPassword}
                    disabled={isLoading}
                  >
                    <Text className="text-white text-center font-semibold text-lg">
                      {isLoading ? 'Resetting...' : 'Reset Password'}
                    </Text>
                  </TouchableOpacity>

                  <View className="flex-row justify-center mt-6">
                    <Text className="text-gray-600">Don't have a token? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate({ name: 'ForgotPassword', params: undefined })}>
                      <Text className="text-indigo-600 font-medium">Get Reset Token</Text>
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row justify-center mt-2">
                    <Text className="text-gray-600">Remember your password? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate({ name: 'Login', params: undefined })}>
                      <Text className="text-indigo-600 font-medium">Sign In</Text>
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


