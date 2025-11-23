import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Modal,
  Text,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useLocalization } from '@/contexts/LocalizationContext';
import { OpenAIClient } from '@/services/OpenAIClient';
import { DrinkStoryService, Beverage } from '@/services/DrinkStoryService';
import { TextToSpeechService } from '@/services/TextToSpeechService';

// Featured beverages with plant-themed names (duplicated here for now, ideally shared)
const featuredBeverages: Beverage[] = [
  {
    id: '1',
    nameKey: 'sipAndSeek.drinks.pricklyPear',
    name: 'Prickly Pear Margarita',
    image: require('@/assets/images/prickly_pear.jpg'),
    descKey: 'sipAndSeek.drinks.pricklyPearDesc',
  },
  {
    id: '2',
    nameKey: 'sipAndSeek.drinks.hibiscus',
    name: 'Hibiscus Fruit Tea',
    image: require('@/assets/images/hibiscus-fruit-tea.jpg'),
    descKey: 'sipAndSeek.drinks.hibiscusDesc',
  },
  {
    id: '3',
    nameKey: 'sipAndSeek.drinks.lavender',
    name: 'Honey Lavender Latte',
    image: require('@/assets/images/honey-lavender.jpg'),
    descKey: 'sipAndSeek.drinks.lavenderDesc',
  },
  {
    id: '4',
    nameKey: 'sipAndSeek.drinks.vanilla',
    name: 'Vanilla Bean Frappuccino',
    image: require('@/assets/images/vanilla-bean-frappuccino.jpg'),
    descKey: 'sipAndSeek.drinks.vanillaDesc',
  },
];

/**
 * Split story into 3 parts at sentence boundaries
 */
function splitStoryIntoThreeParts(story: string): string[] {
  // Find all sentence boundaries (. ! ? followed by space and capital letter, or end of string)
  const sentenceRegex = /[.!?](?:\s+(?=[A-Z])|$)/g;
  const matches: number[] = [];
  let match;

  while ((match = sentenceRegex.exec(story)) !== null) {
    matches.push(match.index + 1); // Position after the punctuation
  }

  if (matches.length === 0) {
    // No sentences found, split by character count
    const third = Math.floor(story.length / 3);
    return [
      story.slice(0, third),
      story.slice(third, third * 2),
      story.slice(third * 2),
    ];
  }

  // Find split points closest to 1/3 and 2/3
  const targetThird = story.length / 3;
  const targetTwoThirds = (story.length * 2) / 3;

  let firstSplit = 0;
  let secondSplit = matches[matches.length - 1];
  let minDiff1 = Infinity;
  let minDiff2 = Infinity;

  matches.forEach(pos => {
    const diff1 = Math.abs(pos - targetThird);
    const diff2 = Math.abs(pos - targetTwoThirds);

    if (diff1 < minDiff1) {
      minDiff1 = diff1;
      firstSplit = pos;
    }
    if (diff2 < minDiff2 && pos > firstSplit) {
      minDiff2 = diff2;
      secondSplit = pos;
    }
  });

  return [
    story.slice(0, firstSplit).trim(),
    story.slice(firstSplit, secondSplit).trim(),
    story.slice(secondSplit).trim(),
  ];
}

