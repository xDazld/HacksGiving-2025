import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  Platform,
  Modal,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

interface Beverage {
  id: string;
  name: string;
  image: any;
  description: string;
}

// Featured beverages with plant-themed names
const featuredBeverages: Beverage[] = [
  {
    id: '1',
    name: 'Prickly Pear Cooler',
    image: require('@/assets/images/prickly_pear.jpg'),
    description: 'Vibrant magenta drink made from desert cactus fruit',
  },
  {
    id: '2',
    name: 'Hibiscus Paradise',
    image: require('@/assets/images/hibiscus-fruit-tea.jpg'),
    description: 'Deep red tropical flower tea with a tangy twist',
  },
  {
    id: '3',
    name: 'Lavender Serenity',
    image: require('@/assets/images/honey-lavender.jpg'),
    description: 'Soothing purple floral latte with honey notes',
  },
  {
    id: '4',
    name: 'Vanilla Bean Milkshake',
    image: require('@/assets/images/vanilla-bean-frappuccino.jpg'),
    description: 'Creamy shake with Madagascar vanilla beans',
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

  const renderCameraModal = () => (
    <Modal
      visible={showCamera}
      animationType="slide"
      onRequestClose={() => setShowCamera(false)}
    >
      <View style={styles.fullScreenContainer}>
        {/* Header with Back Button */}
        <SafeAreaView style={styles.cameraHeaderSafeArea}>
          <View style={styles.cameraHeader}>
            {/* Back Button */}
            <TouchableOpacity 
              style={styles.cameraBackButton} 
              onPress={() => setShowCamera(false)}
            >
              <ThemedText style={styles.cameraBackArrow}>←</ThemedText>
            </TouchableOpacity>

            {/* Center Logo */}
            <View style={styles.cameraLogoContainer}>
              <Image 
                source={require('@/assets/images/DomesLogo.png')} 
                style={styles.cameraLogo}
                resizeMode="contain"
              />
            </View>

            {/* Right Settings Button */}
            <TouchableOpacity 
              style={styles.cameraSettingsButton} 
              onPress={() => router.push('/settings')}
            >
              <Image 
                source={require('@/assets/images/Settings.png')} 
                style={styles.cameraSettingsIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={handleBarcodeScanned}
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.scanFrame} />
            <ThemedText style={styles.scanInstruction}>
              Point camera at barcode to scan
            </ThemedText>
          </View>
        </CameraView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {renderCameraModal()}
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
                  <ThemedText style={styles.beverageDescription} numberOfLines={2}>
                    {beverage.description}
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
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 30,
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
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  beverageImage: {
    width: '100%',
    height: 120,
  },
  beverageInfo: {
    padding: 8,
    backgroundColor: '#FFF',
    minHeight: 70,
  },
  beverageName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    color: '#333',
    marginBottom: 4,
  },
  beverageDescription: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
    lineHeight: 14,
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
  cameraHeaderSafeArea: {
    backgroundColor: '#68A4D2',
    paddingTop: Platform.OS === 'android' ? 35 : 0,
  },
  cameraHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#68A4D2',
  },
  cameraBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBackArrow: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cameraLogoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraLogo: {
    width: 100,
    height: 40,
  },
  cameraSettingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  cameraSettingsIcon: {
    width: 100,
    height: 40,
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

