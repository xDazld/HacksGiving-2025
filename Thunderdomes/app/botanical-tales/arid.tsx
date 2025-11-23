import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  ImageBackground,
  Image,
  SafeAreaView,
  Platform,
  Modal,
  Text,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useLocalization } from '@/contexts/LocalizationContext';
import { CustomBottomNav } from '@/components/CustomBottomNav';

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

interface AudioTourCard {
  id: string;
  titleKey: string;
  descKey: string;
  image: any;
}

// Audio tours for the Arid Dome
const aridDomeTours: AudioTourCard[] = [
  {
    id: 'madagascar-collection',
    titleKey: 'aridDome.madagascarCollection',
    descKey: 'aridDome.madagascarDesc',
    image: require('@/assets/images/madagascarcollection.png'),
  },
  {
    id: 'world-of-cacti',
    titleKey: 'aridDome.worldOfCacti',
    descKey: 'aridDome.cactiDesc',
    image: require('@/assets/images/worldofcacti.png'),
  },
  {
    id: 'plants',
    titleKey: 'aridDome.canaryIsland',
    descKey: 'aridDome.canaryDesc',
    image: require('@/assets/images/plants.png'),
  },
  {
    id: 'desert-blooms',
    titleKey: 'aridDome.desertBloom',
    descKey: 'aridDome.bloomDesc',
    image: require('@/assets/images/desertblooms.png'),
  },
  {
    id: 'canary-island-collection',
    titleKey: 'aridDome.canaryIsland',
    descKey: 'aridDome.canaryDesc',
    image: require('@/assets/images/canaryislandcollection.png'),
  },
];

export default function AridDomeScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [languageExpanded, setLanguageExpanded] = useState(false);
  const { t, setLocale } = useLocalization();

  const handleBack = () => {
    router.back();
  };

  const handleTourPress = (tourId: string) => {
    if (tourId === 'madagascar-collection') {
      // Navigate to Madagascar Collection audio tour
      router.push('/botanical-tales/arid/madagascar-collection' as any);
    } else {
      // Other tours coming soon
      console.log('Tour pressed:', tourId, '- Coming soon!');
    }
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

      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.content}>
          {/* Title */}
          <ThemedText style={styles.title}>{t('aridDome.title')}</ThemedText>
          <ThemedText style={styles.subtitle}>{t('aridDome.availableTours')}</ThemedText>

          {/* Audio Tour Cards */}
          <View style={styles.tourCards}>
            {aridDomeTours.map((tour) => (
              <TouchableOpacity
                key={tour.id}
                style={styles.tourCard}
                onPress={() => handleTourPress(tour.id)}
                activeOpacity={0.8}
              >
                <ImageBackground
                  source={tour.image}
                  style={styles.tourImage}
                  imageStyle={styles.tourImageStyle}
                >
                  <View style={styles.tourOverlay}>
                    <ThemedText style={styles.tourTitle}>{t(tour.titleKey)}</ThemedText>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>
      </ScrollView>
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
  content: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 120, // Extra space for bottom nav
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    paddingBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  tourCards: {
    gap: 20,
  },
  tourCard: {
    width: '100%',
    height: 180,
    marginBottom: 20,
  },
  tourImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tourImageStyle: {
    borderRadius: 12,
  },
  tourOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tourTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
});

