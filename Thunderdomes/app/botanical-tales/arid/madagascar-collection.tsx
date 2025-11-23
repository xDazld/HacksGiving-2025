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
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { OpenAIClient } from '@/services/OpenAIClient';
import { PlantStoryService } from '@/services/PlantStoryService';
import { TextToSpeechService } from '@/services/TextToSpeechService';
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

  useEffect(() => {
    // Set TTS language based on current locale
    ttsService.current.setLanguage(locale);

    // Generate a plant story when the screen loads or when language changes
    generatePlantStory();

    // Cleanup TTS service when component unmounts
    return () => {
      ttsService.current.cleanup();
    };
  }, [locale]);

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

      // Preload audio in the background after story is generated
      if (story) {
        console.log('🔄 Starting audio preload...');
        setIsAudioLoading(true);
        try {
          await ttsService.current.preloadAudio(story);
          setIsAudioReady(true);
          console.log('✅ Audio ready for playback');
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

      // Preload audio for fallback story too
      if (story) {
        setIsAudioLoading(true);
        try {
          await ttsService.current.preloadAudio(story);
          setIsAudioReady(true);
          console.log('✅ Audio ready for playback');
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

  const handlePlayPause = async () => {
    try {
      if (!plantStory) {
        console.log('⚠️ No story to play');
        return;
      }

      if (isPlaying) {
        // Currently playing, so pause it
        await ttsService.current.pause();
        setIsPlaying(false);
      } else {
        // Currently paused or not started, so play/resume
        await ttsService.current.speak(plantStory);
        setIsPlaying(true);

        // Monitor playback status to update UI when finished
        const checkPlayback = setInterval(() => {
          if (!ttsService.current.isPlaying()) {
            setIsPlaying(false);
            clearInterval(checkPlayback);
          }
        }, 500);
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
                <MaterialIcons name="info-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => setLanguageExpanded(!languageExpanded)}
              >
                <Text style={styles.menuText}>{t('menu.language')}</Text>
                <MaterialIcons name="language" size={24} color="#FFFFFF" />
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
                <MaterialCommunityIcons name="card-account-details-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleMenuItemPress('donate')}
              >
                <Text style={styles.menuText}>{t('menu.makeDonation')}</Text>
                <MaterialIcons name="volunteer-activism" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleMenuItemPress('calendar')}
              >
                <Text style={styles.menuText}>{t('menu.viewCalendar')}</Text>
                <MaterialIcons name="event" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleMenuItemPress('website')}
              >
                <Text style={styles.menuText}>{t('menu.visitWebsite')}</Text>
                <MaterialIcons name="public" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <ThemedView style={styles.content}>
          {/* Title */}
          <ThemedText style={styles.title}>{t('madagascarTour.title')}</ThemedText>

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
            {isStoryLoading ? (
              <ActivityIndicator size="small" color="#68A4D2" />
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
});
