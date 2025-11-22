import { Stack } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';

import { CustomHeader } from '@/components/CustomHeader';
import { CustomBottomNav } from '@/components/CustomBottomNav';

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <CustomHeader />
      <Stack
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="audio-tour" />
        <Stack.Screen name="scavenger-hunt" />
        <Stack.Screen name="cafe-tour" />
      </Stack>
      <CustomBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
