import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';

interface ProgressTrackerProps {
  progress: number; // 0-100
}

const MILESTONES = [0, 33, 66, 100];

export function ProgressTracker({ progress }: ProgressTrackerProps) {
  const getMilestoneStatus = (milestone: number) => {
    if (progress >= milestone) {
      return 'completed';
    }
    return 'pending';
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Progress: {Math.round(progress)}%
      </ThemedText>
      <View style={styles.progressBarContainer}>
        {MILESTONES.map((milestone, index) => {
          const status = getMilestoneStatus(milestone);
          const isLast = index === MILESTONES.length - 1;
          
          return (
            <View key={milestone} style={styles.milestoneContainer}>
              <View
                style={[
                  styles.milestoneDot,
                  status === 'completed' && styles.milestoneDotCompleted,
                ]}
              />
              {!isLast && (
                <View
                  style={[
                    styles.progressLine,
                    status === 'completed' && styles.progressLineCompleted,
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
      <View style={styles.labelsContainer}>
        {MILESTONES.map((milestone) => (
          <ThemedText key={milestone} style={styles.label}>
            {milestone}%
          </ThemedText>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginVertical: 10,
  },
  title: {
    marginBottom: 15,
    textAlign: 'center',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  milestoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  milestoneDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ccc',
    borderWidth: 2,
    borderColor: '#999',
  },
  milestoneDotCompleted: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  progressLine: {
    flex: 1,
    height: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  progressLineCompleted: {
    backgroundColor: '#0a7ea4',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 5,
  },
  label: {
    fontSize: 12,
    color: '#666',
  },
});

