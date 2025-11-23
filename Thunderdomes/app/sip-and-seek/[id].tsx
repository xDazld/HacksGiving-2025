import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useLocalization } from '@/contexts/LocalizationContext';
import { OpenAIClient } from '@/services/OpenAIClient';
import { DrinkStoryService, Beverage } from '@/services/DrinkStoryService';
import { TextToSpeechService } from '@/services/TextToSpeechService';
import { useUserPosition } from '@/hooks/useUserPosition';
import {
  initializeBLE,
  startScanning,
  stopScanning,
  getLocationContextBeacons,
  isBLEAvailable,
} from '@/services/bleService';
import {
  calibrate,
  calculatePosition,
  isPositionSystemCalibrated,
} from '@/services/positionService';
import { BeaconData } from '@/types';

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
  const { t, locale } = useLocalization();

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
  const [waitingForThreshold, setWaitingForThreshold] = useState<{ part: number; threshold: number } | null>(null);

  // BLE scanning state
  const [beacons, setBeacons] = useState<BeaconData[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [autoCalibrationAttempted, setAutoCalibrationAttempted] = useState(false);

  // Get user position for progressive unlock
  const { progress, isCalibrated } = useUserPosition(500);

  useEffect(() => {
    if (!drink) return;

    // Set TTS language based on current locale
    ttsService.current.setLanguage(locale);

    // Generate a drink story when the screen loads or when language changes
    generateDrinkStory();

    // Start BLE scanning for position tracking
    initializeBLEAndStartScanning();

    // Cleanup TTS service and BLE scanning when component unmounts
    return () => {
      ttsService.current.cleanup();
      stopScanning();
    };
  }, [locale, drink]);

  // Auto-calibrate after beacons are detected
  useEffect(() => {
    const calibrationStatus = isPositionSystemCalibrated();
    
    console.log('🔄 Auto-calibration check:', {
      autoCalibrationAttempted,
      beaconsCount: beacons.length,
      isCalibrated: calibrationStatus,
    });
    
    if (!autoCalibrationAttempted && beacons.length > 0 && !calibrationStatus) {
      console.log('⏱️ Scheduling auto-calibration in 500ms...');
      // Wait 500ms to ensure all beacons are detected
      const timer = setTimeout(() => {
        performAutoCalibration();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [beacons, autoCalibrationAttempted]);

  // Update position when beacons change (if calibrated)
  useEffect(() => {
    const calibrationStatus = isPositionSystemCalibrated();
    console.log('📍 Position update check:', {
      isCalibrated: calibrationStatus,
      beaconsCount: beacons.length,
      currentProgress: progress,
    });
    if (calibrationStatus && beacons.length > 0) {
      console.log('📍 Calculating position...');
      calculatePosition(beacons, 'rssi-to-meters', true);
    }
  }, [beacons]);

  // Monitor progress to unlock parts
  useEffect(() => {
    console.log('🔓 Unlock check:', {
      isCalibrated,
      progress: progress.toFixed(1),
      unlockedParts,
    });
    
    if (isCalibrated && progress >= 33 && unlockedParts === 1) {
      console.log('🔓 Unlocking part 2!');
      setUnlockedParts(2);
    }
    if (isCalibrated && progress >= 66 && unlockedParts === 2) {
      console.log('🔓 Unlocking part 3!');
      setUnlockedParts(3);
    }
  }, [progress, isCalibrated, unlockedParts]);

  // Auto-continue when threshold is reached
  useEffect(() => {
    if (waitingForThreshold && isCalibrated && progress >= waitingForThreshold.threshold) {
      const nextPart = waitingForThreshold.part;
      setWaitingForThreshold(null);
      continueWithUnlockedPart(nextPart);
    }
  }, [waitingForThreshold, progress, isCalibrated]);

  /**
   * Initialize BLE and start scanning for beacons
   */
  async function initializeBLEAndStartScanning() {
    if (!isBLEAvailable()) {
      console.warn('⚠️ BLE is not available on this platform');
      return;
    }

    try {
      console.log('🔵 Initializing BLE...');
      const initialized = await initializeBLE();
      if (!initialized) {
        console.warn('⚠️ Failed to initialize BLE');
        return;
      }

      console.log('🔵 Starting BLE scanning...');
      await startScanning((detectedBeacons: BeaconData[]) => {
        const filteredBeacons = getLocationContextBeacons(detectedBeacons);
        console.log(`📡 Beacons detected: ${detectedBeacons.length} total, ${filteredBeacons.length} LocationContext beacons`);
        setBeacons(filteredBeacons);
      });

      setIsScanning(true);
      console.log('✅ BLE scanning started');
    } catch (err: any) {
      console.error('❌ Failed to start BLE scanning:', err);
    }
  }

  /**
   * Auto-calibrate position system (assumes user is at LocationContext_0)
   */
  function performAutoCalibration() {
    console.log('🔧 Attempting auto-calibration with', beacons.length, 'beacons');
    
    if (beacons.length === 0) {
      console.log('⚠️ No beacons detected, skipping calibration');
      setAutoCalibrationAttempted(true);
      return;
    }

    // Log all beacon names
    console.log('📡 Detected beacons:', beacons.map(b => b.name).join(', '));

    // Check if LocationContext_0 is present
    const lc0 = beacons.find((b) => b.name === 'LocationContext_0');
    if (!lc0) {
      console.log('⚠️ LocationContext_0 not found, skipping calibration');
      setAutoCalibrationAttempted(true);
      return;
    }
    
    console.log('✅ LocationContext_0 found, calibrating...');
    const success = calibrate(beacons);
    
    if (success) {
      console.log('✅ Calibration successful, calculating initial position');
      // Trigger an immediate position calculation
      calculatePosition(beacons, 'rssi-to-meters', true);
    } else {
      console.log('❌ Calibration failed');
    }
    
    setAutoCalibrationAttempted(true);
  }

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
   * Called when a part finishes playing - check if next part is unlocked
   */
  const playNextPartOrWait = async (justFinishedPartIndex: number) => {
    const nextPartIndex = justFinishedPartIndex + 1;
    
    // Check if we've finished all parts
    if (nextPartIndex >= storyParts.length) {
      setCurrentPlayingPart(-1);
      return;
    }

    // Check if next part is unlocked
    const nextPartNumber = nextPartIndex + 1; // Convert 0-indexed to 1-indexed
    if (nextPartNumber <= unlockedParts) {
      // Next part is unlocked, play it immediately
      await continueWithUnlockedPart(nextPartIndex);
    } else {
      // Next part is locked, play "continue exploring" message
      const threshold = nextPartNumber === 2 ? 33 : 66;
      setWaitingForThreshold({ part: nextPartIndex, threshold });
      setCurrentPlayingPart(-1);
      
      try {
        const message = "Please continue exploring to learn more.";
        await ttsService.current.stop();
        await ttsService.current.preloadAudio(message);
        await ttsService.current.speak(message);
        setIsPlaying(true);
        
        // Monitor when message finishes
        const checkPlayback = setInterval(() => {
          if (!ttsService.current.isPlaying()) {
            setIsPlaying(false);
            clearInterval(checkPlayback);
          }
        }, 500);
      } catch (error) {
        console.error('❌ Error playing continue message:', error);
        setIsPlaying(false);
      }
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

            {/* Position Status */}
            {isCalibrated && (
              <ThemedText style={styles.progressText}>
                {progress.toFixed(0)}%
                {waitingForThreshold && ` • Explore to ${waitingForThreshold.threshold}% to unlock next part`}
              </ThemedText>
            )}
            {!isCalibrated && isScanning && (
              <ThemedText style={styles.infoText}>
                🔍 Scanning for beacons... {beacons.length} detected
              </ThemedText>
            )}
            {!isCalibrated && autoCalibrationAttempted && (
              <ThemedText style={styles.warningText}>
                ⚠️ Position tracking not available. Make sure you're at the starting point and Bluetooth is enabled.
              </ThemedText>
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
                          : '🔒 Explore the area to unlock this part...'}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 150,
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
  progressText: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 12,
    color: '#999',
    opacity: 0.7,
  },
  warningText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
    color: '#f59e0b',
    fontStyle: 'italic',
  },
  infoText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
    color: '#68A4D2',
    fontStyle: 'italic',
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#68A4D2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    pointerEvents: 'auto',
  },
  playButtonDisabled: {
    backgroundColor: '#B0B0B0',
    opacity: 0.6,
  },
  playIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 70,
  },
});
