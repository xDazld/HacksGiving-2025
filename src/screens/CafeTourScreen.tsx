import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function CafeTourScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>☕ Café Tour</Text>
        <Text style={styles.description}>
          Discover the dining experiences at the Milwaukee Domes
        </Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>
            This page will showcase the café offerings, seasonal menus, and
            special dining events at the Domes.
          </Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Coming Soon:</Text>
          <Text style={styles.infoItem}>• Daily menu and specials</Text>
          <Text style={styles.infoItem}>• Nutritional information</Text>
          <Text style={styles.infoItem}>• Seasonal offerings</Text>
          <Text style={styles.infoItem}>• Event catering information</Text>
          <Text style={styles.infoItem}>• Online ordering</Text>
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
    borderColor: '#e67e22',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    color: '#e67e22',
    textAlign: 'center',
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: '#fef5e7',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#e67e22',
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
