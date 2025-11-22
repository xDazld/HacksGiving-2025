import React, { useState } from 'react';
import { StyleSheet, Alert, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { useAuth } from '@/contexts/AuthContext';

interface SessionGuardProps {
  children: React.ReactNode;
  onStart: () => void;
  activityName: string;
}

export function SessionGuard({ children, onStart, activityName }: SessionGuardProps) {
  const { user, markTicketAsUsed, scanNewTicket } = useAuth();
  const [hasStarted, setHasStarted] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

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
      `Starting ${activityName} will use your ticket. After completing this activity, you can scan a new ticket to start another. Continue?`,
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

  const handleScanNewTicket = () => {
    setShowScanner(true);
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setShowScanner(false);
    setIsScanning(true);

    try {
      const success = await scanNewTicket(barcode);
      if (success) {
        Alert.alert(
          'Success!',
          'Your new ticket has been validated. You can now start a new activity.',
        );
      } else {
        Alert.alert(
          'Invalid Ticket',
          'The scanned barcode is not valid. Please try again with a valid ticket.',
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to validate ticket. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  if (hasStarted) {
    return <>{children}</>;
  }

  // Show different screen if ticket has been used
  if (user?.hasUsedTicket) {
    return (
      <>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.content}>
            <ThemedText type="title" style={styles.title}>
              Ticket Already Used
            </ThemedText>
            <ThemedText style={styles.description}>
              You have already used your ticket for one activity. To start another {activityName.toLowerCase()}, scan a new ticket.
            </ThemedText>
            {isScanning ? (
              <ActivityIndicator size="large" style={{ marginTop: 20 }} />
            ) : (
              <>
                <TouchableOpacity style={styles.button} onPress={handleScanNewTicket}>
                  <ThemedText style={styles.buttonText}>Scan New Ticket</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.secondaryButton]} 
                  onPress={() => router.push('/(tabs)/settings')}
                >
                  <ThemedText style={styles.buttonText}>Go to Settings</ThemedText>
                </TouchableOpacity>
              </>
            )}
          </ThemedView>
        </ThemedView>

        <Modal visible={showScanner} animationType="slide" onRequestClose={() => setShowScanner(false)}>
          <BarcodeScannerModal
            onBarcodeScanned={handleBarcodeScanned}
            onClose={() => setShowScanner(false)}
          />
        </Modal>
      </>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Ready to Start?
        </ThemedText>
        <ThemedText style={styles.description}>
          Your ticket includes one {activityName.toLowerCase()}. After you complete it, you can scan a new ticket to start another activity.
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
    marginBottom: 15,
  },
  secondaryButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

