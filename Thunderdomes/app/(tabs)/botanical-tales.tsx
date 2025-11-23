import React from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useLocalization } from '@/contexts/LocalizationContext';

interface DomeCard {
  id: string;
  titleKey: string;
  image: any;
}

const domes: DomeCard[] = [
  {
    id: 'arid',
    titleKey: 'botanicalTales.desertDome',
    image: require('@/assets/images/desertDome.png'),
  },
  {
    id: 'tropical',
    titleKey: 'botanicalTales.tropicalDome',
    image: require('@/assets/images/tropicalDome.png'),
  },
  {
    id: 'floral',
    titleKey: 'botanicalTales.showDome',
    image: require('@/assets/images/showDome.png'),
  },
  {
    id: 'kids',
    titleKey: 'botanicalTales.kidsDome',
    image: require('@/assets/images/kidsDome.png'),
  },
];

export default function BotanicalTalesScreen() {
  const { t } = useLocalization();
  
  const handleDomePress = (domeId: string) => {
    if (domeId === 'arid') {
      // Navigate to the Arid Dome audio tour list
      router.push('/botanical-tales/arid' as any);
    } else {
      // Other domes coming soon
      console.log('Dome pressed:', domeId, '- Coming soon!');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <ThemedText style={styles.welcomeTitle}>{t('botanicalTales.welcome')}</ThemedText>
          <ThemedText style={styles.welcomeSubtitle}>
            {t('botanicalTales.selectDome')}
          </ThemedText>
        </View>

        {/* Dome Cards */}
        <View style={styles.domeCards}>
          {domes.map((dome) => (
            <TouchableOpacity
              key={dome.id}
              style={styles.domeCard}
              onPress={() => handleDomePress(dome.id)}
              activeOpacity={0.8}
            >
              <ImageBackground
                source={dome.image}
                style={styles.domeImage}
                imageStyle={styles.domeImageStyle}
              >
                <View style={styles.domeOverlay}>
                  <ThemedText style={styles.domeTitle}>{t(dome.titleKey)}</ThemedText>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  welcomeSection: {
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    paddingBottom: 5,
    color: '#333',
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  domeCards: {
    gap: 20,
  },
  domeCard: {
    width: '100%',
    height: 180,
    marginBottom: 20,
  },
  domeImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  domeImageStyle: {
    borderRadius: 12,
  },
  domeOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  domeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
});

