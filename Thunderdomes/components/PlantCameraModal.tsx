import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';

interface PlantCameraModalProps {
  onPhotoTaken: (base64Image: string) => void;
  onClose: () => void;
}

export function PlantCameraModal({ onPhotoTaken, onClose }: PlantCameraModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
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
    if (isCapturing || !cameraRef.current) return;

    setIsCapturing(true);
    try {
      // Try to use CameraView's takePictureAsync method directly
      // Note: CameraView in expo-camera v17 is primarily for barcode scanning
      // and may not support takePictureAsync. If it doesn't, we'll fall back to ImagePicker
      const camera = cameraRef.current as any;
      
      if (camera && typeof camera.takePictureAsync === 'function') {
        try {
          const photo = await camera.takePictureAsync({
            quality: 0.5,
            base64: true,
            skipProcessing: false,
          });

          if (photo?.base64) {
            onPhotoTaken(photo.base64);
            onClose();
            return;
          }
        } catch (takePictureError) {
          console.log('CameraView takePictureAsync not available, using ImagePicker fallback');
        }
      }
      
      // Fallback: Use ImagePicker (this will open native camera UI)
      // Unfortunately, expo-camera v17's CameraView doesn't support taking pictures directly
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
        Point your camera at the plant that you have found! Are you an investigative genius?
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
        <View style={styles.scanButtonContent}>
          <ThemedText style={styles.scanButtonText}>
            {isCapturing ? 'Taking Picture...' : 'Scan'}
          </ThemedText>
          {!isCapturing && <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" style={styles.cameraIconStyle} />}
        </View>
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
  scanButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonText: {
    color: '#F5F1E3',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cameraIconStyle: {
    marginLeft: 8,
  },
});

