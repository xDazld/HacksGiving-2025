import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';

interface BarcodeScannerModalProps {
  onBarcodeScanned: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScannerModal({ onBarcodeScanned, onClose }: BarcodeScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);

  React.useEffect(() => {
    const checkPermission = async () => {
      if (!permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) {
          Alert.alert('Permission Required', 'Camera permission is required to scan barcodes.');
          onClose();
        }
      }
    };
    checkPermission();
  }, []);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (hasScanned) return; // Prevent multiple scans
    
    setHasScanned(true);
    onBarcodeScanned(data);
  };

  if (!permission?.granted) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Requesting camera permission...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
        }}
        onBarcodeScanned={hasScanned ? undefined : handleBarcodeScanned}>
        <View style={styles.cameraOverlay}>
          <ThemedView style={styles.cameraHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <ThemedText style={styles.closeButtonText}>Close</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          <View style={styles.scanArea}>
            <View style={styles.scanFrame} />
          </View>
          <ThemedText style={styles.scanInstructions}>
            Position the barcode within the frame
          </ThemedText>
        </View>
      </CameraView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  cameraHeader: {
    padding: 20,
    paddingTop: 60,
  },
  closeButton: {
    alignSelf: 'flex-start',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#0a7ea4',
    borderRadius: 8,
  },
  scanInstructions: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    marginBottom: 100,
    paddingHorizontal: 20,
  },
});

