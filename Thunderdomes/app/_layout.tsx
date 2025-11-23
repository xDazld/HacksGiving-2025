import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const currentSegment = segments[0];
    const inAuthGroup = currentSegment === '(tabs)';
    const onLoginPage = currentSegment === 'login';
    const onIndexPage = currentSegment === 'index';

    // If on index page, let it handle the redirect
    if (onIndexPage) {
      return;
    }

    if (!user && inAuthGroup) {
      // Redirect to login if not authenticated and trying to access tabs
      router.replace('/login');
    } else if (user && onLoginPage) {
      // Redirect to tabs if authenticated and on login page
      router.replace('/(tabs)/botanical-tales');
    }
  }, [user, segments, isLoading, router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="botanical-tales" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
          <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