export default function DrinkStoryScreen() {
  const { id } = useLocalSearchParams();
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const { t, locale } = useLocalization();
  const insets = useSafeAreaInsets();

  // Find the drink
  const drink = featuredBeverages.find(b => b.id === id);

  // Story and Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [drinkStory, setDrinkStory] = useState<string>('');
  const [isStoryLoading, setIsStoryLoading] = useState<boolean>(false);
  const [isAudioReady, setIsAudioReady] = useState<boolean>(false);
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
  const ttsService = useRef<TextToSpeechService>(new TextToSpeechService());

  const [storyParts, setStoryParts] = useState<string[]>([]);
  const [unlockedParts, setUnlockedParts] = useState<number>(1); // Starts with part 1 unlocked
  const [currentPlayingPart, setCurrentPlayingPart] = useState<number>(-1);

  useEffect(() => {
    if (!drink) return;

    // Set TTS language based on current locale
    ttsService.current.setLanguage(locale);

    // Generate a drink story when the screen loads or when language changes
    generateDrinkStory();

    // Cleanup TTS service when component unmounts
    return () => {
      ttsService.current.cleanup();
    };
  }, [locale, drink]);

  async function generateDrinkStory() {
    if (!drink) return;

    try {
      setIsStoryLoading(true);

      const client = new OpenAIClient();
      const service = new DrinkStoryService(client);
      const story = await service.generateStory(drink, undefined, locale);

      setDrinkStory(story);

      // Split story into 3 parts
      const parts = splitStoryIntoThreeParts(story);
      setStoryParts(parts);

      // Preload audio for first part only
      if (parts.length > 0 && parts[0]) {
        setIsAudioLoading(true);
        try {
          await ttsService.current.preloadAudio(parts[0]);
          setIsAudioReady(true);
        } catch (err) {
          console.error('⚠️ Audio preload failed:', err);
          setIsAudioReady(false);
        } finally {
          setIsAudioLoading(false);
        }
      }
    } catch (e) {
      console.error('Error generating drink story:', e);
      setDrinkStory('Unable to generate story at this time.');
    } finally {
      setIsStoryLoading(false);
    }
  }

  const handleScanPress = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          t('sipAndSeek.cameraPermission'),
          t('sipAndSeek.cameraPermissionMessage'),
        );
        return;
      }
    }
    setShowCamera(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setShowCamera(false);
    Alert.alert(
      t('sipAndSeek.barcodeScanned'),
      `${t('sipAndSeek.codeLabel')} ${data}`,
      [
        {
          text: 'OK',
          onPress: () => {
            // Unlock next part on scan
            if (unlockedParts < 3) {
              setUnlockedParts(prev => prev + 1);
              Alert.alert(
                'Success!',
                'You found a new clue! Next part of the story unlocked.',
              );
            } else {
              Alert.alert(
                'Great job!',
                'You have already unlocked all parts of the story.',
              );
            }
          },
        },
      ],
    );
  };

  /**
   * Play a specific unlocked part
   */
  const continueWithUnlockedPart = async (partIndex: number) => {
    if (partIndex >= storyParts.length || partIndex < 0) {
      return;
    }

    const partText = storyParts[partIndex];
    if (!partText) return;

    try {
      setCurrentPlayingPart(partIndex);
      setIsAudioLoading(true);

      // Stop current audio and preload new part
      await ttsService.current.stop();
      await ttsService.current.preloadAudio(partText);

      setIsAudioLoading(false);
      await ttsService.current.speak(partText);
      setIsPlaying(true);

      // Monitor playback completion
      const checkPlayback = setInterval(() => {
        if (!ttsService.current.isPlaying()) {
          setIsPlaying(false);
          clearInterval(checkPlayback);
          playNextPartOrWait(partIndex);
        }
      }, 500);
    } catch (error) {
      console.error('❌ Error playing part:', error);
      setIsPlaying(false);
      setIsAudioLoading(false);
    }
  };

  /**
   * Called when a part finishes playing
   */
  const playNextPartOrWait = async (justFinishedPartIndex: number) => {
    const nextPartIndex = justFinishedPartIndex + 1;

    // Check if we've finished all parts
    if (nextPartIndex >= storyParts.length) {
      setCurrentPlayingPart(-1);
      return;
    }

    // Check if next part is unlocked
    const nextPartNumber = nextPartIndex + 1;
    if (nextPartNumber <= unlockedParts) {
      // Next part is unlocked, play it immediately
      await continueWithUnlockedPart(nextPartIndex);
    } else {
      // Next part is locked
      setCurrentPlayingPart(-1);
      Alert.alert(
        'Continue Exploring',
        'Scan a barcode to unlock the next part of the story!',
      );
    }
  };

  const handlePlayPause = async () => {
    try {
      if (storyParts.length === 0) {
        return;
      }

      if (isPlaying) {
        // Currently playing, so pause it
        await ttsService.current.pause();
        setIsPlaying(false);
      } else {
        // Currently paused or not started
        if (currentPlayingPart === -1) {
          // Not started yet, start from part 0
          await continueWithUnlockedPart(0);
        } else {
          // Resume current part
          await ttsService.current.speak(storyParts[currentPlayingPart]);
          setIsPlaying(true);

          // Monitor playback status
          const checkPlayback = setInterval(() => {
            if (!ttsService.current.isPlaying()) {
              setIsPlaying(false);
              clearInterval(checkPlayback);
              playNextPartOrWait(currentPlayingPart);
            }
          }, 500);
        }
      }
    } catch (error) {
      console.error('❌ Play/Pause Error:', error);
      setIsPlaying(false);
    }
  };

  const renderCameraModal = () => (
    <Modal
      visible={showCamera}
      animationType="slide"
      onRequestClose={() => setShowCamera(false)}
    >
      <View style={styles.fullScreenContainer}>
        {/* Header with Back Button */}
        <View style={[styles.cameraHeaderSafeArea, { paddingTop: insets.top }]}>
          <View style={styles.cameraHeader}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.cameraBackButton}
              onPress={() => setShowCamera(false)}
            >
              <ThemedText style={styles.cameraBackArrow}>←</ThemedText>
            </TouchableOpacity>

            {/* Center Logo */}
            <View style={styles.cameraLogoContainer}>
              <Image
                source={require('@/assets/images/DomesLogo.png')}
                style={styles.cameraLogo}
                resizeMode="contain"
              />
            </View>

            <View style={{ width: 40 }} />
          </View>
        </View>

        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={handleBarcodeScanned}
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.scanFrame} />
            <ThemedText style={styles.scanInstruction}>
              {t('sipAndSeek.scanInstruction')}
            </ThemedText>
          </View>
        </CameraView>
      </View>
    </Modal>
  );

  if (!drink) {
    return (
      <View style={styles.container}>
        <ThemedText>Drink not found</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {renderCameraModal()}
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.content}>
          {/* Header with Back Button */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ThemedText style={styles.backButtonText}>← Back</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <ThemedText style={styles.title}>{t(drink.nameKey)}</ThemedText>

          {/* Drink Image */}
          <Image
            source={drink.image}
            style={styles.drinkImage}
            resizeMode="cover"
          />

          {/* Story Section */}
          <View style={styles.storySection}>
            <ThemedText type="subtitle" style={styles.storyTitle}>
              Botanical Story
            </ThemedText>

            {/* Part Progress Indicator */}
            {storyParts.length > 0 && (
              <View style={styles.partIndicatorContainer}>
                {[1, 2, 3].map(partNum => (
                  <View
                    key={partNum}
                    style={[
                      styles.partIndicator,
                      partNum <= unlockedParts && styles.partIndicatorUnlocked,
                      currentPlayingPart === partNum - 1 &&
                        styles.partIndicatorPlaying,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.partIndicatorText,
                        partNum <= unlockedParts &&
                          styles.partIndicatorTextUnlocked,
                        currentPlayingPart === partNum - 1 &&
                          styles.partIndicatorTextPlaying,
                      ]}
                    >
                      {partNum}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            {isStoryLoading ? (
              <ActivityIndicator size="small" color="#68A4D2" />
            ) : storyParts.length > 0 ? (
              <>
                {storyParts.map((part, index) => {
                  const partNum = index + 1;
                  const isUnlocked = partNum <= unlockedParts;
                  const isCurrentPart = currentPlayingPart === index;

                  return (
                    <View key={index} style={styles.storyPartContainer}>
                      <View style={styles.storyPartHeader}>
                        <ThemedText style={styles.storyPartTitle}>
                          Part {partNum} of {storyParts.length}
                          {isCurrentPart && ' 🎵'}
                          {!isUnlocked && ' 🔒'}
                        </ThemedText>
                      </View>
                      <ThemedText
                        style={[
                          styles.storyText,
                          !isUnlocked && styles.storyTextLocked,
                        ]}
                      >
                        {isUnlocked
                          ? part
                          : '🔒 Scan a barcode to unlock this part...'}
                      </ThemedText>
                    </View>
                  );
                })}
              </>
            ) : drinkStory ? (
              <ThemedText style={styles.storyText}>{drinkStory}</ThemedText>
            ) : (
              <ThemedText style={styles.storyText}>
                Unable to load story at this time.
              </ThemedText>
            )}
          </View>
        </ThemedView>
      </ScrollView>

      {/* Fixed Play/Pause Button */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={[
            styles.playButton,
            (!isAudioReady || isAudioLoading) && styles.playButtonDisabled,
          ]}
          onPress={handlePlayPause}
          activeOpacity={0.8}
          disabled={!isAudioReady || isAudioLoading}
        >
          {isAudioLoading ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <ThemedText style={styles.playIcon}>
              {isPlaying ? '\u23f8' : '\u25b6'}
            </ThemedText>
          )}
        </TouchableOpacity>
      </View>

      {/* Floating Scan Button */}
      <View style={styles.floatingScanContainer}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScanPress}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.scanButtonText}>
            {t('sipAndSeek.scanButton')}
          </ThemedText>
          <ThemedText style={styles.cameraIcon}>📷</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 18,
    color: '#458E5E',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  drinkImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
  },
  storySection: {
    backgroundColor: '#F5F9F6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  storyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2C3E50',
    textAlign: 'center',
  },
  storyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#34495E',
    marginBottom: 10,
  },
  storyTextLocked: {
    color: '#95A5A6',
    fontStyle: 'italic',
  },
  storyPartContainer: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  storyPartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  storyPartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7F8C8D',
    textTransform: 'uppercase',
  },
  partIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 10,
  },
  partIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partIndicatorUnlocked: {
    backgroundColor: '#458E5E',
  },
  partIndicatorPlaying: {
    backgroundColor: '#68A4D2',
    transform: [{ scale: 1.1 }],
  },
  partIndicatorText: {
    color: '#95A5A6',
    fontWeight: 'bold',
    fontSize: 14,
  },
  partIndicatorTextUnlocked: {
    color: '#FFFFFF',
  },
  partIndicatorTextPlaying: {
    color: '#FFFFFF',
  },
  floatingScanContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  scanButton: {
    backgroundColor: '#458E5E',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    pointerEvents: 'auto',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginRight: 8,
    lineHeight: 24,
  },
  cameraIcon: {
    fontSize: 24,
    lineHeight: 24,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#68A4D2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    pointerEvents: 'auto',
  },
  playButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  playIcon: {
    fontSize: 30,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  cameraHeaderSafeArea: {
    backgroundColor: '#68A4D2',
  },
  cameraHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#68A4D2',
  },
  cameraBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBackArrow: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cameraLogoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraLogo: {
    width: 100,
    height: 40,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 12,
  },
  scanInstruction: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 30,
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
});
