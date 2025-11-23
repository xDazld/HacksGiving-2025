import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { VoiceChatService } from '@/services/voiceChat';

const PRIMARY_COLOR = '#458E5E';

export default function VoiceChatScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  // Setup Audio Mode - Force speaker output
  useEffect(() => {
    async function setupAudio() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.error("Failed to setup audio mode", e);
      }
    }
    setupAudio();
  }, []);

  // Animation Logic
  useEffect(() => {
    if (animationRef.current) {
      animationRef.current.stop();
    }

    if (isPlaying) {
      pulseAnim.setValue(1);
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 300, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true })
        ])
      );
      animationRef.current.start();
    } else if (isRecording) {
      pulseAnim.setValue(1);
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true })
        ])
      );
      animationRef.current.start();
    } else if (isProcessing) {
        pulseAnim.setValue(1);
        animationRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.05, duration: 200, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true })
          ])
        );
        animationRef.current.start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPlaying, isRecording, isProcessing]);

  const startRecording = async () => {
    try {
      // Interrupt playback if playing
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      }

      if (permissionResponse?.status !== 'granted') {
        console.log('Requesting permission..');
        await requestPermission();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    console.log('Stopping recording..');
    if (!recording) return;

    setIsRecording(false);
    setIsProcessing(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        console.log('Recording stored at', uri);
        await processAudio(uri);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsProcessing(false);
    }
  };

  const processAudio = async (audioUri: string) => {
    try {
      console.log('Processing audio...');
      const response = await VoiceChatService.chatWithAudio(audioUri);

      // Clean up recording file after processing
      try {
        await FileSystem.deleteAsync(audioUri, { idempotent: true });
        console.log('Cleaned up recording file');
      } catch (cleanupError) {
        console.log('Could not clean up recording:', cleanupError);
      }

      if (response.audioData) {
        console.log('Received audio response, playing...');
        await playResponse(response.audioData);
      } else {
        console.log('No audio response received');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      setIsProcessing(false);
      
      // Clean up recording even on error
      try {
        await FileSystem.deleteAsync(audioUri, { idempotent: true });
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
  };

  const playResponse = async (base64Audio: string) => {
    try {
      setIsProcessing(false);
      
      const docDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const filename = `${docDir}response_${Date.now()}.mp3`; 
      
      await FileSystem.writeAsStringAsync(filename, base64Audio, {
        encoding: 'base64',
      });

      // Set audio mode to speaker before playing
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: filename },
        { shouldPlay: true, volume: 1.0 }
      );
      
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          
          // Clean up response audio file after playing
          try {
            await FileSystem.deleteAsync(filename, { idempotent: true });
            console.log('Cleaned up response file');
          } catch (cleanupError) {
            console.log('Could not clean up response:', cleanupError);
          }
        }
      });

    } catch (error) {
      console.error('Error playing response:', error);
      setIsPlaying(false);
    }
  };

  const stopPlayback = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
        
        // Clean up any leftover response files
        const docDir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
        if (docDir) {
          const files = await FileSystem.readDirectoryAsync(docDir);
          for (const file of files) {
            if (file.startsWith('response_') && file.endsWith('.mp3')) {
              try {
                await FileSystem.deleteAsync(`${docDir}${file}`, { idempotent: true });
              } catch (e) {
                // Ignore individual file cleanup errors
              }
            }
          }
        }
      } catch (error) {
        console.log('Error stopping playback:', error);
      }
    }
  };

  const handleMicPress = async () => {
    if (isPlaying) {
      // Interruption: Stop playing and start recording immediately
      await startRecording();
    } else if (isRecording) {
      // Stop recording and process
      await stopRecording();
    } else {
      // Start recording
      await startRecording();
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.visualizer}>
          <TouchableOpacity 
            onPress={isPlaying ? stopPlayback : undefined}
            disabled={!isPlaying}
            activeOpacity={isPlaying ? 0.7 : 1}
          >
            <Animated.View style={[
                styles.activeIndicator, 
                { 
                    transform: [{ scale: pulseAnim }],
                    backgroundColor: isPlaying 
                      ? '#34c759' 
                      : (isRecording ? '#ff3b30' : (isProcessing ? '#ff9500' : 'rgba(69, 142, 94, 0.15)')),
                    borderColor: isPlaying 
                      ? '#34c759' 
                      : (isRecording ? '#ff3b30' : (isProcessing ? '#ff9500' : PRIMARY_COLOR)),
                }
            ]}>
                 <IconSymbol 
                    name={isPlaying ? "waveform" : (isRecording ? "mic.fill" : (isProcessing ? "sparkles" : "mic"))} 
                    size={isPlaying ? 100 : 80} 
                    color={isPlaying ? "white" : (isRecording ? "white" : (isProcessing ? "white" : PRIMARY_COLOR))}
                 />
            </Animated.View>
          </TouchableOpacity>
          
          <ThemedText type="subtitle" style={styles.status}>
            {isPlaying 
              ? "🔊 Speaking (Tap to Stop)" 
              : (isRecording ? "🔴 Listening..." : (isProcessing ? "✨ Thinking..." : "Tap to Chat"))}
          </ThemedText>
          
          {isProcessing && (
              <ActivityIndicator size="large" color={PRIMARY_COLOR} style={{ marginTop: 20 }} />
          )}
        </View>

        {/* Main Action Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              { 
                backgroundColor: isRecording ? '#ff3b30' : PRIMARY_COLOR,
                transform: [{ scale: isRecording ? 1.1 : 1 }]
              }
            ]} 
            onPress={handleMicPress}
            disabled={isProcessing}
          >
             <IconSymbol 
                name={isRecording ? "stop.fill" : "mic.fill"} 
                size={40} 
                color="white" 
             />
          </TouchableOpacity>
          <ThemedText style={styles.actionHint}>
            {isRecording ? "Tap to Send" : (isPlaying ? "Tap to Interrupt" : "Tap to Speak")}
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visualizer: {
    alignItems: 'center',
    gap: 20,
    marginTop: 40,
    flex: 1,
    justifyContent: 'center',
  },
  activeIndicator: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  status: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionContainer: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
  },
  actionButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  actionHint: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
});
