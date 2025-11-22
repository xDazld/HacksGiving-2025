import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { BotanicalTalesIcon, DomeDetectiveIcon, SipAndSeekIcon } from '@/components/icons';
import { CustomHeader } from '@/components/CustomHeader';

// Theme Colors based on requirements
const TAB_BAR_COLOR = '#458E5E'; // Green background
const TAB_ACTIVE_BG = '#2E6B40'; // Darker green for active state
const TEXT_COLOR = '#FFFFFF';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <CustomHeader />,
        tabBarActiveTintColor: TEXT_COLOR,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.7)',
        tabBarActiveBackgroundColor: TAB_ACTIVE_BG, // Highlights active tab
        tabBarShowLabel: false, // Hide labels since SVG will include text
        tabBarStyle: styles.tabBar,
        tabBarButton: HapticTab,
        tabBarItemStyle: styles.tabItem,
      }}>
      <Tabs.Screen
        name="audio-tour"
        options={{
          title: 'Botanical Tails',
          tabBarIcon: ({ color }) => <BotanicalTalesIcon color={color} size={60} />,
        }}
      />
      <Tabs.Screen
        name="scavenger-hunt"
        options={{
          title: 'Dome Detective',
          tabBarIcon: ({ color }) => <DomeDetectiveIcon color={color} size={60} />,
        }}
      />
      <Tabs.Screen
        name="cafe-tour"
        options={{
          title: 'Sip & Seek',
          tabBarIcon: ({ color }) => <SipAndSeekIcon color={color} size={60} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: TAB_BAR_COLOR,
    height: 80,
    paddingBottom: 10,
    paddingTop: 10,
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabItem: {
    borderRadius: 12, // Rounded corners for square
    marginHorizontal: 8,
    marginVertical: 8,
    paddingVertical: 0,
    paddingHorizontal: 0,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Ensures active background respects border radius
  },
});
