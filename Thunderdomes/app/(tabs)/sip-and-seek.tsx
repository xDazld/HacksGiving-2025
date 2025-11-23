import React from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useLocalization } from '@/contexts/LocalizationContext';

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
  const { t } = useLocalization();

  const handleDrinkPress = (id: string) => {
    router.push(`/sip-and-seek/${id}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.content} lightColor="#F5F1E3" darkColor="#2C2416">
          {/* Title */}
          <ThemedText type="title" style={styles.title}>{t('sipAndSeek.title')}</ThemedText>

          {/* Description */}
          <ThemedText style={styles.description}>
            {t('sipAndSeek.description')}
          </ThemedText>

          {/* Featured Beverages Section */}
          <ThemedText style={styles.sectionTitle}>
            {t('sipAndSeek.featuredBeverages')}
          </ThemedText>

          {/* Beverage Grid */}
          <View style={styles.beverageGrid}>
            {featuredBeverages.map(beverage => (
              <TouchableOpacity
                key={beverage.id}
                style={styles.beverageCard}
                onPress={() => handleDrinkPress(beverage.id)}
                activeOpacity={0.9}
              >
                <Image
                  source={beverage.image}
                  style={styles.beverageImage}
                  resizeMode="cover"
                />
                <View style={styles.beverageInfo}>
                  <ThemedText style={styles.beverageName} numberOfLines={2}>
                    {t(beverage.nameKey)}
                  </ThemedText>
                  <ThemedText
                    style={styles.beverageDescription}
                    numberOfLines={2}
                  >
                    {t(beverage.descKey)}
                  </ThemedText>
                </View>
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
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 0,
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
});
