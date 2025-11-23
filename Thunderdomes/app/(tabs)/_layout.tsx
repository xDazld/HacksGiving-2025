import { Slot } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';

import { CustomHeader } from '@/components/CustomHeader';
import { CustomBottomNav } from '@/components/CustomBottomNav';

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <CustomHeader />
      <View style={styles.content}>
        <Slot />
      </View>
      <CustomBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
