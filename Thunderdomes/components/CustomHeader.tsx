import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, SafeAreaView, Platform, Modal, Text, ScrollView, Linking } from 'react-native';
import { router } from 'expo-router';
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

export function CustomHeader() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [languageExpanded, setLanguageExpanded] = useState(false);
  const { t, setLocale } = useLocalization();

  const handleMenuItemPress = (item: string) => {
    switch (item) {
      case 'accessibility':
        // Navigate to settings/accessibility page
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Left spacer to balance the hamburger menu */}
        <View style={styles.spacer} />

        {/* Center Logo */}
        <View style={styles.logoContainer}>
            <Image 
              source={require('@/assets/images/DomesLogo.png')} 
              style={{ width: 100, height: 40 }}
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

      {/* Sidebar Menu Modal */}
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
            {/* Close Button */}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <ScrollView style={styles.menuContent}>
              {/* Accessibility */}
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleMenuItemPress('accessibility')}
              >
                <Text style={styles.menuText}>{t('menu.accessibility')}</Text>
                <Text style={styles.menuIcon}>ⓘ</Text>
              </TouchableOpacity>

              {/* Language */}
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => setLanguageExpanded(!languageExpanded)}
              >
                <Text style={styles.menuText}>{t('menu.language')}</Text>
                <Text style={styles.menuIcon}>🌐</Text>
              </TouchableOpacity>

              {/* Language Submenu */}
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

              {/* Become a Member */}
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleMenuItemPress('member')}
              >
                <Text style={styles.menuText}>{t('menu.becomeMember')}</Text>
                <Text style={styles.menuIcon}>📋</Text>
              </TouchableOpacity>

              {/* Make a Donation */}
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleMenuItemPress('donate')}
              >
                <Text style={styles.menuText}>{t('menu.makeDonation')}</Text>
                <Text style={styles.menuIcon}>💝</Text>
              </TouchableOpacity>

              {/* View Our Calendar */}
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleMenuItemPress('calendar')}
              >
                <Text style={styles.menuText}>{t('menu.viewCalendar')}</Text>
                <Text style={styles.menuIcon}>📅</Text>
              </TouchableOpacity>

              {/* Visit Our Website */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#68A4D2', // Matching the blue tone
    paddingTop: Platform.OS === 'android' ? 35 : 0,
  },
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#68A4D2',
  },
  spacer: {
    width: 40, // Width of the settings button to center the logo
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  logoPlaceholder: {
    width: 100,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
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
});

