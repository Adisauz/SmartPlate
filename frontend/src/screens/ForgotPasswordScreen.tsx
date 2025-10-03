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
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Toast } from '../components/Toast';
import api from '../utils/api';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const [username, setUsername] = useState('');
  const [resetToken, setResetToken] = useState('');
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
  const [error, setError] = useState('');

  const handleForgotPassword = async () => {
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/forgot-password', { username: username.trim() });
      
      if (response.data.reset_token) {
        // In development, we get the token directly
        setResetToken(response.data.reset_token);
        setToast({
          visible: true,
          message: 'Reset token generated! Copy it to reset your password.',
          type: 'success',
        });
      } else {
        setToast({
          visible: true,
          message: response.data.message || 'Reset token sent!',
          type: 'success',
        });
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to send reset token');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToResetPassword = () => {
    if (resetToken) {
      navigation.navigate({ name: 'ResetPassword', params: { resetToken } });
    } else {
      navigation.navigate({ name: 'ResetPassword', params: { resetToken: '' } });
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
                    Forgot Password
                  </Text>
                </View>

                <View className="items-center mb-8">
                  <Ionicons name="lock-closed" size={64} color="#4F46E5" />
                  <Text className="text-2xl font-bold text-gray-900 mt-4">
                    Reset Password
                  </Text>
                  <Text className="text-base text-gray-600 mt-2 text-center">
                    Enter your username to receive a password reset token
                  </Text>
                </View>

                <View className="space-y-4">
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Username
                    </Text>
                    <TextInput
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-indigo-500"
                      placeholder="Enter your username"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                    />
                    {error ? (
                      <Text className="text-red-500 text-sm mt-1">{error}</Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    className={`w-full py-3 rounded-lg mt-6 ${
                      isLoading ? 'bg-gray-400' : 'bg-indigo-600'
                    }`}
                    onPress={handleForgotPassword}
                    disabled={isLoading}
                  >
                    <Text className="text-white text-center font-semibold text-lg">
                      {isLoading ? 'Sending...' : 'Send Reset Token'}
                    </Text>
                  </TouchableOpacity>

                  {resetToken ? (
                    <View className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Text className="text-sm font-medium text-yellow-800 mb-2">
                        Development Mode - Reset Token:
                      </Text>
                      <Text className="text-xs font-mono text-yellow-700 bg-yellow-100 p-2 rounded">
                        {resetToken}
                      </Text>
                      <TouchableOpacity
                        className="w-full bg-yellow-600 py-2 rounded-lg mt-3"
                        onPress={navigateToResetPassword}
                      >
                        <Text className="text-white text-center font-medium">
                          Use This Token to Reset Password
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    className="w-full bg-gray-100 py-3 rounded-lg mt-4"
                    onPress={navigateToResetPassword}
                  >
                    <Text className="text-gray-700 text-center font-semibold">
                      I have a reset token
                    </Text>
                  </TouchableOpacity>

                  <View className="flex-row justify-center mt-6">
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

