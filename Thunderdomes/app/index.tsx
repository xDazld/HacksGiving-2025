import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedView } from '@/components/themed-view';
import { ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';

export default function Index() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      // User is authenticated, redirect to tabs
      router.replace('/(tabs)/audio-tour');
    } else {
      // User is not authenticated, redirect to login
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  // Show loading screen while checking auth state
  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <ThemedText style={{ marginTop: 10 }}>Loading...</ThemedText>
    </ThemedView>
  );
}

