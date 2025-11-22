import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { SessionGuard } from '@/components/SessionGuard';
import { useAuth } from '@/contexts/AuthContext';
import { OpenAIClient } from '@/services/OpenAIClient';
import { ScavengerHuntService } from '@/services/ScavengerHuntService';
import { Plant } from '@/data/plants';

type GameStatus = 'initial' | 'playing' | 'verifying' | 'success' | 'completed';

export default function ScavengerHuntScreen() {
  const { logout } = useAuth();
  const [status, setStatus] = useState<GameStatus>('initial');
  const [currentPlant, setCurrentPlant] = useState<Plant | null>(null);
  const [foundPlantIds, setFoundPlantIds] = useState<string[]>([]);
  const [riddle, setRiddle] = useState<string>('');
  const [hint, setHint] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Initialize service
  const serviceRef = useRef<ScavengerHuntService | null>(null);

  useEffect(() => {
    const client = new OpenAIClient();
    serviceRef.current = new ScavengerHuntService(client);
  }, []);

  const startNewRound = async () => {
    if (!serviceRef.current) return;

    setIsLoading(true);
    setLoadingMessage('Consulting the botanical spirits...');

    try {
      const plant = serviceRef.current.startGame(foundPlantIds);

      if (!plant) {
        setStatus('completed');
        setIsLoading(false);
        return;
      }

      setCurrentPlant(plant);

      // Get riddle
      const newRiddle = await serviceRef.current.getPlantDescription(plant);
      setRiddle(newRiddle);
      setHint(''); // Reset hint
      setFeedback('');
      setStatus('playing');
    } catch (error) {
      console.error('Error starting round:', error);
      Alert.alert('Error', 'Failed to start the round. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetHint = async () => {
    if (!serviceRef.current || !currentPlant) return;

    setIsLoading(true);
    setLoadingMessage('Whispering to the leaves...');

    try {
      const newHint = await serviceRef.current.getHint(currentPlant);
      setHint(newHint);
    } catch (error) {
      Alert.alert('Error', 'Failed to get a hint.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFoundIt = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        verifyImage(result.assets[0].base64);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to launch camera.');
    }
  };

  const verifyImage = async (base64Image: string) => {
    if (!serviceRef.current || !currentPlant) return;

    setStatus('verifying');
    setLoadingMessage('Analyzing your find...');

    try {
      const result = await serviceRef.current.verifyFind(
        base64Image,
        currentPlant,
      );

      if (result.isMatch) {
        setFeedback(result.feedback);
        setFoundPlantIds(prev => [...prev, currentPlant.id]);
        setStatus('success');
      } else {
        Alert.alert('Not quite...', result.feedback);
        setStatus('playing');
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'Failed to verify image. Please try again.');
      setStatus('playing');
    }
  };

  const handleNextPlant = () => {
    startNewRound();
  };

  const handleRestart = () => {
    setFoundPlantIds([]);
    setStatus('initial');
    setCurrentPlant(null);
    setRiddle('');
    setHint('');
    setFeedback('');
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
        <ThemedText style={styles.loadingText}>{loadingMessage}</ThemedText>
      </ThemedView>
    );
  }

  if (status === 'initial') {
    return (
      <SessionGuard activityName="Scavenger Hunt" onStart={startNewRound}>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.title}>
            Botanical Scavenger Hunt
          </ThemedText>
          <ThemedText style={styles.description}>
            Explore the domes and find the hidden plants! I'll give you a
            riddle, and you have to snap a photo of the plant to verify it.
          </ThemedText>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={startNewRound}
          >
            <ThemedText style={styles.buttonText}>Start Hunt</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </SessionGuard>
    );
  }

  if (status === 'completed') {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Hunt Complete!
        </ThemedText>
        <ThemedText style={styles.description}>
          Congratulations! You've found all the plants in this hunt.
        </ThemedText>
        <ThemedText style={styles.score}>
          Total Plants Found: {foundPlantIds.length}
        </ThemedText>
        <TouchableOpacity style={styles.primaryButton} onPress={handleRestart}>
          <ThemedText style={styles.buttonText}>Play Again</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, { marginTop: 10 }]}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <ThemedText style={styles.secondaryButtonText}>Exit</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <ThemedView style={styles.header}>
        <ThemedText type="subtitle">
          Plants Found: {foundPlantIds.length}
        </ThemedText>
      </ThemedView>

      {status === 'success' ? (
        <ThemedView style={styles.card}>
          <ThemedText type="title" style={styles.successTitle}>
            Correct!
          </ThemedText>
          <ThemedText style={styles.plantName}>
            It was the {currentPlant?.commonName}
          </ThemedText>
          <ThemedText style={styles.scientificName}>
            ({currentPlant?.scientificName})
          </ThemedText>
          <ThemedText style={styles.feedbackText}>{feedback}</ThemedText>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNextPlant}
          >
            <ThemedText style={styles.buttonText}>Next Plant</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      ) : (
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle" style={styles.riddleLabel}>
            Riddle:
          </ThemedText>
          <ThemedText style={styles.riddleText}>{riddle}</ThemedText>

          {hint ? (
            <ThemedView style={styles.hintContainer}>
              <ThemedText type="defaultSemiBold">Hint:</ThemedText>
              <ThemedText style={styles.hintText}>{hint}</ThemedText>
            </ThemedView>
          ) : (
            <TouchableOpacity style={styles.hintButton} onPress={handleGetHint}>
              <ThemedText style={styles.hintButtonText}>
                Need a Hint?
              </ThemedText>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.cameraButton} onPress={handleFoundIt}>
            <ThemedText style={styles.cameraButtonText}>
              📷 Found It!
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 16,
    lineHeight: 24,
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#4caf50',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  riddleLabel: {
    marginBottom: 10,
    color: '#81c784',
  },
  riddleText: {
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 30,
    fontStyle: 'italic',
  },
  hintContainer: {
    backgroundColor: 'rgba(255, 235, 59, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#fdd835',
  },
  hintText: {
    marginTop: 5,
    fontSize: 16,
  },
  hintButton: {
    alignSelf: 'flex-start',
    marginBottom: 30,
  },
  hintButtonText: {
    color: '#81c784',
    textDecorationLine: 'underline',
    fontSize: 16,
  },
  cameraButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#666',
  },
  secondaryButtonText: {
    fontSize: 16,
  },
  successTitle: {
    color: '#4caf50',
    textAlign: 'center',
    marginBottom: 10,
  },
  plantName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#fff',
  },
  scientificName: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
    color: '#aaa',
  },
  feedbackText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 30,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 15,
    borderRadius: 8,
  },
});
