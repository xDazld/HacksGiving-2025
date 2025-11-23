import { Slot } from 'expo-router';
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { CustomHeader } from '@/components/CustomHeader';
import { CustomBottomNav } from '@/components/CustomBottomNav';
import { HamburgerMenu } from '@/components/HamburgerMenu';

export default function TabLayout() {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View style={styles.container}>
      <CustomHeader 
        menuVisible={menuVisible} 
        onMenuToggle={() => setMenuVisible(!menuVisible)} 
      />
      <View style={styles.contentWrapper}>
        <View style={styles.content}>
          <Slot />
        </View>
        
        {/* Hamburger Flyout Menu - Overlays only content area */}
        <HamburgerMenu 
          visible={menuVisible} 
          onClose={() => setMenuVisible(false)} 
        />
      </View>
      <CustomBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
  },
});
