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
    title: '🍽️ Welcome to SmartPlate',
    description: 'Your AI-powered meal planning companion. Plan smarter, cook better, eat healthier.',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop',
    icon: '👋',
    color: '#4F46E5',
  },
  {
    id: '2',
    title: '🤖 AI Chef Assistant',
    description: 'Chat with your personal AI chef! Get instant recipe ideas, cooking tips, and meal suggestions tailored to your pantry.',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&auto=format&fit=crop',
    icon: '🍳',
    color: '#059669',
  },
  {
    id: '3',
    title: '📸 Smart Pantry Detection',
    description: 'Snap a photo of your groceries and let AI automatically identify items. Computer vision powered by YOLO technology.',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop',
    icon: '📦',
    color: '#DC2626',
  },
  {
    id: '4',
    title: '📅 Weekly Meal Planner',
    description: 'Plan your meals by day and type - breakfast, lunch, dinner, and snacks. Track nutrition goals effortlessly.',
    image: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&auto=format&fit=crop',
    icon: '📋',
    color: '#7C3AED',
  },
  {
    id: '5',
    title: '🎨 AI-Generated Recipe Images',
    description: 'Every recipe comes with beautiful, appetizing images created by Stable Diffusion AI. Visualize before you cook!',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop',
    icon: '🖼️',
    color: '#F59E0B',
  },
  {
    id: '6',
    title: '🥗 Dietary Preferences',
    description: 'Set your diet type, allergies, and cuisine preferences. Get personalized recipes that match your lifestyle.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop',
    icon: '🌱',
    color: '#10B981',
  },
  {
    id: '7',
    title: '🛒 Smart Grocery Lists',
    description: 'Auto-generate shopping lists from your meal plans. Add individual ingredients with one tap.',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop',
    icon: '✅',
    color: '#06B6D4',
  },
  {
    id: '8',
    title: '📊 Nutrition Tracking',
    description: 'Monitor calories, protein, carbs, and fats. Set daily goals and track your progress in real-time.',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop',
    icon: '💪',
    color: '#EF4444',
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
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.innerContainer}>
            {/* Skip button */}
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            {/* Slides */}
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={styles.scrollView}
            >
              {slides.map((slide) => (
                <View
                  key={slide.id}
                  style={[styles.slideContainer, { width }]}
                >
                  <View style={[styles.iconContainer, { backgroundColor: slide.color + '20' }]}>
                    <Text style={styles.iconEmoji}>{slide.icon}</Text>
                  </View>
                  <Image
                    source={{ uri: slide.image }}
                    style={styles.slideImage}
                    resizeMode="cover"
                    onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
                  />
                  <View style={[styles.titleBadge, { backgroundColor: slide.color }]}>
                    <Text style={styles.slideTitle}>
                      {slide.title}
                    </Text>
                  </View>
                  <Text style={styles.slideDescription}>
                    {slide.description}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Pagination */}
            <View style={styles.paginationContainer}>
              {slides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === currentSlideIndex && styles.paginationDotActive
                  ]}
                />
              ))}
            </View>

            {/* Progress indicator text */}
            <Text style={styles.progressText}>
              {currentSlideIndex + 1} of {slides.length}
            </Text>

            {/* Next/Get Started button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={handleNext}
                style={[styles.nextButton, { backgroundColor: slides[currentSlideIndex].color }]}
              >
                <Text style={styles.nextButtonText}>
                  {currentSlideIndex === slides.length - 1 ? '🚀 Get Started' : 'Next →'}
                </Text>
              </TouchableOpacity>
            </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  safeArea: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    zIndex: 10,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skipText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  slideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconEmoji: {
    fontSize: 40,
  },
  slideImage: {
    width: 280,
    height: 200,
    marginBottom: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  titleBadge: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  slideDescription: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  paginationDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 5,
  },
  paginationDotActive: {
    backgroundColor: '#4F46E5',
    width: 28,
    borderRadius: 5,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  nextButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.5,
  },
});

export default AskAIScreen; 

















































