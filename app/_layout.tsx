import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import pushNotificationService from '../services/pushNotificationService';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

SplashScreen.preventAutoHideAsync();

function AppRoot() {
  const { isDark } = useTheme();

  const [fontsLoaded] = useFonts({});

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const cleanup = pushNotificationService.setupNotificationListeners();
    return cleanup;
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        backgroundColor={isDark ? '#191919' : '#FFFFFF'}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: isDark ? '#191919' : '#F5F5F5' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="signin" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppRoot />
    </ThemeProvider>
  );
}
