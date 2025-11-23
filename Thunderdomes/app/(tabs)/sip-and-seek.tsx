import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  Platform,
  Modal,
  Text,
  Linking,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useLocalization } from '@/contexts/LocalizationContext';

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

interface Beverage {
  id: string;
  nameKey: string;
  image: any;
  descKey: string;
}

// Featured beverages with plant-themed names
const featuredBeverages: Beverage[] = [
  {
    id: '1',
    nameKey: 'sipAndSeek.drinks.pricklyPear',
    image: require('@/assets/images/prickly_pear.jpg'),
    descKey: 'sipAndSeek.drinks.pricklyPearDesc',
  },
  {
    id: '2',
    nameKey: 'sipAndSeek.drinks.hibiscus',
    image: require('@/assets/images/hibiscus-fruit-tea.jpg'),
    descKey: 'sipAndSeek.drinks.hibiscusDesc',
  },
  {
    id: '3',
    nameKey: 'sipAndSeek.drinks.lavender',
    image: require('@/assets/images/honey-lavender.jpg'),
    descKey: 'sipAndSeek.drinks.lavenderDesc',
  },
  {
    id: '4',
    nameKey: 'sipAndSeek.drinks.vanilla',
    image: require('@/assets/images/vanilla-bean-frappuccino.jpg'),
    descKey: 'sipAndSeek.drinks.vanillaDesc',
  },
];

export default function SipAndSeekScreen() {
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [menuVisible, setMenuVisible] = useState(false);
  const [languageExpanded, setLanguageExpanded] = useState(false);
  const { t, setLocale } = useLocalization();

  const handleScanPress = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(t('sipAndSeek.cameraPermission'), t('sipAndSeek.cameraPermissionMessage'));
        return;
      }
    }
    setShowCamera(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setShowCamera(false);
    Alert.alert(t('sipAndSeek.barcodeScanned'), `${t('sipAndSeek.codeLabel')} ${data}`, [
      {
        text: 'OK',
        onPress: () => {
          // TODO: Process barcode and unlock drink adventure
          console.log('Processing barcode:', data);
        },
      },
    ]);
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

  const renderCameraModal = () => (
    <Modal
      visible={showCamera}
      animationType="slide"
      onRequestClose={() => setShowCamera(false)}
    >
      <View style={styles.fullScreenContainer}>
        {/* Header with Back Button */}
        <SafeAreaView style={styles.cameraHeaderSafeArea}>
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

            {/* Right Hamburger Menu Button */}
            <TouchableOpacity 
              style={styles.cameraHamburgerButton} 
              onPress={() => {
                setShowCamera(false);
                setMenuVisible(true);
              }}
            >
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

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

  return (
    <View style={styles.container}>
      {renderCameraModal()}
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.content}>
          {/* Title */}
          <ThemedText style={styles.title}>{t('sipAndSeek.title')}</ThemedText>

          {/* Description */}
          <ThemedText style={styles.description}>
            {t('sipAndSeek.description')}
          </ThemedText>

          {/* Featured Beverages Section */}
          <ThemedText style={styles.sectionTitle}>{t('sipAndSeek.featuredBeverages')}</ThemedText>

          {/* Beverage Grid */}
          <View style={styles.beverageGrid}>
            {featuredBeverages.map((beverage) => (
              <View key={beverage.id} style={styles.beverageCard}>
                <Image
                  source={beverage.image}
                  style={styles.beverageImage}
                  resizeMode="cover"
                />
                <View style={styles.beverageInfo}>
                  <ThemedText style={styles.beverageName} numberOfLines={2}>
                    {t(beverage.nameKey)}
                  </ThemedText>
                  <ThemedText style={styles.beverageDescription} numberOfLines={2}>
                    {t(beverage.descKey)}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </ThemedView>
      </ScrollView>

      {/* Floating Scan Button */}
      <View style={styles.floatingScanContainer}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScanPress}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.scanButtonText}>{t('sipAndSeek.scanButton')}</ThemedText>
          <ThemedText style={styles.cameraIcon}>📷</ThemedText>
        </TouchableOpacity>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingTop: 30,
    paddingBottom: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    paddingBottom: 5,
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  beverageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  beverageCard: {
    width: '48%',
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  beverageImage: {
    width: '100%',
    height: 120,
  },
  beverageInfo: {
    padding: 8,
    backgroundColor: '#FFF',
    minHeight: 70,
  },
  beverageName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    color: '#333',
    marginBottom: 4,
  },
  beverageDescription: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
    lineHeight: 14,
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
  cameraHeaderSafeArea: {
    backgroundColor: '#68A4D2',
    paddingTop: Platform.OS === 'android' ? 35 : 0,
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
  cameraHamburgerButton: {
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
  camera: {
    flex: 1,
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
});

