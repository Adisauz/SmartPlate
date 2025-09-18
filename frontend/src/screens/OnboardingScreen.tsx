import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Button,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ThemeProvider, useTheme } from './ThemeContext';
import api from '../utils/api';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Welcome to MealPlanner',
    description: 'Plan your meals, manage your pantry, and never waste food again.',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop',
  },
  {
    id: '2',
    title: 'Smart Meal Planning',
    description: 'Get personalized meal suggestions based on your preferences and dietary needs.',
    image: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&auto=format&fit=crop',
  },
  {
    id: '3',
    title: 'Grocery Shopping Made Easy',
    description: 'Generate shopping lists automatically and track your pantry inventory.',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop',
  },
];

type OnboardingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

export const OnboardingScreen = () => {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const { theme, toggleTheme } = useTheme();

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: width * (currentSlideIndex + 1),
        animated: true,
      });
    } else {
      // Navigate to Login screen and replace the current screen
      navigation.replace('Login');
    }
  };

  const handleSkip = () => {
    // Navigate to Login screen and replace the current screen
    navigation.replace('Login');
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentSlideIndex(index);
  };

  return (
    <ThemeProvider>
      <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#222' : '#fff' }}>
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-1">
            {/* Skip button */}
            <TouchableOpacity
              onPress={handleSkip}
              className="absolute right-4 top-4 z-10"
            >
              <Text className="text-indigo-600 font-medium">Skip</Text>
            </TouchableOpacity>

            {/* Slides */}
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              className="flex-1"
            >
              {slides.map((slide) => (
                <View
                  key={slide.id}
                  style={{ width }}
                  className="items-center justify-center px-4"
                >
                  <Image
                    source={{ uri: slide.image }}
                    className="w-72 h-72 mb-8 rounded-xl"
                    resizeMode="cover"
                    onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
                  />
                  <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
                    {slide.title}
                  </Text>
                  <Text className="text-base text-gray-600 text-center mb-8">
                    {slide.description}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Pagination */}
            <View className="flex-row justify-center mb-8">
              {slides.map((_, index) => (
                <View
                  key={index}
                  className={`h-2 w-2 rounded-full mx-1 ${
                    index === currentSlideIndex ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </View>

            {/* Next/Get Started button */}
            <View className="px-4 mb-8">
              <TouchableOpacity
                onPress={handleNext}
                className="bg-indigo-600 py-4 rounded-xl"
              >
                <Text className="text-white text-center font-semibold text-lg">
                  {currentSlideIndex === slides.length - 1 ? 'Get Started' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              onPress={toggleTheme}
            />
          </View>
        </SafeAreaView>
      </View>
    </ThemeProvider>
  );
};

const AskAIScreen = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const slideUpAnimation = useRef(new Animated.Value(0)).current;
  const answerOpacity = useRef(new Animated.Value(0)).current;

  const resetAnimation = () => {
    slideUpAnimation.setValue(0);
    answerOpacity.setValue(0);
    setAnswer('');
  };

  const handleQuestionChange = (text: string) => {
    setQuestion(text);
    // Reset animation if user starts typing a new question after getting an answer
    if (answer && text !== question) {
      resetAnimation();
    }
  };

  const askAI = async () => {
    if (!question.trim()) return;
    
    setIsAsking(true);
    
    // Reset previous answer opacity if exists
    if (answer) {
      answerOpacity.setValue(0);
    }
    
    // Animate textbox up
    Animated.timing(slideUpAnimation, {
      toValue: -40,
      duration: 300,
      useNativeDriver: true,
    }).start();

    try {
      const res = await api.post('/ask-ai/', { question });
      setAnswer(res.data.answer);
      
      // Fade in the answer
      Animated.timing(answerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      setAnswer('Error getting answer');
      Animated.timing(answerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <View style={{ padding: 16, minHeight: 200 }}>
      <Animated.View 
        style={{
          transform: [{ translateY: slideUpAnimation }],
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
          Ask the AI Chef
        </Text>
        <TextInput
          placeholder="What would you like to know about cooking?"
          value={question}
          onChangeText={handleQuestionChange}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
            backgroundColor: '#fff',
            fontSize: 16,
          }}
          editable={!isAsking}
          multiline={true}
          numberOfLines={2}
        />
        <TouchableOpacity
          style={{
            backgroundColor: isAsking ? '#9CA3AF' : '#4F46E5',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
          }}
          onPress={askAI}
          disabled={isAsking}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
            {isAsking ? 'Asking...' : 'Ask AI'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
      
      {answer ? (
        <Animated.View 
          style={{ 
            marginTop: 20,
            opacity: answerOpacity,
            backgroundColor: '#F0F9FF',
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#BAE6FD',
          }}
        >
          <Text style={{ fontWeight: 'bold', marginBottom: 8, color: '#0369A1' }}>
            🍳 AI Chef Says:
          </Text>
          <Text style={{ color: '#374151', lineHeight: 22, fontSize: 14 }}>
            {answer}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
};

export default AskAIScreen; 

















































