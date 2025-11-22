import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import TabNavigator from './src/navigation/TabNavigator';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        {isLoggedIn ? (
          <TabNavigator />
        ) : (
          <LoginScreen onLogin={handleLogin} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
