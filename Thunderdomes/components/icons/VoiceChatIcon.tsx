import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface IconProps {
  size?: number;
  color?: string;
}

export function VoiceChatIcon({ size = 40, color = '#FFFFFF' }: IconProps) {
  return (
    <MaterialCommunityIcons name="microphone" size={size} color={color} />
  );
}
