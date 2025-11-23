import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { CalibrationData, UserPosition, DomeConfig } from '@/types';

interface DomeFloorViewProps {
  domeConfig: DomeConfig;
  calibrationData: CalibrationData[];
  userPosition: UserPosition | null;
  currentBeacons: Array<{ index: number; rssi: number }>;
  theme: 'light' | 'dark';
}

const DomeFloorView: React.FC<DomeFloorViewProps> = ({
  domeConfig,
  calibrationData,
  userPosition,
  currentBeacons,
  theme,
}) => {
  const size = 300;
  const center = size / 2;
  const padding = 40;
  const maxRadius = center - padding;
  
  // Scale factor: map dome radius (meters) to SVG pixels
  const scaleFactor = maxRadius / domeConfig.radius;

  // Colors
  const ringColor = theme === 'dark' ? '#4a5568' : '#c3cfe7';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
  const beaconColor = theme === 'dark' ? '#60a5fa' : '#3b82f6';
  const startBeaconColor = '#10b981'; // Green for LC_0
  const targetBeaconColor = '#f59e0b'; // Orange for opposite beacon
  const userColor = '#ef4444'; // Red for user position
  const progressLineColor = theme === 'dark' ? '#8b5cf6' : '#7c3aed';
  const textColor = theme === 'dark' ? '#e5e7eb' : '#374151';

  // Convert meters to SVG coordinates (relative to center)
  const metersToSVG = (x: number, y: number) => ({
    x: center + x * scaleFactor,
    y: center - y * scaleFactor, // Invert Y for SVG coordinate system
  });

  // Calculate opposite beacon index
  const oppositeBeaconIndex = Math.floor(domeConfig.totalBeacons / 2);

  // Get current signal strengths
  const beaconSignalMap = new Map(
    currentBeacons.map((b) => [b.index, b.rssi])
  );

  // Convert user position to SVG coordinates
  const userSVG = userPosition ? metersToSVG(userPosition.x, userPosition.y) : null;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Outer dome circle */}
        <Circle
          cx={center}
          cy={center}
          r={maxRadius}
          stroke={ringColor}
          strokeWidth={3}
          fill="none"
        />

        {/* Inner reference circles */}
        <Circle
          cx={center}
          cy={center}
          r={maxRadius * 0.66}
          stroke={gridColor}
          strokeWidth={1}
          fill="none"
          strokeDasharray="5,5"
        />
        <Circle
          cx={center}
          cy={center}
          r={maxRadius * 0.33}
          stroke={gridColor}
          strokeWidth={1}
          fill="none"
          strokeDasharray="5,5"
        />

        {/* Cardinal direction lines */}
        <Line
          x1={center - maxRadius}
          y1={center}
          x2={center + maxRadius}
          y2={center}
          stroke={gridColor}
          strokeWidth={1}
          strokeDasharray="3,3"
        />
        <Line
          x1={center}
          y1={center - maxRadius}
          x2={center}
          y2={center + maxRadius}
          stroke={gridColor}
          strokeWidth={1}
          strokeDasharray="3,3"
        />

        {/* Progress line from LC_0 to current position */}
        {userSVG && (
          <>
            {calibrationData
              .filter((cal) => cal.beaconIndex === 0)
              .map((lc0) => {
                const lc0SVG = metersToSVG(lc0.position.x, lc0.position.y);
                return (
                  <Line
                    key="progress-line"
                    x1={lc0SVG.x}
                    y1={lc0SVG.y}
                    x2={userSVG.x}
                    y2={userSVG.y}
                    stroke={progressLineColor}
                    strokeWidth={2}
                    opacity={0.6}
                    strokeDasharray="5,5"
                  />
                );
              })}
          </>
        )}

        {/* Beacon markers */}
        {calibrationData.map((beacon) => {
          const pos = metersToSVG(beacon.position.x, beacon.position.y);
          const isStart = beacon.beaconIndex === 0;
          const isTarget = beacon.beaconIndex === oppositeBeaconIndex;
          const currentRSSI = beaconSignalMap.get(beacon.beaconIndex);
          const isActive = currentRSSI !== undefined;

          // Signal strength indicator (larger when stronger)
          const signalStrength = currentRSSI
            ? Math.max(0, Math.min(1, (currentRSSI + 90) / 40)) // Normalize RSSI
            : 0;
          const outerRadius = isActive ? 8 + signalStrength * 6 : 6;

          let color = beaconColor;
          if (isStart) color = startBeaconColor;
          else if (isTarget) color = targetBeaconColor;

          return (
            <React.Fragment key={`beacon-${beacon.beaconIndex}`}>
              {/* Signal strength outer ring */}
              {isActive && (
                <Circle
                  cx={pos.x}
                  cy={pos.y}
                  r={outerRadius}
                  fill={color}
                  opacity={0.3}
                />
              )}
              {/* Beacon marker */}
              <Circle
                cx={pos.x}
                cy={pos.y}
                r={isStart || isTarget ? 7 : 5}
                fill={color}
                opacity={isActive ? 1 : 0.4}
              />
              {/* Beacon label */}
              <SvgText
                x={pos.x}
                y={pos.y - 15}
                fontSize="10"
                fill={textColor}
                textAnchor="middle"
                fontWeight={isStart || isTarget ? 'bold' : 'normal'}
              >
                {isStart ? 'START' : isTarget ? 'TARGET' : beacon.beaconIndex.toString()}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* User position indicator */}
        {userSVG && (
          <>
            {/* Outer glow */}
            <Circle cx={userSVG.x} cy={userSVG.y} r={12} fill={userColor} opacity={0.2} />
            {/* Inner dot */}
            <Circle cx={userSVG.x} cy={userSVG.y} r={7} fill={userColor} opacity={0.9} />
            {/* Center dot */}
            <Circle cx={userSVG.x} cy={userSVG.y} r={3} fill="#fff" />
            {/* Label */}
            <SvgText
              x={userSVG.x}
              y={userSVG.y + 25}
              fontSize="11"
              fill={userColor}
              textAnchor="middle"
              fontWeight="bold"
            >
              YOU
            </SvgText>
          </>
        )}

        {/* Center marker */}
        <Circle
          cx={center}
          cy={center}
          r={3}
          fill={theme === 'dark' ? '#9ca3af' : '#6b7280'}
        />

        {/* Scale indicator */}
        <Line
          x1={padding}
          y1={size - padding + 10}
          x2={padding + 50}
          y2={size - padding + 10}
          stroke={textColor}
          strokeWidth={2}
        />
        <Line
          x1={padding}
          y1={size - padding + 5}
          x2={padding}
          y2={size - padding + 15}
          stroke={textColor}
          strokeWidth={2}
        />
        <Line
          x1={padding + 50}
          y1={size - padding + 5}
          x2={padding + 50}
          y2={size - padding + 15}
          stroke={textColor}
          strokeWidth={2}
        />
        <SvgText
          x={padding + 25}
          y={size - padding + 30}
          fontSize="9"
          fill={textColor}
          textAnchor="middle"
        >
          {(50 / scaleFactor).toFixed(0)}m
        </SvgText>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
});

export default DomeFloorView;

