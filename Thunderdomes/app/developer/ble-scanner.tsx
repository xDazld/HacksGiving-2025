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
import {
  calibrate,
  calculatePosition,
  isPositionSystemCalibrated,
  getDomeConfig,
  getCalibrationData,
  resetCalibration,
  getUserPosition,
} from '@/services/positionService';
import { BeaconData, UserPosition, CalibrationData, DomeConfig } from '@/types';
import DomeFloorView from '@/components/DomeFloorView';

type CalculationMethod = 'relative' | 'rssi-to-meters' | 'trilateration';

export default function ScannerScreen() {
  const [beacons, setBeacons] = useState<BeaconData[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [bleState, setBleState] = useState<string>('Unknown');
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'floor' | 'list'>('floor');
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calculationMethod, setCalculationMethod] = useState<CalculationMethod>('rssi-to-meters');
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [domeConfig, setDomeConfig] = useState<DomeConfig | null>(null);
  const [calibrationData, setCalibrationData] = useState<CalibrationData[]>([]);
  const [smoothingEnabled, setSmoothingEnabled] = useState(true);
  
  const colorScheme = useColorScheme();
  const themeVariant = colorScheme === 'dark' ? 'dark' : 'light';

  const tabInactiveBg = colorScheme === 'dark' ? '#1f1f1f' : '#f0f0f0';
  const tabInactiveText = colorScheme === 'dark' ? '#d0d0d0' : '#555';
  const tabContainerStyle = [
    styles.tabSwitcher,
    {
      borderColor: colorScheme === 'dark' ? '#2f2f2f' : '#d0d0d0',
    },
  ];

  const floorCardStyle = [
    styles.floorCard,
    {
      backgroundColor: colorScheme === 'dark' ? '#1d1d1d' : '#ffffff',
      borderColor: colorScheme === 'dark' ? '#2f2f2f' : '#e0e0e0',
    },
  ];

  useEffect(() => {
    checkBLEAvailability();
    return () => {
      stopScanning();
    };
  }, []);

  // Update position when beacons change
  useEffect(() => {
    if (isCalibrated && beacons.length > 0) {
      const position = calculatePosition(beacons, calculationMethod, smoothingEnabled);
      setUserPosition(position);
    }
  }, [beacons, isCalibrated, calculationMethod, smoothingEnabled]);

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
    setBeacons([]);
    
    try {
      const initialized = await initializeBLE();
      if (!initialized) {
        setError('Failed to initialize BLE. Please check if Bluetooth is enabled.');
        return;
      }

      await startScanning((detectedBeacons: BeaconData[]) => {
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

  const handleCalibrate = () => {
    if (beacons.length === 0) {
      Alert.alert('Calibration Error', 'No beacons detected. Start scanning first.');
      return;
    }

    // Check if LocationContext_0 is present and has strong signal
    const lc0 = beacons.find((b) => b.name === 'LocationContext_0');
    if (!lc0) {
      Alert.alert(
        'Calibration Warning',
        'LocationContext_0 not detected. Make sure you are standing next to the starting beacon.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Calibrate Anyway', 
            onPress: () => performCalibration(),
            style: 'destructive'
          },
        ]
      );
      return;
    }

    // Check if LC_0 has the strongest signal
    const strongestBeacon = beacons.reduce((prev, current) => 
      (current.rssi > prev.rssi) ? current : prev
    );

    if (strongestBeacon.name !== 'LocationContext_0') {
      Alert.alert(
        'Calibration Warning',
        `LocationContext_0 is not the strongest signal. Strongest is ${strongestBeacon.name}. Make sure you are standing at the starting beacon (LC_0).`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Calibrate Anyway', 
            onPress: () => performCalibration(),
          },
        ]
      );
      return;
    }

    performCalibration();
  };

  const performCalibration = () => {
    const success = calibrate(beacons);
    
    if (success) {
      setIsCalibrated(true);
      setDomeConfig(getDomeConfig());
      setCalibrationData(getCalibrationData());
      Alert.alert(
        'Calibration Complete',
        `System calibrated with ${beacons.length} beacons. Total expected beacons: ${getDomeConfig()?.totalBeacons}`
      );
    } else {
      Alert.alert('Calibration Failed', 'Unable to calibrate. Please ensure beacons are detected.');
    }
  };

  const handleResetCalibration = () => {
    Alert.alert(
      'Reset Calibration',
      'Are you sure you want to reset the calibration? You will need to recalibrate at LocationContext_0.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetCalibration();
            setIsCalibrated(false);
            setUserPosition(null);
            setDomeConfig(null);
            setCalibrationData([]);
          },
        },
      ]
    );
  };

  const renderBeaconItem = (beacon: BeaconData) => {
    const signalQuality = getSignalQuality(beacon.rssi);
    const signalColor = 
      signalQuality === 'Excellent' ? '#4caf50' :
      signalQuality === 'Good' ? '#8bc34a' :
      signalQuality === 'Fair' ? '#ff9800' : '#f44336';

    const cardBgColor = colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5';

    // Parse beacon index
    const match = beacon.name.match(/^LocationContext_(\d+)$/);
    const beaconIndex = match ? parseInt(match[1], 10) : null;

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
          <ThemedText style={styles.beaconInfo}>ID: {beacon.id.substring(0, 8)}</ThemedText>
        </View>
        {isCalibrated && beaconIndex !== null && calibrationData[beaconIndex] && (
          <ThemedText style={styles.beaconInfo}>
            Baseline: {calibrationData[beaconIndex].baselineRSSI} dBm | 
            Angle: {calibrationData[beaconIndex].angleDeg.toFixed(0)}°
          </ThemedText>
        )}
      </View>
    );
  };

  const renderMethodSelector = () => {
    const methods: Array<{ id: CalculationMethod; label: string }> = [
      { id: 'relative', label: 'Relative' },
      { id: 'rssi-to-meters', label: 'RSSI→Meters' },
      { id: 'trilateration', label: 'Trilateration' },
    ];

    return (
      <View style={styles.methodSelector}>
        <View style={styles.methodRow}>
          <ThemedText style={styles.methodLabel}>Calculation Method:</ThemedText>
          <TouchableOpacity
            style={[
              styles.smoothingToggle,
              {
                backgroundColor: smoothingEnabled
                  ? '#10b981'
                  : colorScheme === 'dark'
                  ? '#2a2a2a'
                  : '#e0e0e0',
              },
            ]}
            onPress={() => setSmoothingEnabled(!smoothingEnabled)}
          >
            <ThemedText
              style={[
                styles.smoothingToggleText,
                {
                  color: smoothingEnabled ? '#fff' : colorScheme === 'dark' ? '#d0d0d0' : '#555',
                },
              ]}
            >
              {smoothingEnabled ? '✓ Smoothing' : 'Smoothing'}
            </ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.methodButtons}>
          {methods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodButton,
                {
                  backgroundColor: 
                    calculationMethod === method.id
                      ? '#2196f3'
                      : colorScheme === 'dark'
                      ? '#2a2a2a'
                      : '#e0e0e0',
                },
              ]}
              onPress={() => setCalculationMethod(method.id)}
            >
              <ThemedText
                style={[
                  styles.methodButtonText,
                  {
                    color: calculationMethod === method.id ? '#fff' : 
                           colorScheme === 'dark' ? '#d0d0d0' : '#555',
                  },
                ]}
              >
                {method.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderPositionMetrics = () => {
    if (!userPosition || !domeConfig) return null;

    return (
      <View style={styles.metricsContainer}>
        <View style={styles.metricRow}>
          <View style={styles.metricBox}>
            <ThemedText style={styles.metricLabel}>Distance from Start</ThemedText>
            <ThemedText style={styles.metricValue}>
              {userPosition.distanceFromStart.toFixed(1)}m
            </ThemedText>
          </View>
          <View style={styles.metricBox}>
            <ThemedText style={styles.metricLabel}>Progress</ThemedText>
            <ThemedText style={styles.metricValue}>
              {userPosition.progressPercentage.toFixed(0)}%
            </ThemedText>
          </View>
        </View>
        <View style={styles.metricRow}>
          <View style={styles.metricBox}>
            <ThemedText style={styles.metricLabel}>Nearest Beacon</ThemedText>
            <ThemedText style={styles.metricValue}>
              LC_{userPosition.nearestBeaconIndex}
            </ThemedText>
          </View>
          <View style={styles.metricBox}>
            <ThemedText style={styles.metricLabel}>Confidence</ThemedText>
            <ThemedText style={styles.metricValue}>
              {(userPosition.confidence * 100).toFixed(0)}%
            </ThemedText>
          </View>
        </View>
        <View style={styles.metricRow}>
          <View style={styles.metricBoxFull}>
            <ThemedText style={styles.metricLabel}>Position (x, y)</ThemedText>
            <ThemedText style={styles.metricValue}>
              ({userPosition.x.toFixed(1)}m, {userPosition.y.toFixed(1)}m)
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };

  // Prepare current beacon data for visualization
  const currentBeaconSignals = beacons.map((beacon) => {
    const match = beacon.name.match(/^LocationContext_(\d+)$/);
    const index = match ? parseInt(match[1], 10) : -1;
    return { index, rssi: beacon.rssi };
  }).filter(b => b.index >= 0);

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Dome Floor Positioning
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {isCalibrated 
              ? `Tracking position in ${domeConfig?.totalBeacons}-beacon dome` 
              : 'Stand at LocationContext_0 and calibrate'}
          </ThemedText>
          
          {error && (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          )}

          <View style={styles.controls}>
            <View style={styles.controlRow}>
              {!isScanning ? (
                <TouchableOpacity 
                  style={[styles.button, styles.startButton]} 
                  onPress={handleStartScanning}
                >
                  <ThemedText style={styles.buttonText}>Start Scanning</ThemedText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.button, styles.stopButton]} 
                  onPress={handleStopScanning}
                >
                  <ThemedText style={styles.buttonText}>Stop Scanning</ThemedText>
                </TouchableOpacity>
              )}
              
              {!isCalibrated ? (
                <TouchableOpacity 
                  style={[styles.button, styles.calibrateButton]}
                  onPress={handleCalibrate}
                  disabled={!isScanning || beacons.length === 0}
                >
                  <ThemedText style={styles.buttonText}>Calibrate</ThemedText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.button, styles.resetButton]}
                  onPress={handleResetCalibration}
                >
                  <ThemedText style={styles.buttonText}>Reset</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.statusContainer}>
            <ThemedText style={styles.statusText}>
              Status: {isScanning ? 'Scanning...' : 'Idle'} | 
              {isCalibrated ? ' Calibrated ✓' : ' Not Calibrated'}
            </ThemedText>
            <ThemedText style={styles.statusText}>
              Beacons: {beacons.length}
            </ThemedText>
          </View>
        </View>

        {isCalibrated && renderMethodSelector()}

        <View style={tabContainerStyle}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              { backgroundColor: tabInactiveBg },
              activeView === 'floor' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveView('floor')}
          >
            <ThemedText
              style={[
                styles.tabButtonText,
                { color: tabInactiveText },
                activeView === 'floor' && styles.tabButtonTextActive,
              ]}
            >
              Floor View
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

        {activeView === 'floor' ? (
          <View style={styles.visualContainer}>
            <View style={floorCardStyle}>
              <ThemedText style={styles.sectionTitle}>
                Dome Floor Map
              </ThemedText>
              {!isCalibrated ? (
                <ThemedText style={styles.placeholderText}>
                  Start scanning and calibrate at LocationContext_0 to see your position on the dome floor.
                </ThemedText>
              ) : domeConfig ? (
                <>
                  <DomeFloorView
                    domeConfig={domeConfig}
                    calibrationData={calibrationData}
                    userPosition={userPosition}
                    currentBeacons={currentBeaconSignals}
                    theme={themeVariant}
                  />
                  {renderPositionMetrics()}
                  <ThemedText style={styles.hintText}>
                    The red dot shows your estimated position. Walk toward the orange TARGET beacon.
                  </ThemedText>
                </>
              ) : (
                <ThemedText style={styles.placeholderText}>
                  Loading dome configuration...
                </ThemedText>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.beaconListContainer}>
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
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
  controlRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#2196f3',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  calibrateButton: {
    backgroundColor: '#10b981',
  },
  resetButton: {
    backgroundColor: '#f59e0b',
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
  methodSelector: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  methodLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  smoothingToggle: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  smoothingToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  methodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  methodButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#2196f3',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  visualContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  floorCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    paddingVertical: 20,
  },
  hintText: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 12,
    textAlign: 'center',
  },
  metricsContainer: {
    marginTop: 16,
    gap: 8,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    padding: 10,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
  },
  metricBoxFull: {
    flex: 1,
    padding: 10,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
  },
  metricLabel: {
    fontSize: 11,
    opacity: 0.7,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  beaconListContainer: {
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
