import React, { useState } from 'react';
import { StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { useAuth } from '@/contexts/AuthContext';

interface SessionGuardProps {
  children: React.ReactNode;
  onStart: () => void;
  activityName: string;
}

export function SessionGuard({ children, onStart, activityName }: SessionGuardProps) {
  const { user, markTicketAsUsed } = useAuth();
  const [hasStarted, setHasStarted] = useState(false);

  const handleStart = () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to start an activity.');
      return;
    }

    if (user.hasUsedTicket) {
      Alert.alert(
        'Ticket Already Used',
        'You have already used your ticket for one tour or scavenger hunt. Please scan a new ticket to continue.',
      );
      return;
    }

    Alert.alert(
      'Start Activity',
      `Starting ${activityName} will use your ticket. After completing this activity, you will be logged out. Continue?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Start',
          onPress: async () => {
            await markTicketAsUsed();
            setHasStarted(true);
            onStart();
          },
        },
      ],
    );
  };

  if (hasStarted) {
    return <>{children}</>;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Ready to Start?
        </ThemedText>
        <ThemedText style={styles.description}>
          Your ticket includes one {activityName.toLowerCase()}. After you complete it, you'll be logged out and will need to scan a new ticket for another activity.
        </ThemedText>
        <TouchableOpacity style={styles.button} onPress={handleStart}>
          <ThemedText style={styles.buttonText}>Start {activityName}</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    marginBottom: 30,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

