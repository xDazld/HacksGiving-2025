import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { BotanicalTalesIcon, DomeDetectiveIcon, SipAndSeekIcon } from '@/components/icons';

const TAB_BAR_COLOR = '#458E5E'; // Main green
const TAB_ACTIVE_BG = '#6BA57E'; // Lighter green for active state
const TEXT_COLOR = '#FFFFFF';
const INACTIVE_COLOR = 'rgba(255, 255, 255, 0.7)';

export function CustomBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    {
      name: 'audio-tour',
      path: '/(tabs)/audio-tour',
      icon: BotanicalTalesIcon,
      label: 'Botanical Tales',
    },
    {
      name: 'scavenger-hunt',
      path: '/(tabs)/scavenger-hunt',
      icon: DomeDetectiveIcon,
      label: 'Dome Detective',
    },
    {
      name: 'cafe-tour',
      path: '/(tabs)/cafe-tour',
      icon: SipAndSeekIcon,
      label: 'Sip & Seek',
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = pathname.includes(tab.name);
        const IconComponent = tab.icon;
        
        return (
          <TouchableOpacity
            key={tab.name}
            style={[
              styles.button,
              isActive && styles.buttonActive,
            ]}
            onPress={() => router.push(tab.path as any)}
          >
            <View style={styles.iconWrapper}>
              <IconComponent 
                color={isActive ? TEXT_COLOR : INACTIVE_COLOR} 
                size={40} 
              />
            </View>
            <Text style={[
              styles.label,
              { color: isActive ? TEXT_COLOR : INACTIVE_COLOR }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: TAB_BAR_COLOR,
    height: 100,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  button: {
    width: 85,
    height: 85,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  buttonActive: {
    backgroundColor: TAB_ACTIVE_BG,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    overflow: 'hidden',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});

