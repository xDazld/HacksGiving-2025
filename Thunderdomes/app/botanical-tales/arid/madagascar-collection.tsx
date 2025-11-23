import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';

import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { OpenAIClient } from '@/services/OpenAIClient';
import { PlantStoryService } from '@/services/PlantStoryService';
import { TextToSpeechService } from '@/services/TextToSpeechService';
import { useUserPosition } from '@/hooks/useUserPosition';
import {
  fetchPlantsCsvText,
  parsePlantsCsv,
  pickRandomPlant,
  getSamplePlant,
  PlantRecord,
} from '@/utils/plantData';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
      story.slice(third * 2)
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
    story.slice(secondSplit).trim()
  ];
}

export default function MadagascarCollectionScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [plantStory, setPlantStory] = useState<string>('');
  const [isStoryLoading, setIsStoryLoading] = useState<boolean>(false);
  const [isAudioReady, setIsAudioReady] = useState<boolean>(false);
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
  const ttsService = useRef<TextToSpeechService>(new TextToSpeechService());
  
  // Progressive unlock state
  const [storyParts, setStoryParts] = useState<string[]>([]);
  const [unlockedParts, setUnlockedParts] = useState<number>(1); // Starts with part 1 unlocked
  const [currentPlayingPart, setCurrentPlayingPart] = useState<number>(-1); // -1 means nothing playing, 0-2 for parts
  const [waitingForThreshold, setWaitingForThreshold] = useState<{ part: number; threshold: number } | null>(null);
  
  // Get user position for progressive unlock
  const { progress, isCalibrated } = useUserPosition(500);

  useEffect(() => {
    // Generate a plant story when the screen loads
    generatePlantStory();

    // Cleanup TTS service when component unmounts
    return () => {
      ttsService.current.cleanup();
    };
  }, []);

  // Monitor progress to unlock parts
  useEffect(() => {
    if (isCalibrated && progress >= 33 && unlockedParts === 1) {
      console.log('✅ Unlocked part 2 at 33% progress');
      setUnlockedParts(2);
    }
    if (isCalibrated && progress >= 66 && unlockedParts === 2) {
      console.log('✅ Unlocked part 3 at 66% progress');
      setUnlockedParts(3);
    }
  }, [progress, isCalibrated, unlockedParts]);

  // Auto-continue when threshold is reached
  useEffect(() => {
    if (waitingForThreshold && isCalibrated && progress >= waitingForThreshold.threshold) {
      console.log(`✅ Threshold ${waitingForThreshold.threshold}% reached, continuing with part ${waitingForThreshold.part + 1}`);
      const nextPart = waitingForThreshold.part;
      setWaitingForThreshold(null);
      continueWithUnlockedPart(nextPart);
    }
  }, [waitingForThreshold, progress, isCalibrated]);

  async function generatePlantStory() {
    try {
      setIsStoryLoading(true);
      const csv = await fetchPlantsCsvText();
      const rows = parsePlantsCsv(csv);

      // Try to find a plant related to Madagascar, otherwise pick random
      let pick: PlantRecord | undefined;
      const madagascarPlants = rows.filter(
        r =>
          (r['Notes'] && r['Notes'].toLowerCase().includes('madagascar')) ||
          (r['Common Name'] &&
            r['Common Name'].toLowerCase().includes('madagascar')),
      );

      if (madagascarPlants.length > 0) {
        pick = pickRandomPlant(madagascarPlants);
      } else {
        pick = pickRandomPlant(rows);
      }

      if (!pick) pick = getSamplePlant();

      const client = new OpenAIClient();
      const service = new PlantStoryService(client);
      const story = await service.generateStory(pick);

      setPlantStory(story);

      // Split story into 3 parts
      const parts = splitStoryIntoThreeParts(story);
      setStoryParts(parts);
      console.log(`📖 Story split into ${parts.length} parts`);

      // Preload audio for first part only (will preload others on-demand)
      if (parts.length > 0 && parts[0]) {
        console.log('🔄 Starting audio preload for Part 1...');
        setIsAudioLoading(true);
        try {
          await ttsService.current.preloadAudio(parts[0]);
          setIsAudioReady(true);
          console.log('✅ Audio ready for playback (Part 1)');
        } catch (err) {
          console.error('⚠️ Audio preload failed:', err);
          setIsAudioReady(false);
        } finally {
          setIsAudioLoading(false);
        }
      }
    } catch (e) {
      console.error('Error generating story:', e);
      // Fallback to sample
      const client = new OpenAIClient();
      const service = new PlantStoryService(client);
      const story = await service.generateStory(getSamplePlant());
      setPlantStory(story);

      // Split fallback story into 3 parts
      const parts = splitStoryIntoThreeParts(story);
      setStoryParts(parts);
      console.log(`📖 Fallback story split into ${parts.length} parts`);

      // Preload audio for first part
      if (parts.length > 0 && parts[0]) {
        setIsAudioLoading(true);
        try {
          await ttsService.current.preloadAudio(parts[0]);
          setIsAudioReady(true);
          console.log('✅ Audio ready for playback (Part 1)');
        } catch (err) {
          console.error('⚠️ Audio preload failed:', err);
          setIsAudioReady(false);
        } finally {
          setIsAudioLoading(false);
        }
      }
    } finally {
      setIsStoryLoading(false);
    }
  }

  /**
   * Play a specific unlocked part
   */
  const continueWithUnlockedPart = async (partIndex: number) => {
    if (partIndex >= storyParts.length || partIndex < 0) {
      console.error('Invalid part index:', partIndex);
      return;
    }

    const partText = storyParts[partIndex];
    if (!partText) {
      console.error('No text for part:', partIndex);
      return;
    }

    try {
      console.log(`🎵 Playing part ${partIndex + 1} of ${storyParts.length}`);
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
      console.log('✅ All parts completed!');
      setCurrentPlayingPart(-1);
      return;
    }

    // Check if next part is unlocked
    const nextPartNumber = nextPartIndex + 1; // Convert 0-indexed to 1-indexed
    if (nextPartNumber <= unlockedParts) {
      // Next part is unlocked, play it immediately
      console.log(`✅ Part ${nextPartNumber} is unlocked, continuing...`);
      await continueWithUnlockedPart(nextPartIndex);
    } else {
      // Next part is locked, play "continue exploring" message
      console.log(`🔒 Part ${nextPartNumber} is locked, prompting user to explore`);
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
        console.log('⚠️ No story parts to play');
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

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Custom Header with Back Button */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ThemedText style={styles.backArrow}>←</ThemedText>
          </TouchableOpacity>

          {/* Center Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/DomesLogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Right Settings Button */}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Image
              source={require('@/assets/images/Settings.png')}
              style={styles.settingsIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <ThemedView style={styles.content}>
          {/* Title */}
          <ThemedText style={styles.title}>Madagascar Collection</ThemedText>

          {/* Tour Image */}
          <View style={styles.imageContainer}>
            <Image
              source={require('@/assets/images/madagascarcollection.png')}
              style={styles.tourImage}
              resizeMode="cover"
            />
          </View>

          {/* Featured Plant Story Section */}
          <View style={styles.storySection}>
            <ThemedText type="subtitle" style={styles.storyTitle}>
              Featured Plant Story
            </ThemedText>
            
            {/* Part Progress Indicator */}
            {storyParts.length > 0 && (
              <View style={styles.partIndicatorContainer}>
                {[1, 2, 3].map((partNum) => (
                  <View
                    key={partNum}
                    style={[
                      styles.partIndicator,
                      partNum <= unlockedParts && styles.partIndicatorUnlocked,
                      currentPlayingPart === partNum - 1 && styles.partIndicatorPlaying,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.partIndicatorText,
                        partNum <= unlockedParts && styles.partIndicatorTextUnlocked,
                        currentPlayingPart === partNum - 1 && styles.partIndicatorTextPlaying,
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
                Your Progress: {progress.toFixed(0)}%
                {waitingForThreshold && ` • Explore to ${waitingForThreshold.threshold}% to unlock next part`}
              </ThemedText>
            )}
            {!isCalibrated && storyParts.length > 0 && (
              <ThemedText style={styles.warningText}>
                ⚠️ Position tracking not calibrated. Visit Developer → BLE Scanner to calibrate.
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
                        {isUnlocked ? part : '🔒 Explore the dome to unlock this part...'}
                      </ThemedText>
                    </View>
                  );
                })}
              </>
            ) : plantStory ? (
              <ThemedText style={styles.storyText}>{plantStory}</ThemedText>
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
  },
  headerSafeArea: {
    backgroundColor: '#68A4D2',
    paddingTop: Platform.OS === 'android' ? 35 : 0,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#68A4D2',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 40,
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  settingsIcon: {
    width: 100,
    height: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 120,
  },
  content: {
    padding: 20,
    paddingTop: 30,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    paddingBottom: 5,
    color: '#333',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tourImage: {
    width: '100%',
    height: '100%',
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
  storySection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  storyTitle: {
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  storyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  partIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  partIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  partIndicatorUnlocked: {
    backgroundColor: '#68A4D2',
    borderColor: '#5090C0',
  },
  partIndicatorPlaying: {
    backgroundColor: '#4CAF50',
    borderColor: '#45a049',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  partIndicatorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
  },
  partIndicatorTextUnlocked: {
    color: '#FFFFFF',
  },
  partIndicatorTextPlaying: {
    color: '#FFFFFF',
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    color: '#68A4D2',
    fontWeight: '600',
  },
  warningText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
    color: '#f59e0b',
    fontStyle: 'italic',
  },
  storyPartContainer: {
    marginBottom: 20,
  },
  storyPartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  storyPartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#68A4D2',
    textTransform: 'uppercase',
  },
  storyTextLocked: {
    opacity: 0.5,
    fontStyle: 'italic',
  },
});
