# Using Position Context

The Position Context provides real-time user location tracking within the Mitchell Park Domes using BLE beacons. This guide shows you how to use it to conditionally render content based on user progress.

## Setup

The `PositionProvider` is already wrapped around your app in `_layout.tsx`, so you can use the `usePosition` hook from any component.

## Basic Usage

```typescript
import { usePosition } from '@/contexts/PositionContext';

export default function YourComponent() {
  const { position, isCalibrated } = usePosition();

  if (!isCalibrated) {
    return <Text>Position tracking not calibrated</Text>;
  }

  return (
    <View>
      <Text>Progress: {position?.progressPercentage.toFixed(0)}%</Text>
      <Text>Distance: {position?.distanceFromStart.toFixed(1)}m</Text>
    </View>
  );
}
```

## Conditional Content Based on Progress

### Example: Unlock Content as User Progresses

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { usePosition } from '@/contexts/PositionContext';

export default function ProgressLockedContent() {
  const { position, isCalibrated } = usePosition();
  const [unlockedSections, setUnlockedSections] = useState(1);

  useEffect(() => {
    if (position) {
      const progress = position.progressPercentage;
      
      // Unlock content based on progress thresholds
      if (progress >= 75) {
        setUnlockedSections(4); // All sections unlocked at 75%
      } else if (progress >= 50) {
        setUnlockedSections(3); // 3 sections at 50%
      } else if (progress >= 25) {
        setUnlockedSections(2); // 2 sections at 25%
      } else {
        setUnlockedSections(1); // First section always available
      }
    }
  }, [position?.progressPercentage]);

  return (
    <View>
      {/* Section 1 - Always available */}
      <View>
        <Text>Section 1: Introduction</Text>
        <Text>Welcome to the dome tour!</Text>
      </View>

      {/* Section 2 - Unlocks at 25% */}
      {unlockedSections >= 2 ? (
        <View>
          <Text>Section 2: Early Plants</Text>
          <Text>You've made progress! Here's more content...</Text>
        </View>
      ) : (
        <Text>🔒 Walk 25% through the dome to unlock</Text>
      )}

      {/* Section 3 - Unlocks at 50% */}
      {unlockedSections >= 3 ? (
        <View>
          <Text>Section 3: Midpoint Discovery</Text>
          <Text>Halfway there! Special content...</Text>
        </View>
      ) : (
        <Text>🔒 Walk 50% through the dome to unlock</Text>
      )}

      {/* Section 4 - Unlocks at 75% */}
      {unlockedSections >= 4 ? (
        <View>
          <Text>Section 4: Final Destination</Text>
          <Text>You've completed most of the journey!</Text>
        </View>
      ) : (
        <Text>🔒 Walk 75% through the dome to unlock</Text>
      )}

      {/* Progress indicator */}
      {isCalibrated && position && (
        <Text>Current Progress: {position.progressPercentage.toFixed(0)}%</Text>
      )}
    </View>
  );
}
```

## Check Proximity to Specific Beacon

```typescript
import { usePosition } from '@/contexts/PositionContext';

export default function BeaconProximityContent() {
  const { position } = usePosition();

  // Show content only when near LocationContext_3
  if (position?.nearestBeaconIndex === 3) {
    return (
      <View>
        <Text>🎯 You're near the special exhibit!</Text>
        <Text>Special content for this location...</Text>
      </View>
    );
  }

  return <Text>Walk to beacon 3 to see special content</Text>;
}
```

## Distance-Based Content

```typescript
import { usePosition } from '@/contexts/PositionContext';

export default function DistanceBasedContent() {
  const { position } = usePosition();

  if (!position) return null;

  const distance = position.distanceFromStart;

  return (
    <View>
      {distance < 10 && (
        <Text>You're near the start - Welcome!</Text>
      )}
      
      {distance >= 10 && distance < 20 && (
        <Text>You're in the middle section</Text>
      )}
      
      {distance >= 20 && (
        <Text>You're approaching the end!</Text>
      )}

      <Text>Distance traveled: {distance.toFixed(1)}m</Text>
    </View>
  );
}
```

## Available Position Data

The `position` object contains:

```typescript
{
  x: number,                    // X coordinate in meters from dome center
  y: number,                    // Y coordinate in meters from dome center
  nearestBeaconIndex: number,   // Index of closest beacon (0, 1, 2, ...)
  distanceFromStart: number,    // Distance in meters from LocationContext_0
  progressPercentage: number,   // Progress from start (0) to opposite beacon (100)
  confidence: number,           // Confidence of position estimate (0-1)
  calculationMethod: string     // Method used: 'relative', 'rssi-to-meters', or 'trilateration'
}
```

## Full Context API

```typescript
const {
  // Position data
  position,              // Current position (see above)
  isCalibrated,          // Has system been calibrated?
  domeConfig,            // Dome configuration (radius, total beacons, etc.)
  calibrationData,       // Calibration data for each beacon
  
  // Scanning state
  isScanning,            // Is BLE scanning active?
  beacons,               // Array of detected beacons
  error,                 // Error message if any
  
  // Actions
  startPositionTracking, // Start BLE scanning
  stopPositionTracking,  // Stop BLE scanning
  calibratePosition,     // Calibrate system (call at LocationContext_0)
  resetCalibration,      // Reset calibration
  
  // Settings
  calculationMethod,     // Current method: 'relative' | 'rssi-to-meters' | 'trilateration'
  setCalculationMethod,  // Change calculation method
} = usePosition();
```

## Important Notes

1. **Calibration Required**: The system must be calibrated at LocationContext_0 before position data is available. This should be done on the BLE Scanner page before navigating to other pages.

2. **Auto-Start Scanning**: If you want scanning to start automatically on your page (if already calibrated), add:
   ```typescript
   useEffect(() => {
     if (isCalibrated && !isScanning) {
       startPositionTracking();
     }
   }, [isCalibrated]);
   ```

3. **Real-Time Updates**: Position data updates automatically as the user moves (approximately every 500ms).

4. **Null Checks**: Always check if `position` is not null before accessing its properties.

