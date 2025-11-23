import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { OpenAIClient } from '@/services/OpenAIClient';
import { PlantStoryService } from '@/services/PlantStoryService';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ProgressTracker } from '@/components/ProgressTracker';
import { TourContent } from '@/components/TourContent';
import { SessionGuard } from '@/components/SessionGuard';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTours, calculateProgress } from '@/services/api';
import {
  startScanning,
  stopScanning,
  formatBeaconDataForAPI,
} from '@/services/bleService';
import { Tour, BeaconData } from '@/types';
import {
  fetchPlantsCsvText,
  parsePlantsCsv,
  pickRandomPlant,
  getSamplePlant,
  PlantRecord,
} from '@/utils/plantData';

const PROGRESS_UPDATE_INTERVAL = 3000; // Update progress every 3 seconds

export default function AudioTourScreen() {
  const { logout } = useAuth();
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [plantStory, setPlantStory] = useState<string>('');
  const [isStoryLoading, setIsStoryLoading] = useState<boolean>(false);
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
      const fetchedTours = await fetchTours();
      setTours(fetchedTours);
    } catch (error) {
      Alert.alert('Error', 'Failed to load tours. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const latestBeaconsRef = useRef<BeaconData[]>([]);

  const startProgressTracking = async () => {
    // Start BLE scanning
    try {
      await startScanning(beacons => {
        latestBeaconsRef.current = beacons;
      });
    } catch (error) {
      console.error('Failed to start scanning:', error);
    }

    // Set up interval for periodic updates
    scanningIntervalRef.current = setInterval(async () => {
      try {
        const beacons = latestBeaconsRef.current;
        // Only calculate progress if we have beacons
        if (beacons.length > 0) {
          const formattedData = formatBeaconDataForAPI(beacons);
          const progressData = await calculateProgress(formattedData);
          setProgress(progressData.progress);
        }
      } catch (error) {
        console.error('Failed to update progress:', error);
      }
    }, PROGRESS_UPDATE_INTERVAL) as unknown as NodeJS.Timeout;
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
      // Kick off plant story generation
      void generateAndSpeakPlantStory().catch(console.error);
    }
  };

  async function generateAndSpeakPlantStory() {
    try {
      setIsStoryLoading(true);
      const csv = await fetchPlantsCsvText();
      const rows = parsePlantsCsv(csv);
      const pick =
        (pickRandomPlant(rows) as PlantRecord | undefined) || getSamplePlant();

      const client = new OpenAIClient();
      const service = new PlantStoryService(client);
      const story = await service.generateStory(pick);

      setPlantStory(story);
    } catch (e) {
      // Strong fallback: always show a sample story
      const client = new OpenAIClient();
      const service = new PlantStoryService(client);
      const story = await service.generateStory(getSamplePlant());
      setPlantStory(story);
    } finally {
      setIsStoryLoading(false);
    }
  }

  const handleComplete = async () => {
    Alert.alert(
      'Tour Complete!',
      'Thank you for visiting Mitchell Park Domes! Would you like to scan a new ticket to start another activity?',
      [
        {
          text: 'No, Thanks',
          style: 'cancel',
          onPress: async () => {
            await stopProgressTracking();
          },
        },
        {
          text: 'Scan New Ticket',
          onPress: async () => {
            await stopProgressTracking();
            router.push('/settings');
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading tours...</ThemedText>
      </ThemedView>
    );
  }

  if (!hasStarted) {
    return (
      <SessionGuard activityName="Audio Tour" onStart={handleStart}>
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
        <ThemedText style={styles.description}>
          {selectedTour.description}
        </ThemedText>

        <ThemedText
          type="subtitle"
          style={{ textAlign: 'center', marginBottom: 8 }}
        >
          Featured Plant Story
        </ThemedText>
        {isStoryLoading ? (
          <ActivityIndicator size="small" />
        ) : plantStory ? (
          <ThemedText style={{ marginBottom: 16 }}>{plantStory}</ThemedText>
        ) : null}

        <ProgressTracker progress={progress} />

        <TourContent parts={selectedTour.parts} currentProgress={progress} />

        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleComplete}
        >
          <ThemedText style={styles.completeButtonText}>
            Complete Tour
          </ThemedText>
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
