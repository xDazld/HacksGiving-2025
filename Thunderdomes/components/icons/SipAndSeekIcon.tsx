import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SipAndSeekIconProps {
  color?: string;
  size?: number;
}

export function SipAndSeekIcon({ color = '#FFFFFF', size = 60 }: SipAndSeekIconProps) {
  return (
    <MaterialCommunityIcons name="filter" size={size} color={color} />
  );
}

