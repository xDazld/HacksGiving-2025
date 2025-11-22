import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function AudioTourScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🎧 Audio Tour</Text>
        <Text style={styles.description}>
          Immerse yourself in guided audio experiences through the Domes
        </Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>
            This page will provide interactive audio tours for the Desert Dome,
            Tropical Dome, and Show Dome with detailed information about plants
            and exhibits.
          </Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Coming Soon:</Text>
          <Text style={styles.infoItem}>• Multi-language audio guides</Text>
          <Text style={styles.infoItem}>• Desert Dome tour</Text>
          <Text style={styles.infoItem}>• Tropical Dome tour</Text>
          <Text style={styles.infoItem}>• Show Dome seasonal tour</Text>
          <Text style={styles.infoItem}>• Downloadable content</Text>
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
    borderColor: '#9b59b6',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9b59b6',
    textAlign: 'center',
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: '#f4ecf7',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#9b59b6',
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
