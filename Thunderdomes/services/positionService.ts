import { BeaconData, CalibrationData, UserPosition, DomeConfig } from '@/types';

// Constants
const DOME_CIRCUMFERENCE = 145; // meters
const DOME_RADIUS = DOME_CIRCUMFERENCE / (2 * Math.PI); // ≈ 23.08 meters
const PATH_LOSS_EXPONENT = 2.5; // Indoor environment
const REFERENCE_RSSI_AT_1M = -59; // Typical BLE beacon RSSI at 1 meter
const SMOOTHING_WINDOW_MS = 3000; // 3 seconds smoothing window
const MAX_POSITION_SAMPLES = 30; // Maximum samples to keep in history

// State
let calibrationData: CalibrationData[] = [];
let domeConfig: DomeConfig | null = null;
let isCalibrated = false;
let currentPosition: UserPosition | null = null;

// Position history for smoothing
interface PositionSample {
  position: UserPosition;
  timestamp: number;
}
let positionHistory: PositionSample[] = [];

/**
 * Parse LocationContext index from beacon name
 */
const parseLocationContextIndex = (name: string): number | null => {
  const match = name.match(/^LocationContext_(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
};

/**
 * Calculate Cartesian coordinates from angle and radius
 */
const polarToCartesian = (angleDeg: number, radius: number): { x: number; y: number } => {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: radius * Math.cos(angleRad),
    y: radius * Math.sin(angleRad),
  };
};

/**
 * Calculate distance between two points
 */
const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

/**
 * Calibrate the positioning system
 * User should be standing at LocationContext_0 when calling this
 */
export function calibrate(beacons: BeaconData[]): boolean {
  if (beacons.length === 0) {
    console.warn('No beacons detected for calibration');
    return false;
  }

  // Filter to only LocationContext beacons
  const locationBeacons = beacons.filter(
    (beacon) => parseLocationContextIndex(beacon.name) !== null
  );

  if (locationBeacons.length === 0) {
    console.warn('No LocationContext beacons found');
    return false;
  }

  // Find the highest beacon index
  const maxIndex = locationBeacons.reduce((max, beacon) => {
    const index = parseLocationContextIndex(beacon.name);
    return index !== null && index > max ? index : max;
  }, 0);

  const totalBeacons = maxIndex + 1;
  const beaconSpacingDeg = 360 / totalBeacons;

  // Create dome configuration
  domeConfig = {
    circumference: DOME_CIRCUMFERENCE,
    radius: DOME_RADIUS,
    totalBeacons,
    beaconSpacingDeg,
  };

  // Create calibration data for each beacon
  calibrationData = [];
  for (let i = 0; i < totalBeacons; i++) {
    // Beacons are placed counter-clockwise starting at 0 degrees (east)
    const angleDeg = i * beaconSpacingDeg;
    const position = polarToCartesian(angleDeg, DOME_RADIUS);

    // Find the beacon data for this index
    const beaconData = locationBeacons.find(
      (b) => parseLocationContextIndex(b.name) === i
    );

    calibrationData.push({
      beaconIndex: i,
      name: `LocationContext_${i}`,
      baselineRSSI: beaconData ? beaconData.rssi : -100, // Use -100 for missing beacons
      angleDeg,
      position,
    });
  }

  isCalibrated = true;
  console.log('Calibration complete:', {
    totalBeacons,
    beaconSpacingDeg,
    calibrationData,
  });

  return true;
}

/**
 * Method A: Relative RSSI-based position calculation
 * Compares current RSSI to calibrated baseline
 */
function calculatePositionRelativeRSSI(beacons: BeaconData[]): UserPosition | null {
  if (!isCalibrated || !domeConfig) return null;

  const locationBeacons = beacons.filter(
    (beacon) => parseLocationContextIndex(beacon.name) !== null
  );

  if (locationBeacons.length === 0) return null;

  // Special case: Check if we're at the calibration point (LC_0)
  const lc0Beacon = locationBeacons.find(b => parseLocationContextIndex(b.name) === 0);
  const lc0Calibration = calibrationData.find(c => c.beaconIndex === 0);
  
  if (lc0Beacon && lc0Calibration && lc0Calibration.baselineRSSI !== -100) {
    const rssiDiff = Math.abs(lc0Beacon.rssi - lc0Calibration.baselineRSSI);
    
    // If readings closely match calibration baseline, user is at LC_0
    if (rssiDiff < 5) {
      let matchCount = 0;
      let totalBeaconsChecked = 0;
      
      locationBeacons.forEach(beacon => {
        const index = parseLocationContextIndex(beacon.name);
        if (index === null) return;
        
        const calibration = calibrationData.find(c => c.beaconIndex === index);
        if (!calibration || calibration.baselineRSSI === -100) return;
        
        totalBeaconsChecked++;
        const diff = Math.abs(beacon.rssi - calibration.baselineRSSI);
        if (diff < 8) matchCount++;
      });
      
      if (matchCount >= Math.floor(totalBeaconsChecked * 0.7)) {
        const lc0 = calibrationData.find((c) => c.beaconIndex === 0);
        if (lc0) {
          const oppositeBeaconIndex = Math.floor(domeConfig.totalBeacons / 2);
          const oppositeBeacon = calibrationData.find((c) => c.beaconIndex === oppositeBeaconIndex);
          
          const maxDistance = oppositeBeacon 
            ? distance(lc0.position.x, lc0.position.y, oppositeBeacon.position.x, oppositeBeacon.position.y)
            : 2 * DOME_RADIUS;
          
          return {
            x: lc0.position.x,
            y: lc0.position.y,
            nearestBeaconIndex: 0,
            distanceFromStart: 0,
            progressPercentage: 0,
            confidence: 0.95,
            calculationMethod: 'relative',
          };
        }
      }
    }
  }

  // Calculate normalized signal strength for each beacon
  let totalWeight = 0;
  let weightedX = 0;
  let weightedY = 0;
  let maxStrength = 0;
  let nearestBeaconIndex = 0;

  locationBeacons.forEach((beacon) => {
    const index = parseLocationContextIndex(beacon.name);
    if (index === null) return;

    const calibration = calibrationData.find((c) => c.beaconIndex === index);
    if (!calibration) return;

    // Calculate relative strength (higher is better, closer to calibrated value)
    const rssiDiff = Math.abs(beacon.rssi - calibration.baselineRSSI);
    // Convert difference to a strength value (closer = stronger)
    const strength = Math.max(0, 1 - rssiDiff / 50); // Normalize to 0-1

    if (strength > maxStrength) {
      maxStrength = strength;
      nearestBeaconIndex = index;
    }

    // Weight position by signal strength
    const weight = strength ** 2; // Square to emphasize stronger signals
    totalWeight += weight;
    weightedX += calibration.position.x * weight;
    weightedY += calibration.position.y * weight;
  });

  if (totalWeight === 0) return null;

  const x = weightedX / totalWeight;
  const y = weightedY / totalWeight;

  // Calculate distance from LC_0
  const lc0 = calibrationData.find((c) => c.beaconIndex === 0);
  if (!lc0) return null;

  const distanceFromStart = distance(x, y, lc0.position.x, lc0.position.y);

  // Calculate progress toward opposite beacon
  const oppositeBeaconIndex = Math.floor(domeConfig.totalBeacons / 2);
  const oppositeBeacon = calibrationData.find((c) => c.beaconIndex === oppositeBeaconIndex);
  if (!oppositeBeacon) return null;

  const maxDistance = distance(
    lc0.position.x,
    lc0.position.y,
    oppositeBeacon.position.x,
    oppositeBeacon.position.y
  );
  const progressPercentage = Math.min(100, (distanceFromStart / maxDistance) * 100);

  return {
    x,
    y,
    nearestBeaconIndex,
    distanceFromStart,
    progressPercentage,
    confidence: Math.min(1, totalWeight / locationBeacons.length),
    calculationMethod: 'relative',
  };
}

/**
 * Method B: RSSI to Meters conversion using path loss formula
 * Formula: d = 10^((RSSI_cal - RSSI_curr) / (10 * n))
 */
function calculatePositionRSSIToMeters(beacons: BeaconData[]): UserPosition | null {
  if (!isCalibrated || !domeConfig) return null;

  const locationBeacons = beacons.filter(
    (beacon) => parseLocationContextIndex(beacon.name) !== null
  );

  if (locationBeacons.length === 0) return null;

  // Special case: Check if we're at the calibration point (LC_0)
  const lc0Beacon = locationBeacons.find(b => parseLocationContextIndex(b.name) === 0);
  const lc0Calibration = calibrationData.find(c => c.beaconIndex === 0);
  
  if (lc0Beacon && lc0Calibration && lc0Calibration.baselineRSSI !== -100) {
    const rssiDiff = Math.abs(lc0Beacon.rssi - lc0Calibration.baselineRSSI);
    
    if (rssiDiff < 5) {
      let matchCount = 0;
      let totalBeaconsChecked = 0;
      
      locationBeacons.forEach(beacon => {
        const index = parseLocationContextIndex(beacon.name);
        if (index === null) return;
        
        const calibration = calibrationData.find(c => c.beaconIndex === index);
        if (!calibration || calibration.baselineRSSI === -100) return;
        
        totalBeaconsChecked++;
        const diff = Math.abs(beacon.rssi - calibration.baselineRSSI);
        if (diff < 8) matchCount++;
      });
      
      if (matchCount >= Math.floor(totalBeaconsChecked * 0.7)) {
        const lc0 = calibrationData.find((c) => c.beaconIndex === 0);
        if (lc0) {
          const oppositeBeaconIndex = Math.floor(domeConfig.totalBeacons / 2);
          const oppositeBeacon = calibrationData.find((c) => c.beaconIndex === oppositeBeaconIndex);
          
          const maxDistance = oppositeBeacon 
            ? distance(lc0.position.x, lc0.position.y, oppositeBeacon.position.x, oppositeBeacon.position.y)
            : 2 * DOME_RADIUS;
          
          return {
            x: lc0.position.x,
            y: lc0.position.y,
            nearestBeaconIndex: 0,
            distanceFromStart: 0,
            progressPercentage: 0,
            confidence: 0.95,
            calculationMethod: 'rssi-to-meters',
          };
        }
      }
    }
  }

  // Calculate distances to each beacon
  let totalWeight = 0;
  let weightedX = 0;
  let weightedY = 0;
  let nearestBeaconIndex = 0;
  let minDistance = Infinity;

  locationBeacons.forEach((beacon) => {
    const index = parseLocationContextIndex(beacon.name);
    if (index === null) return;

    const calibration = calibrationData.find((c) => c.beaconIndex === index);
    if (!calibration || calibration.baselineRSSI === -100) return;

    // Calculate distance using path loss formula
    const rssiDelta = calibration.baselineRSSI - beacon.rssi;
    const estimatedDistance = Math.pow(10, rssiDelta / (10 * PATH_LOSS_EXPONENT));

    // Clamp distance to reasonable range (0 to 2*radius)
    const clampedDistance = Math.max(0, Math.min(estimatedDistance, 2 * DOME_RADIUS));

    if (clampedDistance < minDistance) {
      minDistance = clampedDistance;
      nearestBeaconIndex = index;
    }

    // Weight based on inverse distance (closer = more weight)
    const weight = 1 / (clampedDistance + 0.1); // Add small value to avoid division by zero
    totalWeight += weight;

    // Calculate position vector from beacon toward center, adjusted by distance
    const beaconToCenter = {
      x: -calibration.position.x,
      y: -calibration.position.y,
    };
    const centerDistance = distance(0, 0, calibration.position.x, calibration.position.y);
    const normalizedDirection = {
      x: beaconToCenter.x / centerDistance,
      y: beaconToCenter.y / centerDistance,
    };

    // User position is roughly distance away from beacon toward center
    const estimatedX = calibration.position.x + normalizedDirection.x * clampedDistance * 0.5;
    const estimatedY = calibration.position.y + normalizedDirection.y * clampedDistance * 0.5;

    weightedX += estimatedX * weight;
    weightedY += estimatedY * weight;
  });

  if (totalWeight === 0) return null;

  const x = weightedX / totalWeight;
  const y = weightedY / totalWeight;

  // Calculate distance from LC_0
  const lc0 = calibrationData.find((c) => c.beaconIndex === 0);
  if (!lc0) return null;

  const distanceFromStart = distance(x, y, lc0.position.x, lc0.position.y);

  // Calculate progress toward opposite beacon
  const oppositeBeaconIndex = Math.floor(domeConfig.totalBeacons / 2);
  const oppositeBeacon = calibrationData.find((c) => c.beaconIndex === oppositeBeaconIndex);
  if (!oppositeBeacon) return null;

  const maxDistance = distance(
    lc0.position.x,
    lc0.position.y,
    oppositeBeacon.position.x,
    oppositeBeacon.position.y
  );
  const progressPercentage = Math.min(100, (distanceFromStart / maxDistance) * 100);

  return {
    x,
    y,
    nearestBeaconIndex,
    distanceFromStart,
    progressPercentage,
    confidence: Math.min(1, totalWeight / (locationBeacons.length * 2)),
    calculationMethod: 'rssi-to-meters',
  };
}

/**
 * Method C: Trilateration using multiple beacon distances
 * Requires at least 3 beacons for 2D position
 */
function calculatePositionTrilateration(beacons: BeaconData[]): UserPosition | null {
  if (!isCalibrated || !domeConfig) return null;

  const locationBeacons = beacons.filter(
    (beacon) => parseLocationContextIndex(beacon.name) !== null
  );

  if (locationBeacons.length < 3) {
    // Fall back to RSSI-to-meters method if not enough beacons
    return calculatePositionRSSIToMeters(beacons);
  }

  // Special case: Check if we're at the calibration point (LC_0)
  // If current RSSI readings closely match calibration baseline, user is at LC_0
  const lc0Beacon = locationBeacons.find(b => parseLocationContextIndex(b.name) === 0);
  const lc0Calibration = calibrationData.find(c => c.beaconIndex === 0);
  
  if (lc0Beacon && lc0Calibration && lc0Calibration.baselineRSSI !== -100) {
    const rssiDiff = Math.abs(lc0Beacon.rssi - lc0Calibration.baselineRSSI);
    
    // Check if all beacons match their calibration baseline (within 5 dBm tolerance)
    let matchesCalibration = rssiDiff < 5;
    let matchCount = 0;
    let totalBeaconsChecked = 0;
    
    locationBeacons.forEach(beacon => {
      const index = parseLocationContextIndex(beacon.name);
      if (index === null) return;
      
      const calibration = calibrationData.find(c => c.beaconIndex === index);
      if (!calibration || calibration.baselineRSSI === -100) return;
      
      totalBeaconsChecked++;
      const diff = Math.abs(beacon.rssi - calibration.baselineRSSI);
      if (diff < 8) { // Allow 8 dBm tolerance for other beacons
        matchCount++;
      }
    });
    
    // If majority of beacons match calibration pattern, user is at calibration point
    if (matchesCalibration && matchCount >= Math.floor(totalBeaconsChecked * 0.7)) {
      const lc0 = calibrationData.find((c) => c.beaconIndex === 0);
      if (lc0) {
        const oppositeBeaconIndex = Math.floor(domeConfig.totalBeacons / 2);
        const oppositeBeacon = calibrationData.find((c) => c.beaconIndex === oppositeBeaconIndex);
        
        const maxDistance = oppositeBeacon 
          ? distance(lc0.position.x, lc0.position.y, oppositeBeacon.position.x, oppositeBeacon.position.y)
          : 2 * DOME_RADIUS;
        
        return {
          x: lc0.position.x,
          y: lc0.position.y,
          nearestBeaconIndex: 0,
          distanceFromStart: 0,
          progressPercentage: 0,
          confidence: 0.95,
          calculationMethod: 'trilateration',
        };
      }
    }
  }

  // Calculate distances to each beacon
  const beaconDistances: Array<{
    beacon: CalibrationData;
    distance: number;
  }> = [];

  locationBeacons.forEach((beacon) => {
    const index = parseLocationContextIndex(beacon.name);
    if (index === null) return;

    const calibration = calibrationData.find((c) => c.beaconIndex === index);
    if (!calibration || calibration.baselineRSSI === -100) return;

    // Calculate distance using path loss formula
    const rssiDelta = calibration.baselineRSSI - beacon.rssi;
    let estimatedDistance = Math.pow(10, rssiDelta / (10 * PATH_LOSS_EXPONENT));
    
    // For dome perimeter tracking, if RSSI is better than calibration (negative delta),
    // it means we're closer than when we calibrated (which was AT the beacon)
    // Treat this as being very close to the beacon
    if (rssiDelta < -5) {
      // Getting stronger signal than calibration baseline - we're very close
      estimatedDistance = Math.abs(rssiDelta) / 10; // Roughly 0.5-2 meters
    }
    
    const clampedDistance = Math.max(0.1, Math.min(estimatedDistance, 2 * DOME_RADIUS));

    beaconDistances.push({
      beacon: calibration,
      distance: clampedDistance,
    });
  });

  if (beaconDistances.length < 3) {
    return calculatePositionRSSIToMeters(beacons);
  }

  // Sort by distance and use the 3 closest beacons
  beaconDistances.sort((a, b) => a.distance - b.distance);
  
  // Select beacons with good geometric distribution for better 2D positioning
  // Use closest beacon plus two others that are well-separated angularly
  const b1 = beaconDistances[0]; // Closest beacon
  let b2 = beaconDistances[1];
  let b3 = beaconDistances[2];
  
  // Try to find beacons that are more spread out for better trilateration
  if (beaconDistances.length >= 4) {
    const angle1 = b1.beacon.angleDeg;
    let bestScore = -1;
    let bestB2 = b2;
    let bestB3 = b3;
    
    for (let i = 1; i < beaconDistances.length - 1; i++) {
      for (let j = i + 1; j < beaconDistances.length; j++) {
        const angle2 = beaconDistances[i].beacon.angleDeg;
        const angle3 = beaconDistances[j].beacon.angleDeg;
        
        // Calculate angular separation (want them well-distributed)
        const sep12 = Math.abs(angle2 - angle1);
        const sep13 = Math.abs(angle3 - angle1);
        const sep23 = Math.abs(angle3 - angle2);
        
        // Score based on angular distribution and distance (prefer closer + well-distributed)
        const angularScore = Math.min(sep12, sep13, sep23);
        const distanceScore = 1 / (beaconDistances[i].distance + beaconDistances[j].distance + 1);
        const score = angularScore * distanceScore;
        
        if (score > bestScore) {
          bestScore = score;
          bestB2 = beaconDistances[i];
          bestB3 = beaconDistances[j];
        }
      }
    }
    
    // Use best selection if significantly better
    if (bestScore > 30) { // Threshold for "good enough" distribution
      b2 = bestB2;
      b3 = bestB3;
    }
  }

  // Trilateration calculation
  // Solve system of circle equations
  const A = 2 * (b2.beacon.position.x - b1.beacon.position.x);
  const B = 2 * (b2.beacon.position.y - b1.beacon.position.y);
  const C =
    b1.distance ** 2 -
    b2.distance ** 2 -
    b1.beacon.position.x ** 2 +
    b2.beacon.position.x ** 2 -
    b1.beacon.position.y ** 2 +
    b2.beacon.position.y ** 2;

  const D = 2 * (b3.beacon.position.x - b2.beacon.position.x);
  const E = 2 * (b3.beacon.position.y - b2.beacon.position.y);
  const F =
    b2.distance ** 2 -
    b3.distance ** 2 -
    b2.beacon.position.x ** 2 +
    b3.beacon.position.x ** 2 -
    b2.beacon.position.y ** 2 +
    b3.beacon.position.y ** 2;

  const denominator = A * E - B * D;
  if (Math.abs(denominator) < 0.001) {
    // Beacons are collinear, fall back to weighted average
    return calculatePositionRSSIToMeters(beacons);
  }

  let x = (C * E - F * B) / denominator;
  let y = (A * F - D * C) / denominator;

  // Constrain position to be within reasonable bounds of the dome
  const distanceFromCenter = Math.sqrt(x * x + y * y);
  if (distanceFromCenter > DOME_RADIUS * 1.5) {
    // Position is unreasonably far from center, scale it back
    const scale = (DOME_RADIUS * 1.2) / distanceFromCenter;
    x *= scale;
    y *= scale;
  }

  // If position seems wrong (e.g., in the center when we shouldn't be), 
  // use weighted average as fallback
  const avgBeaconDistance = (b1.distance + b2.distance + b3.distance) / 3;
  if (distanceFromCenter < 5 && avgBeaconDistance > 15) {
    // We're showing near center but distances suggest we're far from beacons
    // Fall back to weighted method
    return calculatePositionRSSIToMeters(beacons);
  }

  // Find nearest beacon
  let nearestBeaconIndex = 0;
  let minDist = Infinity;
  calibrationData.forEach((cal) => {
    const dist = distance(x, y, cal.position.x, cal.position.y);
    if (dist < minDist) {
      minDist = dist;
      nearestBeaconIndex = cal.beaconIndex;
    }
  });

  // Calculate distance from LC_0
  const lc0 = calibrationData.find((c) => c.beaconIndex === 0);
  if (!lc0) return null;

  const distanceFromStart = distance(x, y, lc0.position.x, lc0.position.y);

  // Calculate progress toward opposite beacon
  const oppositeBeaconIndex = Math.floor(domeConfig.totalBeacons / 2);
  const oppositeBeacon = calibrationData.find((c) => c.beaconIndex === oppositeBeaconIndex);
  if (!oppositeBeacon) return null;

  const maxDistance = distance(
    lc0.position.x,
    lc0.position.y,
    oppositeBeacon.position.x,
    oppositeBeacon.position.y
  );
  const progressPercentage = Math.min(100, (distanceFromStart / maxDistance) * 100);

  // Calculate confidence based on consistency of beacon distances
  const errors = beaconDistances.slice(0, 3).map((bd) => {
    const calcDist = distance(x, y, bd.beacon.position.x, bd.beacon.position.y);
    return Math.abs(calcDist - bd.distance);
  });
  const avgError = errors.reduce((sum, err) => sum + err, 0) / errors.length;
  const confidence = Math.max(0, Math.min(1, 1 - avgError / DOME_RADIUS));

  return {
    x,
    y,
    nearestBeaconIndex,
    distanceFromStart,
    progressPercentage,
    confidence,
    calculationMethod: 'trilateration',
  };
}

/**
 * Smooth position using moving average over recent samples
 */
function smoothPosition(newPosition: UserPosition): UserPosition {
  const now = Date.now();
  
  // Add new position to history
  positionHistory.push({
    position: newPosition,
    timestamp: now,
  });

  // Remove old samples outside smoothing window
  positionHistory = positionHistory.filter(
    (sample) => now - sample.timestamp <= SMOOTHING_WINDOW_MS
  );

  // Keep only MAX_POSITION_SAMPLES most recent
  if (positionHistory.length > MAX_POSITION_SAMPLES) {
    positionHistory = positionHistory.slice(-MAX_POSITION_SAMPLES);
  }

  // If we don't have enough samples yet, return the current position
  if (positionHistory.length < 2) {
    return newPosition;
  }

  // Calculate weighted average (more recent = higher weight)
  let totalWeight = 0;
  let weightedX = 0;
  let weightedY = 0;
  let weightedConfidence = 0;

  positionHistory.forEach((sample, index) => {
    // Linear weight: more recent samples get higher weight
    const weight = index + 1; // 1, 2, 3, ... (oldest to newest)
    totalWeight += weight;
    weightedX += sample.position.x * weight;
    weightedY += sample.position.y * weight;
    weightedConfidence += sample.position.confidence * weight;
  });

  const smoothedX = weightedX / totalWeight;
  const smoothedY = weightedY / totalWeight;
  const smoothedConfidence = weightedConfidence / totalWeight;

  // Find nearest beacon to smoothed position
  let nearestBeaconIndex = newPosition.nearestBeaconIndex;
  let minDist = Infinity;
  calibrationData.forEach((cal) => {
    const dist = distance(smoothedX, smoothedY, cal.position.x, cal.position.y);
    if (dist < minDist) {
      minDist = dist;
      nearestBeaconIndex = cal.beaconIndex;
    }
  });

  // Recalculate distance from start with smoothed position
  const lc0 = calibrationData.find((c) => c.beaconIndex === 0);
  const distanceFromStart = lc0
    ? distance(smoothedX, smoothedY, lc0.position.x, lc0.position.y)
    : newPosition.distanceFromStart;

  // Recalculate progress percentage
  const oppositeBeaconIndex = domeConfig ? Math.floor(domeConfig.totalBeacons / 2) : 0;
  const oppositeBeacon = calibrationData.find((c) => c.beaconIndex === oppositeBeaconIndex);
  let progressPercentage = newPosition.progressPercentage;
  
  if (lc0 && oppositeBeacon) {
    const maxDistance = distance(
      lc0.position.x,
      lc0.position.y,
      oppositeBeacon.position.x,
      oppositeBeacon.position.y
    );
    progressPercentage = Math.min(100, (distanceFromStart / maxDistance) * 100);
  }

  return {
    x: smoothedX,
    y: smoothedY,
    nearestBeaconIndex,
    distanceFromStart,
    progressPercentage,
    confidence: smoothedConfidence,
    calculationMethod: newPosition.calculationMethod,
  };
}

/**
 * Calculate user position using specified method
 */
export function calculatePosition(
  beacons: BeaconData[],
  method: 'relative' | 'rssi-to-meters' | 'trilateration' = 'trilateration',
  useSmoothing: boolean = true
): UserPosition | null {
  if (!isCalibrated) {
    console.warn('System not calibrated');
    return null;
  }

  let position: UserPosition | null = null;

  switch (method) {
    case 'relative':
      position = calculatePositionRelativeRSSI(beacons);
      break;
    case 'rssi-to-meters':
      position = calculatePositionRSSIToMeters(beacons);
      break;
    case 'trilateration':
      position = calculatePositionTrilateration(beacons);
      break;
  }

  if (position && useSmoothing) {
    position = smoothPosition(position);
  }

  currentPosition = position;
  return position;
}

/**
 * Get the current user position (last calculated)
 */
export function getUserPosition(): UserPosition | null {
  return currentPosition;
}

/**
 * Check if the positioning system is calibrated
 */
export function isPositionSystemCalibrated(): boolean {
  return isCalibrated;
}

/**
 * Get the dome configuration
 */
export function getDomeConfig(): DomeConfig | null {
  return domeConfig;
}

/**
 * Get calibration data
 */
export function getCalibrationData(): CalibrationData[] {
  return calibrationData;
}

/**
 * Reset calibration
 */
export function resetCalibration(): void {
  calibrationData = [];
  domeConfig = null;
  isCalibrated = false;
  currentPosition = null;
  positionHistory = [];
}

/**
 * Clear position history (useful when user teleports or for testing)
 */
export function clearPositionHistory(): void {
  positionHistory = [];
}

/**
 * Get smoothing window duration in milliseconds
 */
export function getSmoothingWindow(): number {
  return SMOOTHING_WINDOW_MS;
}

