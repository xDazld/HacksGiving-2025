import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CustomHeaderProps {
  menuVisible: boolean;
  onMenuToggle: () => void;
}

export function CustomHeader({ menuVisible, onMenuToggle }: CustomHeaderProps) {
  // Animation values for hamburger to X transformation
  const topLineRotate = useRef(new Animated.Value(0)).current;
  const topLineTranslate = useRef(new Animated.Value(0)).current;
  const middleLineOpacity = useRef(new Animated.Value(1)).current;
  const bottomLineRotate = useRef(new Animated.Value(0)).current;
  const bottomLineTranslate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (menuVisible) {
      // Transform to X
      Animated.parallel([
        Animated.timing(topLineRotate, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(topLineTranslate, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(middleLineOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(bottomLineRotate, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(bottomLineTranslate, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Transform back to hamburger
      Animated.parallel([
        Animated.timing(topLineRotate, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(topLineTranslate, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(middleLineOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(bottomLineRotate, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(bottomLineTranslate, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [menuVisible]);

  const topLineRotateInterpolate = topLineRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const topLineTranslateInterpolate = topLineTranslate.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 9],
  });

  const bottomLineRotateInterpolate = bottomLineRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-45deg'],
  });

  const bottomLineTranslateInterpolate = bottomLineTranslate.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -9],
  });

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        {/* Left spacer to balance the hamburger menu */}
        <View style={styles.spacer} />

        {/* Center Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/DomesLogo.png')} 
            style={{ width: 100, height: 40 }}
            resizeMode="contain"
          />
        </View>

        {/* Right Hamburger/X Menu Button */}
        <TouchableOpacity 
          style={styles.hamburgerButton} 
          onPress={onMenuToggle}
        >
          {/* Top Line */}
          <Animated.View 
            style={[
              styles.hamburgerLine,
              {
                transform: [
                  { translateY: topLineTranslateInterpolate },
                  { rotate: topLineRotateInterpolate },
                ],
              },
            ]}
          />
          
          {/* Middle Line */}
          <Animated.View 
            style={[
              styles.hamburgerLine,
              { opacity: middleLineOpacity },
            ]}
          />
          
          {/* Bottom Line */}
          <Animated.View 
            style={[
              styles.hamburgerLine,
              {
                transform: [
                  { translateY: bottomLineTranslateInterpolate },
                  { rotate: bottomLineRotateInterpolate },
                ],
              },
            ]}
          />
        </TouchableOpacity>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#68A4D2',
    paddingTop: Platform.OS === 'android' ? 35 : 0,
  },
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#68A4D2',
  },
  spacer: {
    width: 40,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  hamburgerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  hamburgerLine: {
    width: 25,
    height: 3,
    backgroundColor: '#FFFFFF',
    marginVertical: 3,
    borderRadius: 2,
  },
});