import React, { useState, useEffect, useMemo } from 'react';
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
import BeaconCompass, { BeaconCompassSlot } from '@/components/BeaconCompass';

const RSSI_HISTORY_WINDOW_MS = 5000;
const MAX_SAMPLES_PER_BEACON = 60;
const RSSI_MIN = -100;
const RSSI_MAX = -40;

interface BeaconSample {
  index: number;
  name: string;
  samples: { rssi: number; timestamp: number }[];
}

type BeaconSampleMap = Record<number, BeaconSample>;

const parseLocationContextIndex = (name: string): number | null => {
  const match = name.match(/^LocationContext_(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const normalizeRssi = (rssi: number): number => {
  const clamped = clamp(rssi, RSSI_MIN, RSSI_MAX);
  return (clamped - RSSI_MIN) / (RSSI_MAX - RSSI_MIN);
};

const buildCompassModel = (history: BeaconSampleMap) => {
  const entries = Object.values(history);

  if (entries.length === 0) {
    return {
      totalSlots: 0,
      slots: [] as BeaconCompassSlot[],
      estimatedAngleDeg: null,
      confidence: 0,
    };
  }

  const maxIndex = entries.reduce((max, entry) => Math.max(max, entry.index), 0);
  const totalSlots = maxIndex + 1;
  const stats = new Map<number, { strength: number }>();

  entries.forEach((entry) => {
    if (entry.samples.length === 0) {
      return;
    }
    const avgRssi = entry.samples.reduce((sum, sample) => sum + sample.rssi, 0) / entry.samples.length;
    stats.set(entry.index, { strength: normalizeRssi(avgRssi) });
  });

  const slots: BeaconCompassSlot[] = Array.from({ length: totalSlots }, (_, index) => {
    const angleDeg = totalSlots > 0 ? (index / totalSlots) * 360 : 0;
    const stat = stats.get(index);
    return {
      index,
      angleDeg,
      strength: stat ? stat.strength : 0,
      present: Boolean(stat),
    };
  });

  const activeSlots = slots.filter((slot) => slot.present && slot.strength > 0);
  let estimatedAngleDeg: number | null = null;
  let confidence = 0;

  if (activeSlots.length >= 2) {
    const sumWeights = activeSlots.reduce((sum, slot) => sum + slot.strength, 0);
    if (sumWeights > 0) {
      let x = 0;
      let y = 0;

      activeSlots.forEach((slot) => {
        const angleRad = (slot.angleDeg * Math.PI) / 180;
        x += slot.strength * Math.cos(angleRad);
        y += slot.strength * Math.sin(angleRad);
      });

      const angle = (Math.atan2(y, x) * 180) / Math.PI;
      estimatedAngleDeg = (angle + 360) % 360;
      const magnitude = Math.sqrt(x * x + y * y);
      confidence = Math.min(1, magnitude / sumWeights);
    }
  }

  return {
    totalSlots,
    slots,
    estimatedAngleDeg,
    confidence,
  };
};

const updateBeaconSamples = (
  history: BeaconSampleMap,
  newBeacons: BeaconData[]
): BeaconSampleMap => {
  const now = Date.now();
  const next: BeaconSampleMap = {};

  Object.values(history).forEach((entry) => {
    const filtered = entry.samples.filter(
      (sample) => now - sample.timestamp <= RSSI_HISTORY_WINDOW_MS
    );
    if (filtered.length > 0) {
      next[entry.index] = {
        ...entry,
        samples: filtered.slice(-MAX_SAMPLES_PER_BEACON),
      };
    }
  });

  newBeacons.forEach((beacon) => {
    const index = parseLocationContextIndex(beacon.name);
    if (index === null) {
      return;
    }

    const existing = next[index] ?? {
      index,
      name: beacon.name,
      samples: [],
    };

    const samples = [
      ...existing.samples,
      { rssi: beacon.rssi, timestamp: now },
    ].slice(-MAX_SAMPLES_PER_BEACON);

    next[index] = {
      index,
      name: beacon.name,
      samples,
    };
  });

  return next;
};

export default function ScannerScreen() {
  const [beacons, setBeacons] = useState<BeaconData[]>([]);
  const [beaconSamples, setBeaconSamples] = useState<BeaconSampleMap>({});
  const [isScanning, setIsScanning] = useState(false);
  const [bleState, setBleState] = useState<string>('Unknown');
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'compass' | 'list'>('compass');
  const colorScheme = useColorScheme();
  const themeVariant = colorScheme === 'dark' ? 'dark' : 'light';

  const compassModel = useMemo(
    () => buildCompassModel(beaconSamples),
    [beaconSamples]
  );

  const activeBeaconCount = compassModel.slots.filter(
    (slot) => slot.present
  ).length;
  const headingText =
    compassModel.estimatedAngleDeg !== null
      ? `${compassModel.estimatedAngleDeg.toFixed(0)} deg`
      : 'Need >=2 beacons';
  const confidenceText = `${Math.round(compassModel.confidence * 100)}%`;
  const compassCardStyle = [
    styles.compassCard,
    {
      backgroundColor: colorScheme === 'dark' ? '#1d1d1d' : '#ffffff',
      borderColor: colorScheme === 'dark' ? '#2f2f2f' : '#e0e0e0',
    },
  ];
  const tabInactiveBg = colorScheme === 'dark' ? '#1f1f1f' : '#f0f0f0';
  const tabInactiveText = colorScheme === 'dark' ? '#d0d0d0' : '#555';
  const tabContainerStyle = [
    styles.tabSwitcher,
    {
      borderColor: colorScheme === 'dark' ? '#2f2f2f' : '#d0d0d0',
    },
  ];

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
    setBeaconSamples({});
    setBeacons([]);
    
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
        setBeaconSamples((prev) => updateBeaconSamples(prev, filteredBeacons));
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
      <View style={tabContainerStyle}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            { backgroundColor: tabInactiveBg },
            activeView === 'compass' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveView('compass')}
        >
          <ThemedText
            style={[
              styles.tabButtonText,
              { color: tabInactiveText },
              activeView === 'compass' && styles.tabButtonTextActive,
            ]}
          >
            Compass
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            { backgroundColor: tabInactiveBg },
            activeView === 'list' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveView('list')}
        >
          <ThemedText
            style={[
              styles.tabButtonText,
              { color: tabInactiveText },
              activeView === 'list' && styles.tabButtonTextActive,
            ]}
          >
            Beacons
          </ThemedText>
        </TouchableOpacity>
      </View>

      {activeView === 'compass' ? (
        <View style={styles.visualContainer}>
          <View style={compassCardStyle}>
            <ThemedText style={styles.sectionTitle}>
              Beacon Dome Overview
            </ThemedText>
            {compassModel.totalSlots === 0 ? (
              <ThemedText style={styles.compassPlaceholder}>
                Start scanning for LocationContext beacons to populate the
                compass.
              </ThemedText>
            ) : (
              <>
                <BeaconCompass
                  slots={compassModel.slots}
                  estimatedAngleDeg={compassModel.estimatedAngleDeg}
                  confidence={compassModel.confidence}
                  theme={themeVariant}
                />
                <View style={styles.compassMeta}>
                  <ThemedText style={styles.compassMetaText}>
                    Heading: {headingText}
                  </ThemedText>
                  <ThemedText style={styles.compassMetaText}>
                    Confidence: {confidenceText}
                  </ThemedText>
                  <ThemedText style={styles.compassMetaText}>
                    Active: {activeBeaconCount} / {compassModel.totalSlots}
                  </ThemedText>
                </View>
                <ThemedText style={styles.compassHint}>
                  The dot estimates your position inside the beacon circle
                  using recent RSSI readings.
                </ThemedText>
              </>
            )}
          </View>
        </View>
      ) : (
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
      )}
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
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  tabButtonActive: {
    backgroundColor: '#2196f3',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  tabButtonTextActive: {
    color: '#fff',
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
  visualContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  compassCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  compassMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  compassMetaText: {
    fontSize: 13,
    opacity: 0.8,
  },
  compassHint: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 8,
    textAlign: 'center',
  },
  compassPlaceholder: {
    fontSize: 14,
    opacity: 0.7,
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

