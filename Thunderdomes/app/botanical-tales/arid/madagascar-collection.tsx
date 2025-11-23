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
  Modal,
  Text,
  Linking,
} from 'react-native';

import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { OpenAIClient } from '@/services/OpenAIClient';
import { PlantStoryService } from '@/services/PlantStoryService';
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
import {
  fetchPlantsCsvText,
  parsePlantsCsv,
  pickRandomPlant,
  getSamplePlant,
  PlantRecord,
} from '@/utils/plantData';
import { useLocalization } from '@/contexts/LocalizationContext';
import { CustomBottomNav } from '@/components/CustomBottomNav';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const LANGUAGES = [
  { code: 'en', nameKey: 'languages.en' },
  { code: 'es', nameKey: 'languages.es' },
  { code: 'zh', nameKey: 'languages.zh' },
  { code: 'hi', nameKey: 'languages.hi' },
  { code: 'ar', nameKey: 'languages.ar' },
  { code: 'fr', nameKey: 'languages.fr' },
  { code: 'de', nameKey: 'languages.de' },
  { code: 'ja', nameKey: 'languages.ja' },
  { code: 'pt', nameKey: 'languages.pt' },
  { code: 'ru', nameKey: 'languages.ru' },
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
  const [menuVisible, setMenuVisible] = useState(false);
  const [languageExpanded, setLanguageExpanded] = useState(false);
  const { t, setLocale, locale } = useLocalization();
  const ttsService = useRef<TextToSpeechService>(new TextToSpeechService());
  
  // Progressive unlock state
  const [storyParts, setStoryParts] = useState<string[]>([]);
  const [unlockedParts, setUnlockedParts] = useState<number>(1); // Starts with part 1 unlocked
  const [currentPlayingPart, setCurrentPlayingPart] = useState<number>(-1); // -1 means nothing playing, 0-2 for parts
  const [waitingForThreshold, setWaitingForThreshold] = useState<{ part: number; threshold: number } | null>(null);
  
  // BLE scanning state
  const [beacons, setBeacons] = useState<BeaconData[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [autoCalibrationAttempted, setAutoCalibrationAttempted] = useState(false);
  
  // Get user position for progressive unlock
  const { progress, isCalibrated } = useUserPosition(500);

  useEffect(() => {
    // Set TTS language based on current locale
    ttsService.current.setLanguage(locale);

    // Generate a plant story when the screen loads or when language changes
    generatePlantStory();

    // Start BLE scanning for position tracking
    initializeBLEAndStartScanning();

    // Cleanup TTS service and BLE scanning when component unmounts
    return () => {
      ttsService.current.cleanup();
      stopScanning();
    };
  }, [locale]);

  // Auto-calibrate after beacons are detected (only if no existing calibration)
  useEffect(() => {
    async function checkAndAutoCalibrate() {
      const calibrationStatus = await isPositionSystemCalibrated();
      
      if (!autoCalibrationAttempted && beacons.length > 0 && !calibrationStatus) {
        // Wait 500ms to ensure all beacons are detected
        setTimeout(() => {
          performAutoCalibration();
        }, 500);
      }
    }
    
    checkAndAutoCalibrate();
  }, [beacons, autoCalibrationAttempted]);

  // Update position when beacons change (if calibrated)
  useEffect(() => {
    async function updatePosition() {
      const calibrationStatus = await isPositionSystemCalibrated();
      if (calibrationStatus && beacons.length > 0) {
        calculatePosition(beacons, 'trilateration', true);
      }
    }
    
    updatePosition();
  }, [beacons]);

  // Monitor progress to unlock parts
  useEffect(() => {
    if (isCalibrated && progress >= 33 && unlockedParts === 1) {
      setUnlockedParts(2);
    }
    if (isCalibrated && progress >= 66 && unlockedParts === 2) {
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
      const initialized = await initializeBLE();
      if (!initialized) {
        console.warn('⚠️ Failed to initialize BLE');
        return;
      }

      await startScanning((detectedBeacons: BeaconData[]) => {
        const filteredBeacons = getLocationContextBeacons(detectedBeacons);
        setBeacons(filteredBeacons);
      });

      setIsScanning(true);
    } catch (err: any) {
      console.error('❌ Failed to start BLE scanning:', err);
    }
  }

  /**
   * Auto-calibrate position system (assumes user is at LocationContext_0)
   * This auto-calibration does NOT persist to storage, so it's temporary for this session only
   */
  async function performAutoCalibration() {
    if (beacons.length === 0) {
      setAutoCalibrationAttempted(true);
      return;
    }

    // Check if LocationContext_0 is present
    const lc0 = beacons.find((b) => b.name === 'LocationContext_0');
    if (!lc0) {
      setAutoCalibrationAttempted(true);
      return;
    }
    
    // Auto-calibrate with saveToStorage = false (temporary calibration)
    const success = await calibrate(beacons, false);
    
    if (success) {
      console.log('✅ Auto-calibrated (temporary, not persisted)');
      // Trigger an immediate position calculation
      calculatePosition(beacons, 'rssi-to-meters', true);
    }
    
    setAutoCalibrationAttempted(true);
  }

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
      const story = await service.generateStory(pick, undefined, locale);

      setPlantStory(story);

      // Split story into 3 parts
      const parts = splitStoryIntoThreeParts(story);
      setStoryParts(parts);

      // Preload audio for first part only (will preload others on-demand)
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
      console.error('Error generating story:', e);
      // Fallback to sample
      const client = new OpenAIClient();
      const service = new PlantStoryService(client);
      const story = await service.generateStory(getSamplePlant(), undefined, locale);
      setPlantStory(story);

      // Split fallback story into 3 parts
      const parts = splitStoryIntoThreeParts(story);
      setStoryParts(parts);

      // Preload audio for first part
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

  const handleBack = () => {
    router.back();
  };

  const handleMenuItemPress = (item: string) => {
    switch (item) {
      case 'accessibility':
        router.push('/settings');
        setMenuVisible(false);
        break;
      case 'member':
        Linking.openURL('https://milwaukeedomes.org/membership');
        break;
      case 'donate':
        Linking.openURL('https://milwaukeedomes.org/donate');
        break;
      case 'calendar':
        Linking.openURL('https://milwaukeedomes.org/calendar');
        break;
      case 'website':
        Linking.openURL('https://milwaukeedomes.org');
        break;
    }
    setMenuVisible(false);
  };

  const handleLanguageSelect = async (code: string) => {
    await setLocale(code);
    setLanguageExpanded(false);
    setMenuVisible(false);
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

          {/* Right Hamburger Menu Button */}
          <TouchableOpacity
            style={styles.hamburgerButton}
            onPress={() => setMenuVisible(true)}
          >
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Hamburger Menu Modal */}
      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.sidebar} onStartShouldSetResponder={() => true}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <ScrollView style={styles.menuContent}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleMenuItemPress('accessibility')}
              >
                <Text style={styles.menuText}>{t('menu.accessibility')}</Text>
                <Text style={styles.menuIcon}>ⓘ</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => setLanguageExpanded(!languageExpanded)}
              >
                <Text style={styles.menuText}>{t('menu.language')}</Text>
                <Text style={styles.menuIcon}>🌐</Text>
              </TouchableOpacity>

              {languageExpanded && (
                <View style={styles.submenu}>
                  {LANGUAGES.map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={styles.submenuItem}
                      onPress={() => handleLanguageSelect(lang.code)}
                    >
                      <Text style={styles.submenuText}>{t(lang.nameKey)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleMenuItemPress('member')}
              >
                <Text style={styles.menuText}>{t('menu.becomeMember')}</Text>
                <Text style={styles.menuIcon}>📋</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleMenuItemPress('donate')}
              >
                <Text style={styles.menuText}>{t('menu.makeDonation')}</Text>
                <Text style={styles.menuIcon}>💝</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleMenuItemPress('calendar')}
              >
                <Text style={styles.menuText}>{t('menu.viewCalendar')}</Text>
                <Text style={styles.menuIcon}>📅</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleMenuItemPress('website')}
              >
                <Text style={styles.menuText}>{t('menu.visitWebsite')}</Text>
                <Text style={styles.menuIcon}>🏛️</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <ThemedView style={styles.content} lightColor="#F5F1E3" darkColor="#2C2416">
          {/* Title */}
          <ThemedText type="title" style={styles.title}>{t('madagascarTour.title')}</ThemedText>

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
              {t('madagascarTour.featuredPlantStory')}
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
      <CustomBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  hamburgerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerLine: {
    width: 25,
    height: 3,
    backgroundColor: '#FFFFFF',
    marginVertical: 3,
    borderRadius: 2,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  sidebar: {
    width: '85%',
    height: '100%',
    backgroundColor: '#5A7D6D',
    paddingTop: Platform.OS === 'android' ? 60 : 40,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 20,
    marginRight: 10,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
  },
  menuContent: {
    flex: 1,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 18,
    marginVertical: 8,
    borderRadius: 8,
  },
  menuText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginLeft: 10,
  },
  submenu: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    marginVertical: 5,
    marginLeft: 15,
    overflow: 'hidden',
  },
  submenuItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  submenuText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 200, // Extra space for bottom nav + play button
  },
  content: {
    padding: 20,
    paddingTop: 24,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 120 : 110,
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
