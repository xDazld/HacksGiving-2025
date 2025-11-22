import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [age, setAge] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    return status === 'granted';
  };

  const handleScanBarcode = async () => {
    const granted = await requestCameraPermission();
    if (granted) {
      setScanning(true);
    } else {
      Alert.alert(
        'Permission Denied',
        'Camera permission is required to scan barcodes.'
      );
    }
  };

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanning(false);
    
    // Simple validation - in a real app, this would verify against a backend
    if (data && data.length > 0) {
      Alert.alert(
        'Barcode Scanned',
        `Barcode validated successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (age && parseInt(age) > 0) {
                onLogin();
              } else {
                Alert.alert('Error', 'Please enter your age before continuing.');
              }
            },
          },
        ]
      );
    } else {
      Alert.alert('Error', 'Invalid barcode. Please try again.');
    }
  };

  if (scanning) {
    return (
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39'],
          }}
          onBarcodeScanned={handleBarcodeScanned}
        >
          <View style={styles.scannerOverlay}>
            <Text style={styles.scannerText}>Position barcode within frame</Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setScanning(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Thunderdomes</Text>
        <Text style={styles.subtitle}>Milwaukee Domes Experience</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your age"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            maxLength={3}
          />
        </View>

        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScanBarcode}
        >
          <Text style={styles.scanButtonText}>📷 Scan Barcode to Validate</Text>
        </TouchableOpacity>

        <Text style={styles.instructionText}>
          Please enter your age and scan your ticket barcode to access the tours.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  scanButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: 20,
  },
  scannerText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 8,
    marginTop: 50,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 50,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
