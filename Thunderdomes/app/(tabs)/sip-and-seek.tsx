import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

interface Beverage {
  id: string;
  name: string;
  image: any;
  plant: string;
}

// Featured beverages with plant-themed names
const featuredBeverages: Beverage[] = [
  {
    id: '1',
    name: 'Desert Bloom Latte',
    image: require('@/assets/images/desertblooms.png'),
    plant: 'Cactus Flower',
  },
  {
    id: '2',
    name: 'Tropical Paradise',
    image: require('@/assets/images/tropicalDome.png'),
    plant: 'Hibiscus',
  },
  {
    id: '3',
    name: 'Madagascar Mocha',
    image: require('@/assets/images/madagascarcollection.png'),
    plant: 'Vanilla Orchid',
  },
  {
    id: '4',
    name: 'Canary Island Brew',
    image: require('@/assets/images/canaryislandcollection.png'),
    plant: 'Dragon Tree',
  },
];

export default function SipAndSeekScreen() {
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const handleScanPress = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera Permission', 'Camera access is required to scan barcodes.');
        return;
      }
    }
    setShowCamera(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setShowCamera(false);
    Alert.alert('Barcode Scanned!', `Code: ${data}`, [
      {
        text: 'OK',
        onPress: () => {
          // TODO: Process barcode and unlock drink adventure
          console.log('Processing barcode:', data);
        },
      },
    ]);
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={handleBarcodeScanned}
        >
          <View style={styles.cameraOverlay}>
            <TouchableOpacity
              style={styles.closeCameraButton}
              onPress={() => setShowCamera(false)}
            >
              <ThemedText style={styles.closeCameraText}>✕ Close</ThemedText>
            </TouchableOpacity>
            <View style={styles.scanFrame} />
            <ThemedText style={styles.scanInstruction}>
              Point camera at barcode to scan
            </ThemedText>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.content}>
          {/* Title */}
          <ThemedText style={styles.title}>Sip & Seek</ThemedText>

          {/* Description */}
          <ThemedText style={styles.description}>
            Purchase food or a beverage from our café to unlock a custom drink adventure.
            Scan the barcode to begin your tour!
          </ThemedText>

          {/* Featured Beverages Section */}
          <ThemedText style={styles.sectionTitle}>Featured Beverages</ThemedText>

          {/* Beverage Grid */}
          <View style={styles.beverageGrid}>
            {featuredBeverages.map((beverage) => (
              <View key={beverage.id} style={styles.beverageCard}>
                <Image
                  source={beverage.image}
                  style={styles.beverageImage}
                  resizeMode="cover"
                />
                <View style={styles.beverageInfo}>
                  <ThemedText style={styles.beverageName} numberOfLines={2}>
                    {beverage.name}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </ThemedView>
      </ScrollView>

      {/* Floating Scan Button */}
      <View style={styles.floatingScanContainer}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScanPress}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.scanButtonText}>Scan</ThemedText>
          <ThemedText style={styles.cameraIcon}>📷</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  beverageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  beverageCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  beverageImage: {
    width: '100%',
    height: 150,
  },
  beverageInfo: {
    padding: 10,
    backgroundColor: '#F5DEB3',
    minHeight: 60,
  },
  beverageName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  floatingScanContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  scanButton: {
    backgroundColor: '#458E5E',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    pointerEvents: 'auto',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginRight: 8,
    lineHeight: 24,
  },
  cameraIcon: {
    fontSize: 24,
    lineHeight: 24,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeCameraButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  closeCameraText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 12,
  },
  scanInstruction: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 30,
    textAlign: 'center',
  },
});

