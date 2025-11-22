import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

export interface BeaconCompassSlot {
  index: number;
  angleDeg: number;
  strength: number;
  present: boolean;
}

interface BeaconCompassProps {
  slots: BeaconCompassSlot[];
  estimatedAngleDeg: number | null;
  confidence: number;
  theme: 'light' | 'dark';
}

const BeaconCompass: React.FC<BeaconCompassProps> = ({
  slots,
  estimatedAngleDeg,
  confidence,
  theme,
}) => {
  const size = 240;
  const center = size / 2;
  const radius = center - 18;
  const ringColor = theme === 'dark' ? '#4a5568' : '#c3cfe7';
  const tickColor = theme === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)';
  const inactiveColor = theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  const activeColor = '#42a5f5';
  const userColor = '#ef5350';
  const userRadius = radius * 0.65;

  const getPoint = (angleDeg: number, distance: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: center + Math.cos(rad) * distance,
      y: center + Math.sin(rad) * distance,
    };
  };

  const estimatedPoint =
    estimatedAngleDeg !== null ? getPoint(estimatedAngleDeg, userRadius) : null;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={ringColor}
          strokeWidth={2}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius * 0.4}
          stroke={tickColor}
          strokeWidth={1}
          fill="none"
        />
        {slots.map((slot) => {
          const outer = getPoint(slot.angleDeg, radius);
          const inner = getPoint(slot.angleDeg, radius * 0.85);
          return (
            <Line
              key={`tick-${slot.index}`}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke={slot.present ? activeColor : tickColor}
              strokeWidth={slot.present ? 2 : 1}
              opacity={slot.present ? 0.9 : 0.4}
              strokeLinecap="round"
            />
          );
        })}
        {slots.map((slot) => {
          const point = getPoint(slot.angleDeg, radius * 0.92);
          const markerSize = 4 + slot.strength * 6;
          return (
            <Circle
              key={`marker-${slot.index}`}
              cx={point.x}
              cy={point.y}
              r={markerSize}
              fill={slot.present ? activeColor : inactiveColor}
              opacity={slot.present ? 0.7 + 0.3 * slot.strength : 0.3}
            />
          );
        })}
        {estimatedPoint && (
          <>
            <Line
              x1={center}
              y1={center}
              x2={estimatedPoint.x}
              y2={estimatedPoint.y}
              stroke={userColor}
              strokeWidth={2}
              opacity={0.4 + 0.5 * confidence}
            />
            <Circle
              cx={estimatedPoint.x}
              cy={estimatedPoint.y}
              r={8}
              fill={userColor}
              opacity={0.6 + 0.4 * confidence}
            />
          </>
        )}
        <Circle
          cx={center}
          cy={center}
          r={4}
          fill={theme === 'dark' ? '#fafafa' : '#1a1a1a'}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BeaconCompass;

