import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ToastProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
  onDismiss: () => void;
}

export const Toast = ({ visible, message, type, onDismiss }: ToastProps) => {
  const translateY = new Animated.Value(100);

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      const timer = setTimeout(() => {
        onDismiss();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(translateY, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.wrapper}>
      <SafeAreaView>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY }],
              backgroundColor: type === 'success' ? '#10B981' : '#EF4444',
            },
          ]}
        >
          <View style={styles.content}>
            <Ionicons
              name={type === 'success' ? 'checkmark-circle' : 'alert-circle'}
              size={24}
              color="white"
            />
            <Text style={styles.message}>
              {message}
            </Text>
            <TouchableOpacity onPress={onDismiss}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
}); 