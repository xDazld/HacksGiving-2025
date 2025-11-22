import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';

interface PlantCameraModalProps {
  onPhotoTaken: (base64Image: string) => void;
  onClose: () => void;
}

export function PlantCameraModal({ onPhotoTaken, onClose }: PlantCameraModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      if (!permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) {
          Alert.alert('Permission Required', 'Camera permission is required to take photos.');
          onClose();
        }
      }
    };
    checkPermission();
  }, [permission, requestPermission, onClose]);

  const handleTakePicture = async () => {
    if (isCapturing) return;

    setIsCapturing(true);
    try {
      // Try using ImagePicker to take the photo
      // Note: This will open the native camera UI, but it's the most reliable way
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        onPhotoTaken(result.assets[0].base64);
        onClose();
      } else {
        // User cancelled
        setIsCapturing(false);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
      setIsCapturing(false);
    }
  };

  if (!permission?.granted) {
    return (
      <ThemedView style={styles.container} lightColor="#F5F1E3" darkColor="#F5F1E3">
        <ThemedText lightColor="#2C2416" darkColor="#2C2416">
          Requesting camera permission...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container} lightColor="#F5F1E3" darkColor="#F5F1E3">
      <ThemedText 
        type="title" 
        style={styles.title}
        lightColor="#2C2416"
        darkColor="#2C2416"
      >
        Dome Detective
      </ThemedText>
      
      <ThemedText 
        style={styles.instructions}
        lightColor="#2C2416"
        darkColor="#2C2416"
      >
        Point your camera at the plant that you have found! Are you a investigative genius?
      </ThemedText>

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        />
      </View>

      <TouchableOpacity
        style={styles.scanButton}
        onPress={handleTakePicture}
        disabled={isCapturing}
      >
        <ThemedText style={styles.scanButtonText}>
          {isCapturing ? 'Taking Picture...' : 'Scan 📷'}
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: '#F5F1E3',
  },
  title: {
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2C2416',
  },
  instructions: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
    color: '#2C2416',
    paddingHorizontal: 10,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2C2416',
    marginBottom: 30,
  },
  camera: {
    flex: 1,
  },
  scanButton: {
    backgroundColor: '#5A6A5D',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  scanButtonText: {
    color: '#F5F1E3',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

