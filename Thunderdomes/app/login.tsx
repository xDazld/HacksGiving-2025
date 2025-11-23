import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  View,
  Keyboard,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const [age, setAge] = useState('');
  const [barcode, setBarcode] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [useManualBarcode, setUseManualBarcode] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const ageInputRef = useRef<TextInput>(null);
  const barcodeInputRef = useRef<TextInput>(null);
  const { login } = useAuth();

  const handleScanBarcode = async () => {
    // Check if we have permission
    if (!permission?.granted) {
      // Request permission
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to scan barcodes.',
        );
        return;
      }
    }

    // At this point, we have permission
    setShowCamera(true);
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    setShowCamera(false);
    setBarcode(data);
  };

  const handleAgeSubmit = () => {
    ageInputRef.current?.blur();
    Keyboard.dismiss();
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    const ageNum = parseInt(age, 10);

    if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      Alert.alert('Invalid Age', 'Please enter a valid age between 1 and 120.');
      return;
    }

    // Use a default barcode if none provided (for testing without camera)
    const barcodeToUse = barcode.trim() || 'TEST_BARCODE_' + Date.now();

    setIsLoading(true);
    try {
      const success = await login(ageNum, barcodeToUse);
      if (success) {
        router.replace('/(tabs)/botanical-tales');
      } else {
        Alert.alert('Login Failed', 'Invalid barcode. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showCamera) {
    return (
      <ThemedView style={styles.container}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{
            barcodeTypes: [
              'qr',
              'ean13',
              'ean8',
              'upc_a',
              'upc_e',
              'code128',
              'code39',
            ],
          }}
          onBarcodeScanned={handleBarcodeScanned}
        >
          <View style={styles.cameraOverlay}>
            <ThemedView style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCamera(false)}
              >
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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.content}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/DomesLogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <ThemedText type="title" style={styles.title}>
            Welcome to Mitchell Park Domes
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Enter your age and ticket barcode to get started
          </ThemedText>

          <View style={styles.form}>
            <ThemedText style={styles.label}>Age</ThemedText>
            <View style={styles.inputContainer}>
              <TextInput
                ref={ageInputRef}
                style={styles.input}
                placeholder="Enter your age"
                placeholderTextColor="#999"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={handleAgeSubmit}
              />
              <TouchableOpacity
                style={styles.doneButton}
                onPress={handleAgeSubmit}
                disabled={isLoading}
              >
                <ThemedText style={styles.doneButtonText}>Done</ThemedText>
              </TouchableOpacity>
            </View>

            <ThemedText style={styles.label}>
              Ticket Barcode (Optional)
            </ThemedText>
            {useManualBarcode ? (
              <View style={styles.inputContainer}>
                <TextInput
                  ref={barcodeInputRef}
                  style={styles.input}
                  placeholder="Enter barcode manually"
                  placeholderTextColor="#999"
                  value={barcode}
                  onChangeText={setBarcode}
                  editable={!isLoading}
                  returnKeyType="done"
                  onSubmitEditing={() => barcodeInputRef.current?.blur()}
                />
                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={() => {
                    setUseManualBarcode(false);
                    setBarcode('');
                  }}
                  disabled={isLoading}
                >
                  <ThemedText style={styles.switchButtonText}>Scan</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <TouchableOpacity
                  style={[
                    styles.barcodeButton,
                    barcode && styles.barcodeButtonScanned,
                  ]}
                  onPress={handleScanBarcode}
                  disabled={isLoading}
                >
                  <ThemedText style={styles.barcodeButtonText}>
                    {barcode ? `Barcode: ${barcode}` : 'Scan Barcode'}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.manualEntryButton}
                  onPress={() => setUseManualBarcode(true)}
                  disabled={isLoading}
                >
                  <ThemedText style={styles.manualEntryText}>
                    Or enter manually
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#F5F1E3" />
              ) : (
                <ThemedText style={styles.loginButtonText}>Login</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F1E3',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F5F1E3',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 200,
    height: 120,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#2C2416',
    fontSize: 28,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
    fontSize: 16,
    color: '#5A6A5D',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: '#2C2416',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#5A6A5D',
    color: '#2C2416',
  },
  doneButton: {
    backgroundColor: '#5A6A5D',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'center',
  },
  doneButtonText: {
    color: '#F5F1E3',
    fontSize: 16,
    fontWeight: '600',
  },
  manualEntryButton: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  manualEntryText: {
    color: '#5A6A5D',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  switchButton: {
    backgroundColor: '#5A6A5D',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'center',
  },
  switchButtonText: {
    color: '#F5F1E3',
    fontSize: 16,
    fontWeight: '600',
  },
  barcodeButton: {
    backgroundColor: '#5A6A5D',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  barcodeButtonScanned: {
    backgroundColor: '#4caf50',
  },
  barcodeButtonText: {
    color: '#F5F1E3',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#2C2416',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#F5F1E3',
    fontSize: 20,
    fontWeight: 'bold',
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
    backgroundColor: 'transparent',
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
    borderColor: '#5A6A5D',
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
