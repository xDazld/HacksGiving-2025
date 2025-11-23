import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView, Linking, Animated, Dimensions, Platform } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
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

interface HamburgerMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function HamburgerMenu({ visible, onClose }: HamburgerMenuProps) {
  const [languageExpanded, setLanguageExpanded] = useState(false);
  const { t, setLocale } = useLocalization();
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in and fade in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out and fade out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: Dimensions.get('window').width,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleMenuItemPress = (item: string) => {
    switch (item) {
      case 'accessibility':
        router.push('/settings');
        onClose();
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
    onClose();
  };

  const handleLanguageSelect = async (code: string) => {
    await setLocale(code);
    setLanguageExpanded(false);
    onClose();
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.flyoutContainer,
        { opacity: fadeAnim }
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View 
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: slideAnim }]
            }
          ]}
          onStartShouldSetResponder={() => true}
        >
          <ScrollView style={styles.menuContent}>
            {/* Accessibility */}
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('accessibility')}
            >
              <Text style={styles.menuText}>{t('menu.accessibility')}</Text>
              <MaterialIcons name="info-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Language */}
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => setLanguageExpanded(!languageExpanded)}
            >
              <Text style={styles.menuText}>{t('menu.language')}</Text>
              <MaterialIcons name="language" size={24} color="#FFFFFF" />
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
              <MaterialCommunityIcons name="card-account-details-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Make a Donation */}
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('donate')}
            >
              <Text style={styles.menuText}>{t('menu.makeDonation')}</Text>
              <MaterialIcons name="volunteer-activism" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* View Our Calendar */}
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('calendar')}
            >
              <Text style={styles.menuText}>{t('menu.viewCalendar')}</Text>
              <MaterialIcons name="event" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Visit Our Website */}
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('website')}
            >
              <Text style={styles.menuText}>{t('menu.visitWebsite')}</Text>
              <MaterialIcons name="public" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flyoutContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  sidebar: {
    width: '75%',
    height: '100%',
    backgroundColor: '#5A7D6D',
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuContent: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 20,
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
});

