import { BeaconData, BeaconAPIFormat } from '@/types';
import { Platform, PermissionsAndroid } from 'react-native';
import type { BleManager as BleManagerType, Device, BleError, Subscription } from 'react-native-ble-plx';

// Conditionally import BLE only on native platforms
let BleManager: { new (): BleManagerType } | unknown;
let State: { [key: string]: string } | unknown;
let manager: BleManagerType | null = null;
let bleAvailable = false;

if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const BLE = require('react-native-ble-plx');
    BleManager = BLE.BleManager;
    State = BLE.State;
    bleAvailable = true;
    // Note: Manager will be initialized lazily when needed
  } catch (error) {
    console.error('Failed to load react-native-ble-plx:', error);
    bleAvailable = false;
  }
}

// Mock State for platforms without BLE
if (!bleAvailable) {
  State = {
    PoweredOn: 'PoweredOn',
    PoweredOff: 'PoweredOff',
    Unknown: 'Unknown',
  };
}

let isInitialized = false;
let isScanning = false;
let stateSubscription: Subscription | null = null;

// Map to store detected devices
const detectedDevices = new Map<string, BeaconData>();

/**
 * Lazily initialize the BLE manager
 * Only creates the manager when it's actually needed
 */
function ensureManagerInitialized(): boolean {
  if (!bleAvailable || !BleManager) {
    return false;
  }
  
  if (manager === null) {

    const BleManagerClass = BleManager as { new (): BleManagerType };
    try {
      manager = new BleManagerClass();
    } catch (error) {
      console.error('Failed to create BLE Manager:', error);
      bleAvailable = false;
      return false;
    }
  }
  
  return true;
}

/**
 * Request Bluetooth and location permissions (Android specific)
 */
async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const apiLevel = Platform.Version as number;

    try {
      if (apiLevel >= 31) {
        // Android 12+ permissions
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED;
      } else if (apiLevel >= 23) {
        // Android 6.0 - 11 permissions
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }
  return true; // iOS handles permissions via Info.plist
}

/**
 * Initializes the BLE service
 * Sets up state monitoring and checks if BLE is ready
 */
export async function initializeBLE(): Promise<boolean> {
  if (!ensureManagerInitialized() || !manager) {
    console.warn('⚠️ BLE not available on this platform');
    return false;
  }

  try {
    // Wait for BLE to be ready by subscribing to state changes
    const state = await new Promise<string>((resolve) => {
      const subscription = manager!.onStateChange((newState: string) => {
        console.log('📡 BLE State changed to:', newState);
        if (newState !== 'Unknown') {
          subscription.remove();
          resolve(newState);
        }
      }, true); // true = emit current state immediately
    });
    
    console.log('📡 Final BLE State:', state, 'Expected:', (State as { [key: string]: string }).PoweredOn);
    isInitialized = state === (State as { [key: string]: string }).PoweredOn;
    
    if (!isInitialized) {
      console.warn(`⚠️ BLE not ready. Current state: ${state}. Please ensure Bluetooth is on and app has permission.`);
    } else {
      console.log('✅ BLE initialized successfully');
    }
    
    return isInitialized;
  } catch (error) {
    console.error('❌ Failed to initialize BLE:', error);
    return false;
  }
}

/**
 * Subscribe to BLE state changes
 * @param callback Function called when BLE state changes
 * @returns Unsubscribe function
 */
export function subscribeToBLEState(
  callback: (state: string) => void
): () => void {
  if (!ensureManagerInitialized() || !manager) {
    return () => {};
  }

  stateSubscription = manager.onStateChange((state: string) => {
    callback(state);
  }, true);

  return () => {
    if (stateSubscription) {
      stateSubscription.remove();
      stateSubscription = null;
    }
  };
}

/**
 * Starts scanning for BLE beacons
 * @param onDeviceFound Callback called when a device is detected
 * @returns Promise that resolves when scanning starts or rejects on error
 */
