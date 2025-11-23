import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AudioSegment {
  id: number;
  text: string;
  startTime: number; // in seconds
  endTime: number;
}

// Audio tour content with timestamps
const audioSegments: AudioSegment[] = [
  {
    id: 1,
    text: "Welcome to the Madagascar Collection at the Mitchell Park Domes.",
    startTime: 0,
    endTime: 4,
  },
  {
    id: 2,
    text: "These remarkable plants come from the island of Madagascar,",
    startTime: 4,
    endTime: 8,
  },
  {
    id: 3,
    text: "a land of incredible biodiversity off the southeastern coast of Africa.",
    startTime: 8,
    endTime: 12,
  },
  {
    id: 4,
    text: "Look closely at these vibrant pink and purple blooms.",
    startTime: 12,
    endTime: 16,
  },
  {
    id: 5,
    text: "They thrive along the island's coasts.",
    startTime: 16,
    endTime: 19,
  },
  {
    id: 6,
    text: "As you look at them now, imagine the dry winds of Madagascar",
    startTime: 19,
    endTime: 23,
  },
  {
    id: 7,
    text: "crossing over coral-sand soils,",
    startTime: 23,
    endTime: 26,
  },
  {
    id: 8,
    text: "shaping a plant that learned to embrace",
    startTime: 26,
    endTime: 29,
  },
  {
    id: 9,
    text: "the harshness of its environment.",
    startTime: 29,
    endTime: 32,
  },
];

export default function MadagascarCollectionScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSegmentId, setCurrentSegmentId] = useState<number | null>(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Find current segment based on time
    const activeSegment = audioSegments.find(
      (segment) => currentTime >= segment.startTime && currentTime < segment.endTime
    );
    if (activeSegment) {
      setCurrentSegmentId(activeSegment.id);
    }
  }, [currentTime]);

  useEffect(() => {
    if (isPlaying) {
      // Simulate audio playback with a timer
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = prev + 0.1;
          // Loop back to start when finished
          if (newTime >= 32) {
            return 0;
          }
          return newTime;
        });
      }, 100) as unknown as NodeJS.Timeout;
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying]);

  const handleBack = () => {
    setIsPlaying(false);
    router.back();
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <View style={styles.container}>
      {/* Custom Header with Back Button */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ThemedText style={styles.backArrow}>←</ThemedText>
          </TouchableOpacity>

          {/* Center Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('@/assets/images/DomesLogo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Right Settings Button */}
          <TouchableOpacity 
            style={styles.settingsButton} 
            onPress={() => router.push('/settings')}
          >
            <Image 
              source={require('@/assets/images/Settings.png')} 
              style={styles.settingsIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <ThemedView style={styles.content}>
          {/* Title */}
          <ThemedText style={styles.title}>Madagascar Collection</ThemedText>

          {/* Tour Image */}
          <View style={styles.imageContainer}>
            <Image
              source={require('@/assets/images/madagascarcollection.png')}
              style={styles.tourImage}
              resizeMode="cover"
            />
          </View>

          {/* Audio Transcript with 3-Line View and Fade Effects */}
          <View style={styles.transcriptWrapper}>
            {/* Top Fade Effect */}
            <LinearGradient
              colors={['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0)']}
              style={styles.topGradient}
              pointerEvents="none"
            />
            
            <View style={styles.transcriptContainer}>
              {/* Previous Line (if exists) */}
              {currentSegmentId > 1 && (
                <View style={styles.segmentContainer}>
                  <ThemedText style={[styles.segmentText, styles.blurredSegmentText]}>
                    {audioSegments.find(s => s.id === currentSegmentId - 1)?.text}
                  </ThemedText>
                </View>
              )}

              {/* Current Line */}
              {currentSegmentId && (
                <View style={styles.segmentContainer}>
                  <ThemedText style={[styles.segmentText, styles.activeSegmentText]}>
                    {audioSegments.find(s => s.id === currentSegmentId)?.text}
                  </ThemedText>
                </View>
              )}

              {/* Next Line (if exists) */}
              {currentSegmentId < audioSegments.length && (
                <View style={styles.segmentContainer}>
                  <ThemedText style={[styles.segmentText, styles.blurredSegmentText]}>
                    {audioSegments.find(s => s.id === currentSegmentId + 1)?.text}
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Bottom Fade Effect */}
            <LinearGradient
              colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 1)']}
              style={styles.bottomGradient}
              pointerEvents="none"
            />
          </View>
        </ThemedView>
      </ScrollView>

      {/* Fixed Play/Pause Button */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity 
          style={styles.playButton}
          onPress={handlePlayPause}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.playIcon}>
            {isPlaying ? '⏸' : '▶'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSafeArea: {
    backgroundColor: '#68A4D2',
    paddingTop: Platform.OS === 'android' ? 35 : 0,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#68A4D2',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 40,
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  settingsIcon: {
    width: 100,
    height: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 120,
  },
  content: {
    padding: 20,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tourImage: {
    width: '100%',
    height: '100%',
  },
  transcriptWrapper: {
    position: 'relative',
    height: SCREEN_HEIGHT * 0.35,
    marginBottom: 20,
  },
  transcriptContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 1,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 1,
  },
  segmentContainer: {
    marginVertical: 8,
    paddingVertical: 4,
  },
  segmentText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  activeSegmentText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    lineHeight: 28,
  },
  blurredSegmentText: {
    fontSize: 14,
    color: '#999',
    opacity: 0.4,
    lineHeight: 20,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#68A4D2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    pointerEvents: 'auto',
  },
  playIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 70,
  },
});

