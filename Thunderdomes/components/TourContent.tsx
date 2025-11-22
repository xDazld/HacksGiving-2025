import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { TourPart } from '@/types';

interface TourContentProps {
  parts: TourPart[];
  currentProgress: number; // 0-100
}

export function TourContent({ parts, currentProgress }: TourContentProps) {
  const isPartUnlocked = (part: TourPart) => {
    return currentProgress >= part.unlockProgress;
  };

  return (
    <ThemedView style={styles.container}>
      {parts.map((part) => {
        const unlocked = isPartUnlocked(part);
        
        return (
          <ThemedView
            key={part.id}
            style={[styles.partContainer, !unlocked && styles.partLocked]}>
            <View style={styles.partHeader}>
              <ThemedText type="subtitle" style={styles.partTitle}>
                {part.title}
              </ThemedText>
              {!unlocked && (
                <ThemedView style={styles.lockBadge}>
                  <ThemedText style={styles.lockText}>
                    Unlocks at {part.unlockProgress}%
                  </ThemedText>
                </ThemedView>
              )}
            </View>
            {unlocked ? (
              <ThemedText style={styles.partContent}>{part.content}</ThemedText>
            ) : (
              <ThemedText style={styles.lockedContent}>
                Complete {part.unlockProgress}% of the tour to unlock this section.
              </ThemedText>
            )}
          </ThemedView>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  partContainer: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  partLocked: {
    opacity: 0.6,
    backgroundColor: '#e0e0e0',
  },
  partHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  partTitle: {
    flex: 1,
  },
  lockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#ff9800',
  },
  lockText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  partContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  lockedContent: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
  },
});

