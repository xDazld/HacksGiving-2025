import { useState, useEffect } from 'react';
import { 
  getUserPosition, 
  isPositionSystemCalibrated, 
  getDomeConfig 
} from '@/services/positionService';
import { UserPosition, DomeConfig } from '@/types';

/**
 * Custom hook to access real-time user position data from the BLE positioning system
 * 
 * @param pollInterval - How often to check for position updates (in milliseconds). Default: 500ms
 * @returns Object containing current position, calibration status, and dome configuration
 * 
 * @example
 * // Basic usage - get position updates
 * const { position, isCalibrated } = useUserPosition();
 * 
 * if (isCalibrated && position) {
 *   console.log('Progress:', position.progressPercentage); // 0-100
 *   console.log('Distance from start:', position.distanceFromStart); // meters
 *   console.log('Nearest beacon:', position.nearestBeaconIndex); // 0, 1, 2, etc.
 * }
 * 
 * @example
 * // Unlock content based on progress
 * const { position, isCalibrated } = useUserPosition();
 * const [maxUnlockedSegment, setMaxUnlockedSegment] = useState(3);
 * 
 * useEffect(() => {
 *   if (position && position.progressPercentage >= 50) {
 *     setMaxUnlockedSegment(6); // Unlock more content at 50%
 *   }
 *   if (position && position.progressPercentage >= 75) {
 *     setMaxUnlockedSegment(9); // Unlock all content at 75%
 *   }
 * }, [position?.progressPercentage]);
 * 
 * @example
 * // Check proximity to specific beacon
 * const { position } = useUserPosition();
 * 
 * if (position?.nearestBeaconIndex === 3) {
 *   // User is near LocationContext_3
 *   showLocationSpecificContent();
 * }
 * 
 * @example
 * // Custom poll interval for less frequent updates
 * const { position } = useUserPosition(1000); // Update every 1 second instead of 500ms
 */
export function useUserPosition(pollInterval: number = 500) {
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [domeConfig, setDomeConfig] = useState<DomeConfig | null>(null);

  useEffect(() => {
    // Initial check
    setIsCalibrated(isPositionSystemCalibrated());
    setPosition(getUserPosition());
    setDomeConfig(getDomeConfig());

    // Set up polling interval for position updates
    const interval = setInterval(() => {
      const calibrated = isPositionSystemCalibrated();
      setIsCalibrated(calibrated);
      
      if (calibrated) {
        const currentPosition = getUserPosition();
        setPosition(currentPosition);
        
        // Only update config if it changed (rare)
        const currentConfig = getDomeConfig();
        if (currentConfig && currentConfig.totalBeacons !== domeConfig?.totalBeacons) {
          setDomeConfig(currentConfig);
        }
      } else {
        setPosition(null);
        setDomeConfig(null);
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval, domeConfig?.totalBeacons]);

  return {
    /** Current user position with x, y coordinates, progress, distance, etc. Null if not calibrated */
    position,
    /** Whether the positioning system has been calibrated */
    isCalibrated,
    /** Dome configuration including radius, circumference, and total beacons */
    domeConfig,
    /** Progress percentage (0-100) from start to opposite beacon. Convenience accessor. */
    progress: position?.progressPercentage ?? 0,
    /** Distance in meters from LocationContext_0. Convenience accessor. */
    distanceFromStart: position?.distanceFromStart ?? 0,
    /** Index of nearest beacon. Convenience accessor. */
    nearestBeacon: position?.nearestBeaconIndex ?? null,
    /** Confidence level (0-1) of position estimate. Convenience accessor. */
    confidence: position?.confidence ?? 0,
  };
}

