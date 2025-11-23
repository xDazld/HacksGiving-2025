import React from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  ImageBackground,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

interface AudioTourCard {
  id: string;
  title: string;
  image: any;
}

// Audio tours for the Arid Dome
const aridDomeTours: AudioTourCard[] = [
  {
    id: 'madagascar-collection',
    title: 'Madagascar Collection',
    image: require('@/assets/images/madagascarcollection.png'),
  },
  {
    id: 'world-of-cacti',
    title: 'World of Cacti',
    image: require('@/assets/images/worldofcacti.png'),
  },
  {
    id: 'plants',
    title: 'Plants',
    image: require('@/assets/images/plants.png'),
  },
  {
    id: 'desert-blooms',
    title: 'Desert Blooms',
    image: require('@/assets/images/desertblooms.png'),
  },
  {
    id: 'canary-island-collection',
    title: 'Canary Island Collection',
    image: require('@/assets/images/canaryislandcollection.png'),
  },
];

export default function AridDomeScreen() {
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

      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.content}>
          {/* Title */}
          <ThemedText style={styles.title}>The Arid Dome</ThemedText>
          <ThemedText style={styles.subtitle}>Select an audio tour</ThemedText>

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
                    <ThemedText style={styles.tourTitle}>{tour.title}</ThemedText>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>
      </ScrollView>
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
  content: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
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

