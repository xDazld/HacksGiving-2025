import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PlantCameraModal } from '@/components/PlantCameraModal';
import { useAuth } from '@/contexts/AuthContext';
import { OpenAIClient } from '@/services/OpenAIClient';
import { PlantStoryService } from '@/services/PlantStoryService';
import { ScavengerHuntService } from '@/services/ScavengerHuntService';
import {
  fetchPlantsCsvText,
  parsePlantsCsv,
  filterPlants,
  PlantRecord,
} from '@/utils/plantData';

type GameStatus = 'initial' | 'playing' | 'verifying' | 'success' | 'completed';

export default function ScavengerHuntScreen() {
  const { user } = useAuth();
  const [status, setStatus] = useState<GameStatus>('initial');
  const [currentPlant, setCurrentPlant] = useState<PlantRecord | null>(null);
  const [foundPlantIds, setFoundPlantIds] = useState<string[]>([]);
  const [riddle, setRiddle] = useState<string>('');
  const [story, setStory] = useState<string>('');
  const [hint, setHint] = useState<string>('');
  const [hintHistory, setHintHistory] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showWrongModal, setShowWrongModal] = useState(false);
  const [wrongAnswerFeedback, setWrongAnswerFeedback] = useState('');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);

  // Initialize service
  // Initialize services
  const scavengerServiceRef = useRef<ScavengerHuntService | null>(null);
  const storyServiceRef = useRef<PlantStoryService | null>(null);

  useEffect(() => {
    const initServices = async () => {
      try {
        const csvText = await fetchPlantsCsvText();
        const allPlants = parsePlantsCsv(csvText);
        const filteredPlants = filterPlants(allPlants);

        const client = new OpenAIClient();
        scavengerServiceRef.current = new ScavengerHuntService(
          client,
          filteredPlants,
        );
        storyServiceRef.current = new PlantStoryService(client);
      } catch (e) {
        console.error('Failed to load plant data', e);
        Alert.alert(
          'Error',
          'Failed to load plant data. Please restart the app.',
        );
      }
    };
    initServices();
  }, []);

  const startNewRound = async () => {
    if (!scavengerServiceRef.current) return;

    setIsLoading(true);
    setLoadingMessage('Consulting the botanical spirits...');

    try {
      const plant = scavengerServiceRef.current.startGame(foundPlantIds);

      if (!plant) {
        setStatus('completed');
        setIsLoading(false);
        return;
      }

      setCurrentPlant(plant);

      // Get riddle
      const newRiddle = await scavengerServiceRef.current.getPlantDescription(
        plant,
        user?.age,
      );
      setRiddle(newRiddle);
      setHint(''); // Reset hint
      setHintHistory([]);
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
    if (!scavengerServiceRef.current || !currentPlant) return;

    setIsLoading(true);
    setLoadingMessage('Whispering to the leaves...');

    try {
      const previousContent = [riddle, ...hintHistory];
      const newHint = await scavengerServiceRef.current.getHint(
        currentPlant,
        user?.age,
        previousContent,
      );
      setHint(newHint);
      setHintHistory(prev => [...prev, newHint]);
    } catch (error) {
      Alert.alert('Error', 'Failed to get a hint.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFoundIt = () => {
    setShowCameraModal(true);
  };

  const handlePhotoTaken = (base64Image: string) => {
    setShowCameraModal(false);
    verifyImage(base64Image);
  };

  const verifyImage = async (base64Image: string) => {
    if (!scavengerServiceRef.current || !currentPlant) return;

    setStatus('verifying');
    setIsLoading(true);
    setLoadingMessage('Checking your guess...');

    try {
      const result = await scavengerServiceRef.current.verifyFind(
        base64Image,
        currentPlant,
      );

      if (result.isMatch) {
        setFeedback(result.feedback);
        setFoundPlantIds(prev => [
          ...prev,
          currentPlant['Scientific Name'] || '',
        ]);

        // Generate story
        if (storyServiceRef.current) {
          const newStory = await storyServiceRef.current.generateStory(
            currentPlant,
            user?.age,
          );
          setStory(newStory);
        }

        setStatus('success');
      } else {
        setWrongAnswerFeedback(result.feedback);
        setShowWrongModal(true);
        setStatus('playing');
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'Failed to verify image. Please try again.');
      setStatus('playing');
    } finally {
      setIsLoading(false);
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
    setStory('');
    setHint('');
    setHintHistory([]);
    setFeedback('');
    setIsStoryExpanded(false);
  };

  if (isLoading) {
    return (
      <ThemedView
        style={styles.centeredContainer}
        lightColor="#F5F1E3"
        darkColor="#2C2416"
      >
        <ActivityIndicator size="large" color="#5A6A5D" />
        <ThemedText
          style={styles.loadingText}
          lightColor="#2C2416"
          darkColor="#F5F1E3"
        >
          {loadingMessage}
        </ThemedText>
      </ThemedView>
    );
  }

  const handleStartWithValidation = () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to start an activity.');
      return;
    }

    if (user.hasUsedTicket) {
      Alert.alert(
        'Ticket Already Used',
        'You have already used your ticket for one tour or scavenger hunt. Please scan a new ticket to continue.',
        [{ text: 'OK' }],
      );
      return;
    }

    Alert.alert(
      'Start Activity',
      'Starting Dome Detective will use your ticket. After completing this activity, you can scan a new ticket to start another. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Start',
          onPress: startNewRound,
        },
      ],
    );
  };

  if (status === 'initial') {
    return (
      <ThemedView
        style={styles.initialContainer}
        lightColor="#F5F1E3"
        darkColor="#F5F1E3"
      >
        <ThemedText
          type="title"
          style={styles.initialTitle}
          lightColor="#2C2416"
          darkColor="#2C2416"
        >
          Dome Detective
        </ThemedText>
        <ThemedText
          style={styles.initialDescription}
          lightColor="#2C2416"
          darkColor="#2C2416"
        >
          Identify plants using clues and your sleuthing skills... Are you ready
          to be a detective?
        </ThemedText>
        <Image
          source={require('@/assets/images/DomeDetectiveEntry.png')}
          style={styles.detectiveImage}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.letsGoButton}
          onPress={handleStartWithValidation}
        >
          <ThemedText style={styles.letsGoButtonText}>Let's Go!</ThemedText>
        </TouchableOpacity>
      </ThemedView>
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
          onPress={() => router.push('/settings')}
        >
          <ThemedText style={styles.secondaryButtonText}>Exit</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (showCameraModal) {
    return (
      <PlantCameraModal
        onPhotoTaken={handlePhotoTaken}
        onClose={() => setShowCameraModal(false)}
      />
    );
  }

  return (
    <>
      <ThemedView
        style={styles.playingContainer}
        lightColor="#F5F1E3"
        darkColor="#F5F1E3"
      >
        <ThemedText
          type="title"
          style={styles.playingTitle}
          lightColor="#2C2416"
          darkColor="#2C2416"
        >
          Dome Detective
        </ThemedText>

        {status === 'success' ? (
          <ScrollView
            style={styles.successScrollContainer}
            contentContainerStyle={styles.successContent}
          >
            <ThemedText type="title" style={styles.successTitle}>
              Correct!
            </ThemedText>
            <ThemedText style={styles.plantName}>
              It was the {currentPlant?.['Common Name']}
            </ThemedText>
            <ThemedText style={styles.scientificName}>
              ({currentPlant?.['Scientific Name']})
            </ThemedText>
            <ThemedText style={styles.feedbackText}>{feedback}</ThemedText>

            {/* Collapsible Story Section */}
            {story ? (
              <View style={styles.storyContainer}>
                <TouchableOpacity
                  style={styles.learnMoreButton}
                  onPress={() => setIsStoryExpanded(!isStoryExpanded)}
                  activeOpacity={0.7}
                >
                  <ThemedText style={styles.learnMoreText}>
                    {isStoryExpanded ? 'Hide Story' : 'Learn More'}
                  </ThemedText>
                  <Ionicons
                    name={isStoryExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#5A6A5D"
                  />
                </TouchableOpacity>

                {isStoryExpanded && (
                  <ThemedText style={styles.storyText}>{story}</ThemedText>
                )}
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleNextPlant}
            >
              <ThemedText style={styles.buttonText}>Next Plant</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <>
            <ScrollView
              style={styles.riddleScrollContainer}
              contentContainerStyle={styles.riddleContent}
            >
              <ThemedText
                style={styles.riddleText}
                lightColor="#2C2416"
                darkColor="#2C2416"
              >
                {riddle}
              </ThemedText>
            </ScrollView>

            {hint && (
              <View style={styles.hintBox}>
                <ThemedText
                  style={styles.hintText}
                  lightColor="#2C2416"
                  darkColor="#2C2416"
                >
                  {hint}
                </ThemedText>
              </View>
            )}

            <View style={styles.buttonContainer}>
              {!hint && (
                <TouchableOpacity
                  style={styles.getHintButton}
                  onPress={handleGetHint}
                >
                  <View style={styles.getHintButtonContent}>
                    <ThemedText style={styles.getHintButtonText}>
                      Get Another Hint
                    </ThemedText>
                    <View style={styles.checkmarkCircle}>
                      <ThemedText style={styles.questionMark}>?</ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.foundItButton}
                onPress={handleFoundIt}
              >
                <ThemedText style={styles.foundItButtonText}>
                  I Think I Found It!
                </ThemedText>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ThemedView>

      {/* Wrong Answer Modal */}
      <Modal
        visible={showWrongModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWrongModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText type="title" style={styles.modalTitle}>
              Not Quite...
            </ThemedText>
            <ThemedText style={styles.modalText}>
              {wrongAnswerFeedback}
            </ThemedText>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowWrongModal(false)}
            >
              <ThemedText style={styles.modalButtonText}>Try Again</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F1E3',
  },
  initialTitle: {
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2C2416',
  },
  initialDescription: {
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 18,
    lineHeight: 26,
    color: '#2C2416',
    paddingHorizontal: 20,
  },
  detectiveImage: {
    width: '100%',
    height: 275,
  },
  letsGoButton: {
    backgroundColor: '#5A6A5D',
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  letsGoButtonText: {
    color: '#F5F1E3',
    fontSize: 22,
    fontWeight: 'bold',
  },
  playingContainer: {
    flex: 1,
    backgroundColor: '#F5F1E3',
    paddingTop: 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  playingTitle: {
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C2416',
    marginBottom: 20,
  },
  riddleScrollContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#D4C5A0',
  },
  riddleContent: {
    padding: 20,
  },
  riddleText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#2C2416',
  },
  hintBox: {
    backgroundColor: '#E8DCC4',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#D4C5A0',
  },
  hintText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2C2416',
  },
  buttonContainer: {
    gap: 12,
  },
  getHintButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#8BB4D0',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  getHintButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  getHintButtonText: {
    color: '#8BB4D0',
    fontSize: 18,
    fontWeight: '600',
  },
  checkmarkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8BB4D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionMark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  foundItButton: {
    backgroundColor: '#5A6A5D',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  foundItButtonText: {
    color: '#F5F1E3',
    fontSize: 18,
    fontWeight: 'bold',
  },
  successScrollContainer: {
    flex: 1,
  },
  successContent: {
    padding: 20,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
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
  primaryButton: {
    backgroundColor: '#5A6A5D',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#F5F1E3',
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
    fontSize: 32,
  },
  plantName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#2C2416',
  },
  scientificName: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  feedbackText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 15,
    borderRadius: 8,
    color: '#2C2416',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#F5F1E3',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    color: '#C75B4B',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 28,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 25,
    color: '#2C2416',
  },
  modalButton: {
    backgroundColor: '#5A6A5D',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#F5F1E3',
    fontSize: 18,
    fontWeight: 'bold',
  },
  storyContainer: {
    marginBottom: 20,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#5A6A5D',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  learnMoreText: {
    color: '#5A6A5D',
    fontSize: 16,
    fontWeight: '600',
  },
  storyText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left',
    marginTop: 10,
    color: '#2C2416',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4C5A0',
  },
});
