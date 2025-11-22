import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
  const { user, logout, scanNewTicket } = useAuth();
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You will need to scan a new ticket to continue.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ],
    );
  };

  const handleScanNewTicket = () => {
    if (isScanning) return;
    setIsScanning(true);
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

  return (
    <>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Settings
          </ThemedText>

          <ThemedView style={styles.infoContainer}>
            <ThemedText style={styles.label}>Age:</ThemedText>
            <ThemedText style={styles.value}>{user?.age || 'N/A'}</ThemedText>
          </ThemedView>

          <ThemedView style={styles.infoContainer}>
            <ThemedText style={styles.label}>Ticket Status:</ThemedText>
            <ThemedText style={[
              styles.value,
              { color: user?.hasUsedTicket ? '#f44336' : '#4caf50' }
            ]}>
              {user?.hasUsedTicket ? 'Used' : 'Active'}
            </ThemedText>
          </ThemedView>

          {user?.hasUsedTicket && (
            <ThemedView style={styles.warningContainer}>
              <ThemedText style={styles.warningText}>
                Your ticket has been used. Scan a new ticket below to start another activity.
              </ThemedText>
            </ThemedView>
          )}

          {user?.hasUsedTicket && (
            <>
              {isScanning ? (
                <ActivityIndicator size="large" style={{ marginTop: 20 }} />
              ) : (
                <TouchableOpacity style={styles.scanButton} onPress={handleScanNewTicket}>
                  <ThemedText style={styles.scanButtonText}>Scan New Ticket</ThemedText>
                </TouchableOpacity>
              )}
            </>
          )}

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
          </TouchableOpacity>

          <ThemedView style={styles.infoSection}>
            <ThemedText style={styles.infoTitle}>About</ThemedText>
            <ThemedText style={styles.infoText}>
              Mitchell Park Domes Experience App
            </ThemedText>
            <ThemedText style={styles.infoText}>
              Version 1.0.0
            </ThemedText>
          </ThemedView>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
  },
  warningContainer: {
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 8,
    marginVertical: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#e65100',
  },
  scanButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoSection: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

