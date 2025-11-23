import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BotanicalTalesIconProps {
  color?: string;
  size?: number;
}

export function BotanicalTalesIcon({ color = '#FFFFFF', size = 60 }: BotanicalTalesIconProps) {
  return (
    <MaterialCommunityIcons name="volume-high" size={size} color={color} />
  );
}