export async function startScanning(
  onDeviceFound: (devices: BeaconData[]) => void
): Promise<void> {
  if (!ensureManagerInitialized() || !manager) {
    throw new Error('BLE scanning not available on this platform');
  }

  if (isScanning) {
    console.warn('Scanning already in progress');
    return;
  }

  // Request permissions first
  const permissionsGranted = await requestPermissions();
  if (!permissionsGranted) {
    throw new Error('Permissions not granted. Cannot scan.');
  }

  // Check BLE state
  const currentState = await manager.state();
  if (currentState !== (State as { [key: string]: string }).PoweredOn) {
    throw new Error('Bluetooth must be powered on to scan.');
  }

  // Clear previous results
  detectedDevices.clear();
  isScanning = true;

  // Start scanning with allowDuplicates to get continuous RSSI updates
  manager.startDeviceScan(
    null,
    { allowDuplicates: true },
    (error: BleError | null, device: Device | null) => {
      if (error) {
        console.error('BLE Scan Error:', error.message);
        stopScanning();
        throw error;
      }

      // Only process devices with RSSI values
      if (device && device.rssi !== null) {
        detectedDevices.set(device.id, {
          id: device.id,
          name: device.name || 'Unknown Device',
          rssi: device.rssi,
        });

        // Notify callback with updated device list
        onDeviceFound(Array.from(detectedDevices.values()));
      }
    }
  );
}

/**
 * Stops scanning for BLE beacons
 */
export async function stopScanning(): Promise<void> {
  if (!manager) {
    return;
  }

  if (manager && isScanning) {
    manager.stopDeviceScan();
    isScanning = false;
  }
}

/**
 * Cleanup BLE resources
 * Call this when the app is closing or BLE is no longer needed
 */
export function cleanupBLE(): void {
  if (!manager) {
    return;
  }

  if (stateSubscription) {
    stateSubscription.remove();
    stateSubscription = null;
  }

  if (manager) {
    manager.stopDeviceScan();
    manager.destroy();
    manager = null;
  }

  isInitialized = false;
  isScanning = false;
  detectedDevices.clear();
}

/**
 * Get signal quality label based on RSSI value
 * @param rssi RSSI value in dBm
 */
export function getSignalQuality(rssi: number | null): string {
  if (rssi === null) return 'No Signal';
  // These thresholds are common for indoor locationing
  if (rssi > -60) return 'Excellent'; // Very close
  if (rssi > -75) return 'Good';
  if (rssi > -90) return 'Fair';
  return 'Poor'; // Far away
}

/**
 * Get the current BLE state
 */
export async function getBLEState(): Promise<string> {
  if (!ensureManagerInitialized()) {
    return (State as { [key: string]: string }).Unknown;
  }

  try {
    return await manager.state();
  } catch (error) {
    console.error('Failed to get BLE state:', error);
    return (State as { [key: string]: string }).Unknown;
  }
}

/**
 * Check if BLE is available on this platform
 */
export function isBLEAvailable(): boolean {
  return bleAvailable && BleManager !== undefined;
}

/**
 * Filters beacons to only include those matching the LocationContext_# pattern
 * @param beacons Array of all detected beacons
 * @returns Filtered array containing only LocationContext beacons
 */
export function getLocationContextBeacons(beacons: BeaconData[]): BeaconData[] {
  return beacons.filter((beacon) => {
    const match = beacon.name.match(/^LocationContext_(\d+)$/);
    return match !== null;
  });
}

/**
 * Formats beacon data into the API format: [[ids], [rssi]]
 * @param beacons Array of LocationContext beacons
 * @returns Formatted data for API: { ids: number[], rssi: number[] }
 */
export function formatBeaconDataForAPI(beacons: BeaconData[]): BeaconAPIFormat {
  const locationContextBeacons = getLocationContextBeacons(beacons);
  
  const ids: number[] = [];
  const rssi: number[] = [];
  
  locationContextBeacons.forEach((beacon) => {
    const match = beacon.name.match(/^LocationContext_(\d+)$/);
    if (match) {
      ids.push(parseInt(match[1], 10));
      rssi.push(beacon.rssi);
    }
  });
  
  return { ids, rssi };
}

/**
 * Gets the current scanning status
 */
export function getScanningStatus(): boolean {
  return isScanning;
}

/**
 * Gets the initialization status
 */
export function getInitializationStatus(): boolean {
  return isInitialized;
}

/**
 * Get a specific beacon by its LocationContext index
 * @param beacons Array of beacons to search
 * @param index LocationContext index (0, 1, 2, etc.)
 * @returns Beacon with the specified index or null if not found
 */
export function getBeaconByIndex(beacons: BeaconData[], index: number): BeaconData | null {
  const targetName = `LocationContext_${index}`;
  return beacons.find((beacon) => beacon.name === targetName) || null;
}