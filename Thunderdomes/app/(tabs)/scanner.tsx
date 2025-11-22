import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Alert, useColorScheme } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { 
  initializeBLE, 
  startScanning, 
  stopScanning, 
  getLocationContextBeacons,
  getSignalQuality,
  isBLEAvailable,
  getBLEState
} from '@/services/bleService';
import { BeaconData } from '@/types';

export default function ScannerScreen() {
  const [beacons, setBeacons] = useState<BeaconData[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [bleState, setBleState] = useState<string>('Unknown');
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();

  useEffect(() => {
    checkBLEAvailability();
    return () => {
      // Cleanup scanning when component unmounts
      stopScanning();
    };
  }, []);

  const checkBLEAvailability = async () => {
    if (!isBLEAvailable()) {
      setError('BLE is not available on this platform');
      return;
    }

    const state = await getBLEState();
    setBleState(state);

    if (state !== 'PoweredOn') {
      setError('Please turn on Bluetooth to scan for beacons');
    }
  };

  const handleStartScanning = async () => {
    setError(null);
    
    try {
      // Initialize BLE
      const initialized = await initializeBLE();
      if (!initialized) {
        setError('Failed to initialize BLE. Please check if Bluetooth is enabled.');
        return;
      }

      // Start scanning
      await startScanning((detectedBeacons: BeaconData[]) => {
        // Filter to only show LocationContext beacons
        const filteredBeacons = getLocationContextBeacons(detectedBeacons);
        setBeacons(filteredBeacons);
      });

      setIsScanning(true);
    } catch (err: any) {
      setError(err.message || 'Failed to start scanning');
      Alert.alert('Scanning Error', err.message || 'Failed to start scanning');
    }
  };

  const handleStopScanning = async () => {
    try {
      await stopScanning();
      setIsScanning(false);
    } catch (err: any) {
      setError(err.message || 'Failed to stop scanning');
    }
  };

  const renderBeaconItem = (beacon: BeaconData) => {
    const signalQuality = getSignalQuality(beacon.rssi);
    const signalColor = 
      signalQuality === 'Excellent' ? '#4caf50' :
      signalQuality === 'Good' ? '#8bc34a' :
      signalQuality === 'Fair' ? '#ff9800' : '#f44336';

    const cardBgColor = colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5';

    return (
      <View key={beacon.id} style={[styles.beaconCard, { backgroundColor: cardBgColor }]}>
        <View style={styles.beaconHeader}>
          <ThemedText style={styles.beaconName}>{beacon.name}</ThemedText>
          <View style={[styles.signalBadge, { backgroundColor: signalColor }]}>
            <ThemedText style={styles.signalText}>{signalQuality}</ThemedText>
          </View>
        </View>
        <View style={styles.beaconDetails}>
          <ThemedText style={styles.beaconInfo}>RSSI: {beacon.rssi} dBm</ThemedText>
          <ThemedText style={styles.beaconInfo}>ID: {beacon.id}</ThemedText>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          BLE Beacon Scanner
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Scanning for LocationContext beacons
        </ThemedText>
        
        {error && (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        )}

        <View style={styles.controls}>
          {!isScanning ? (
            <TouchableOpacity 
              style={styles.startButton} 
              onPress={handleStartScanning}
            >
              <ThemedText style={styles.buttonText}>Start Scanning</ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.stopButton} 
              onPress={handleStopScanning}
            >
              <ThemedText style={styles.buttonText}>Stop Scanning</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statusContainer}>
          <ThemedText style={styles.statusText}>
            Status: {isScanning ? 'Scanning...' : 'Idle'}
          </ThemedText>
          <ThemedText style={styles.statusText}>
            Beacons Found: {beacons.length}
          </ThemedText>
        </View>
      </View>

      <ScrollView style={styles.beaconList}>
        {beacons.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              {isScanning 
                ? 'Scanning for beacons...' 
                : 'No beacons detected. Start scanning to find LocationContext beacons.'}
            </ThemedText>
          </View>
        ) : (
          beacons.map(renderBeaconItem)
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 15,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  controls: {
    marginBottom: 15,
  },
  startButton: {
    backgroundColor: '#2196f3',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  statusText: {
    fontSize: 14,
    opacity: 0.8,
  },
  beaconList: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
  },
  beaconCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  beaconHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  beaconName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  signalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  signalText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  beaconDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  beaconInfo: {
    fontSize: 14,
    opacity: 0.7,
  },
});

