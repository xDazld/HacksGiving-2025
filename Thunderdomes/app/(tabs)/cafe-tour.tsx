import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ProgressTracker } from '@/components/ProgressTracker';
import { TourContent } from '@/components/TourContent';
import { SessionGuard } from '@/components/SessionGuard';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCafeTours, calculateProgress } from '@/services/api';
import { startScanning, stopScanning, formatBeaconDataForAPI } from '@/services/bleService';
import { CafeTour } from '@/types';

const PROGRESS_UPDATE_INTERVAL = 3000; // Update progress every 3 seconds

export default function CafeTourScreen() {
  const { logout } = useAuth();
  const [tours, setTours] = useState<CafeTour[]>([]);
  const [selectedTour, setSelectedTour] = useState<CafeTour | null>(null);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const scanningIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadTours();
  }, []);

  useEffect(() => {
    if (hasStarted && selectedTour) {
      startProgressTracking();
      return () => {
        stopProgressTracking();
      };
    }
  }, [hasStarted, selectedTour]);

  const loadTours = async () => {
    try {
      const fetchedTours = await fetchCafeTours();
      setTours(fetchedTours);
    } catch (error) {
      Alert.alert('Error', 'Failed to load cafe tours. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startProgressTracking = async () => {
    // Start BLE scanning and update progress periodically
    const updateProgress = async () => {
      try {
        const beacons = await startScanning();
        const formattedData = formatBeaconDataForAPI(beacons);
        const progressData = await calculateProgress(formattedData);
        setProgress(progressData.progress);
      } catch (error) {
        console.error('Failed to update progress:', error);
      }
    };

    // Initial update
    await updateProgress();

    // Set up interval for periodic updates
    scanningIntervalRef.current = setInterval(updateProgress, PROGRESS_UPDATE_INTERVAL);
  };

  const stopProgressTracking = async () => {
    if (scanningIntervalRef.current) {
      clearInterval(scanningIntervalRef.current);
      scanningIntervalRef.current = null;
    }
    await stopScanning();
  };

  const handleStart = () => {
    if (tours.length > 0) {
      setSelectedTour(tours[0]);
      setHasStarted(true);
    }
  };

  const handleComplete = async () => {
    Alert.alert(
      'Tour Complete!',
      'Thank you for visiting Mitchell Park Domes. You will now be logged out.',
      [
        {
          text: 'OK',
          onPress: async () => {
            await stopProgressTracking();
            await logout();
            router.replace('/login');
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading cafe tours...</ThemedText>
      </ThemedView>
    );
  }

  if (!hasStarted) {
    return (
      <SessionGuard activityName="Cafe Tour" onStart={handleStart}>
        <ThemedView style={styles.container}>
          <ThemedText>This should not be visible</ThemedText>
        </ThemedView>
      </SessionGuard>
    );
  }

  if (!selectedTour) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>No tour selected</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          {selectedTour.title}
        </ThemedText>
        <ThemedText style={styles.description}>{selectedTour.description}</ThemedText>

        <ProgressTracker progress={progress} />

        <TourContent parts={selectedTour.parts} currentProgress={progress} />

        <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
          <ThemedText style={styles.completeButtonText}>Complete Tour</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    textAlign: 'center',
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    marginBottom: 20,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  completeButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

