import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface DomeDetectiveIconProps {
  color?: string;
  size?: number;
}

export function DomeDetectiveIcon({ color = '#FFFFFF', size = 60 }: DomeDetectiveIconProps) {
  return (
    <MaterialCommunityIcons name="magnify" size={size} color={color} />
  );
}

