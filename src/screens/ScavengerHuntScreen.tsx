import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function ScavengerHuntScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🔍 Scavenger Hunt</Text>
        <Text style={styles.description}>
          Explore the Milwaukee Domes and discover hidden treasures!
        </Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>
            This page will feature interactive scavenger hunt challenges
            throughout the three domes.
          </Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Coming Soon:</Text>
          <Text style={styles.infoItem}>• Plant identification challenges</Text>
          <Text style={styles.infoItem}>• QR code scanning at exhibits</Text>
          <Text style={styles.infoItem}>• Progress tracking</Text>
          <Text style={styles.infoItem}>• Achievement badges</Text>
          <Text style={styles.infoItem}>• Leaderboard</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
  },
  placeholderBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#3498db',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    color: '#3498db',
    textAlign: 'center',
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: '#e8f4f8',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  infoItem: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 8,
    lineHeight: 24,
  },
});
