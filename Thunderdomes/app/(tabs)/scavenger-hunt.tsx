import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { SessionGuard } from '@/components/SessionGuard';
import { useAuth } from '@/contexts/AuthContext';
import { fetchScavengerHunts } from '@/services/api';
import { ScavengerHunt, ScavengerHuntItem } from '@/types';

export default function ScavengerHuntScreen() {
  const { logout } = useAuth();
  const [hunts, setHunts] = useState<ScavengerHunt[]>([]);
  const [selectedHunt, setSelectedHunt] = useState<ScavengerHunt | null>(null);
  const [items, setItems] = useState<ScavengerHuntItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    loadHunts();
  }, []);

  const loadHunts = async () => {
    try {
      const fetchedHunts = await fetchScavengerHunts();
      setHunts(fetchedHunts);
    } catch (error) {
      Alert.alert('Error', 'Failed to load scavenger hunts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = () => {
    if (hunts.length > 0) {
      const hunt = hunts[0];
      setSelectedHunt(hunt);
      setItems([...hunt.items]);
      setHasStarted(true);
    }
  };

  const handleToggleItem = (itemId: string) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleComplete = async () => {
    const allCompleted = items.every((item) => item.completed);
    
    if (!allCompleted) {
      Alert.alert(
        'Not Complete',
        'Please find all items before completing the scavenger hunt.',
      );
      return;
    }

    Alert.alert(
      'Scavenger Hunt Complete!',
      'Congratulations! You found all the items. Thank you for visiting Mitchell Park Domes. You will now be logged out.',
      [
        {
          text: 'OK',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading scavenger hunts...</ThemedText>
      </ThemedView>
    );
  }

  if (!hasStarted) {
    return (
      <SessionGuard activityName="Scavenger Hunt" onStart={handleStart}>
        <ThemedView style={styles.container}>
          <ThemedText>This should not be visible</ThemedText>
        </ThemedView>
      </SessionGuard>
    );
  }

  if (!selectedHunt) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>No hunt selected</ThemedText>
      </ThemedView>
    );
  }

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          {selectedHunt.title}
        </ThemedText>
        <ThemedText style={styles.description}>{selectedHunt.description}</ThemedText>

        <ThemedView style={styles.progressContainer}>
          <ThemedText style={styles.progressText}>
            Found: {completedCount} / {totalCount}
          </ThemedText>
        </ThemedView>

        {items.map((item) => (
          <ThemedView key={item.id} style={styles.itemContainer}>
            <TouchableOpacity
              style={styles.itemRow}
              onPress={() => handleToggleItem(item.id)}>
              <ThemedView style={styles.checkboxContainer}>
                <ThemedView
                  style={[
                    styles.checkbox,
                    item.completed && styles.checkboxChecked,
                  ]}>
                  {item.completed && (
                    <ThemedText style={styles.checkmark}>✓</ThemedText>
                  )}
                </ThemedView>
              </ThemedView>
              <ThemedView style={styles.itemContent}>
                <ThemedText
                  type="subtitle"
                  style={[
                    styles.itemName,
                    item.completed && styles.itemNameCompleted,
                  ]}>
                  {item.name}
                </ThemedText>
                <ThemedText style={styles.itemDescription}>
                  {item.description}
                </ThemedText>
              </ThemedView>
            </TouchableOpacity>
          </ThemedView>
        ))}

        <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
          <ThemedText style={styles.completeButtonText}>Complete Hunt</ThemedText>
        </TouchableOpacity>
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
  },
  loadingText: {
    marginTop: 10,
    textAlign: 'center',
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    marginBottom: 20,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  progressContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0a7ea4',
  },
  itemContainer: {
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxContainer: {
    marginRight: 15,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#999',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    marginBottom: 5,
  },
  itemNameCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
  },
  completeButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

