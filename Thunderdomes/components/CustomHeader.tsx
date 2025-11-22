import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, SafeAreaView, Platform } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

// Blue header color based on description (adjust as needed)
const HEADER_BG_COLOR = '#64B5F6'; 

export function CustomHeader() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Left spacer to balance the settings icon */}
        <View style={styles.spacer} />

        {/* Center Logo Placeholder */}
        <View style={styles.logoContainer}>
            {/* Placeholder for Logo - Replace with <Image source={require('...')} /> */}
            <View style={styles.logoPlaceholder}>
                <IconSymbol name="leaf.fill" size={30} color="#fff" />
            </View>
        </View>

        {/* Right Settings Button */}
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => router.push('/settings')}
        >
          <IconSymbol name="gear" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#68A4D2', // Matching the blue tone
    paddingTop: Platform.OS === 'android' ? 35 : 0,
  },
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#68A4D2',
  },
  spacer: {
    width: 40, // Width of the settings button to center the logo
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholder: {
    width: 100,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
});

