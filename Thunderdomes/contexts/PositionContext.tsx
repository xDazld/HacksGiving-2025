import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  initializeBLE,
  startScanning,
  stopScanning,
  getLocationContextBeacons,
  isBLEAvailable,
} from '@/services/bleService';
import {
  calibrate,
  calculatePosition,
  isPositionSystemCalibrated,
  getDomeConfig,
  getCalibrationData,
  resetCalibration as resetPositionCalibration,
} from '@/services/positionService';
import { BeaconData, UserPosition, DomeConfig, CalibrationData } from '@/types';

interface PositionContextType {
  // Position data
  position: UserPosition | null;
  isCalibrated: boolean;
  domeConfig: DomeConfig | null;
  calibrationData: CalibrationData[];
  
  // Scanning state
  isScanning: boolean;
  beacons: BeaconData[];
  error: string | null;
  
  // Actions
  startPositionTracking: () => Promise<boolean>;
  stopPositionTracking: () => void;
  calibratePosition: (beacons?: BeaconData[]) => boolean;
  resetCalibration: () => void;
  
  // Calculation method
  calculationMethod: 'relative' | 'rssi-to-meters' | 'trilateration';
  setCalculationMethod: (method: 'relative' | 'rssi-to-meters' | 'trilateration') => void;
}

const PositionContext = createContext<PositionContextType | undefined>(undefined);

export function PositionProvider({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [domeConfig, setDomeConfig] = useState<DomeConfig | null>(null);
  const [calibrationData, setCalibrationData] = useState<CalibrationData[]>([]);
  
  const [isScanning, setIsScanning] = useState(false);
  const [beacons, setBeacons] = useState<BeaconData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [calculationMethod, setCalculationMethod] = useState<'relative' | 'rssi-to-meters' | 'trilateration'>('trilateration');

  // Auto-calculate position when beacons update
  useEffect(() => {
    if (isCalibrated && beacons.length > 0) {
      const newPosition = calculatePosition(beacons, calculationMethod, true);
      setPosition(newPosition);
    }
  }, [beacons, isCalibrated, calculationMethod]);

  // Handle app state changes (pause scanning when app backgrounded)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isScanning]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' && isScanning) {
      // Optionally pause scanning when app is backgrounded
      // stopScanning();
    } else if (nextAppState === 'active' && isCalibrated && !isScanning) {
      // Resume scanning when app comes back to foreground
      // startPositionTracking();
    }
  };

  const startPositionTracking = async (): Promise<boolean> => {
    if (!isBLEAvailable()) {
      setError('BLE is not available on this platform');
      return false;
    }

    try {
      setError(null);
      
      const initialized = await initializeBLE();
      if (!initialized) {
        setError('Failed to initialize BLE');
        return false;
      }

      await startScanning((detectedBeacons: BeaconData[]) => {
        const filteredBeacons = getLocationContextBeacons(detectedBeacons);
        setBeacons(filteredBeacons);
      });

      setIsScanning(true);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to start position tracking');
      return false;
    }
  };

  const stopPositionTracking = () => {
    stopScanning();
    setIsScanning(false);
    setBeacons([]);
  };

  const calibratePosition = (beaconsToUse?: BeaconData[]): boolean => {
    const beaconsForCalibration = beaconsToUse || beacons;
    
    if (beaconsForCalibration.length === 0) {
      setError('No beacons detected for calibration');
      return false;
    }

    const success = calibrate(beaconsForCalibration);
    
    if (success) {
      setIsCalibrated(true);
      setDomeConfig(getDomeConfig());
      setCalibrationData(getCalibrationData());
      setError(null);
    } else {
      setError('Calibration failed');
    }
    
    return success;
  };

  const resetCalibration = () => {
    resetPositionCalibration();
    setIsCalibrated(false);
    setPosition(null);
    setDomeConfig(null);
    setCalibrationData([]);
  };

  return (
    <PositionContext.Provider
      value={{
        position,
        isCalibrated,
        domeConfig,
        calibrationData,
        isScanning,
        beacons,
        error,
        startPositionTracking,
        stopPositionTracking,
        calibratePosition,
        resetCalibration,
        calculationMethod,
        setCalculationMethod,
      }}>
      {children}
    </PositionContext.Provider>
  );
}

export function usePosition() {
  const context = useContext(PositionContext);
  if (context === undefined) {
    throw new Error('usePosition must be used within a PositionProvider');
  }
  return context;
}

