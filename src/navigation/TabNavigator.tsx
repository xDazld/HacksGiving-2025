import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ScavengerHuntScreen from '../screens/ScavengerHuntScreen';
import CafeTourScreen from '../screens/CafeTourScreen';
import AudioTourScreen from '../screens/AudioTourScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#27ae60',
        tabBarInactiveTintColor: '#7f8c8d',
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#27ae60',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="ScavengerHunt"
        component={ScavengerHuntScreen}
        options={{
          tabBarLabel: 'Scavenger Hunt',
          tabBarIcon: ({ color }) => (
            <TabIcon icon="🔍" color={color} />
          ),
          headerTitle: 'Scavenger Hunt',
        }}
      />
      <Tab.Screen
        name="CafeTour"
        component={CafeTourScreen}
        options={{
          tabBarLabel: 'Café Tour',
          tabBarIcon: ({ color }) => (
            <TabIcon icon="☕" color={color} />
          ),
          headerTitle: 'Café Tour',
        }}
      />
      <Tab.Screen
        name="AudioTour"
        component={AudioTourScreen}
        options={{
          tabBarLabel: 'Audio Tour',
          tabBarIcon: ({ color }) => (
            <TabIcon icon="🎧" color={color} />
          ),
          headerTitle: 'Audio Tour',
        }}
      />
    </Tab.Navigator>
  );
}

// Simple icon component using emoji
function TabIcon({ icon, color }: { icon: string; color: string }) {
  return <Text style={{ fontSize: 24, color }}>{icon}</Text>;
}
