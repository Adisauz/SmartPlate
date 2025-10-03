import React from 'react';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './navigation/AppNavigator';
import { ThemeProvider, useTheme } from './screens/ThemeContext';

const MainApp = () => {
  const { theme } = useTheme();

  const baseTheme = theme === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme;
  const navTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: theme === 'dark' ? '#222' : '#fff',
      text: theme === 'dark' ? '#fff' : '#222',
      primary: theme === 'dark' ? '#1e90ff' : '#007aff',
      card: theme === 'dark' ? '#333' : '#f9f9f9',
      border: theme === 'dark' ? '#444' : '#ccc',
      notification: theme === 'dark' ? '#ff453a' : '#ff3b30',
    },
  } as typeof NavigationDefaultTheme; // preserve extra theme fields like fonts

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
} 