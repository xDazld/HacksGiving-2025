import { Tour, ScavengerHunt, CafeTour, ProgressData, BeaconAPIFormat } from '@/types';
import { databases, appwriteConfig } from './appwriteClient';
import { Query } from 'react-native-appwrite';

const API_BASE_URL = 'https://api.example.com'; // TODO: Replace with actual API base URL

/**
 * Fetches available audio tours from Appwrite database
 */
export async function fetchTours(): Promise<Tour[]> {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.tours,
      [Query.limit(100)]
    );
    
    return response.documents.map((doc: any) => ({
      id: doc.$id,
      title: doc.title,
      description: doc.description,
      parts: doc.parts || [],
    }));
  } catch (error) {
    console.error('Error fetching tours:', error);
    // Return mock data as fallback
    return [
      {
        id: '1',
        title: 'Tropical Dome Tour',
        description: 'Explore the tropical plants and learn about their unique characteristics.',
        parts: [
          {
            id: 'part1',
            title: 'Introduction',
            content: 'Welcome to the Tropical Dome! This dome features plants from tropical regions around the world.',
            unlockProgress: 0,
          },
          {
            id: 'part2',
            title: 'Palm Trees',
            content: 'As you walk further, notice the variety of palm trees. Each species has adapted to its specific environment.',
            unlockProgress: 33,
          },
          {
            id: 'part3',
            title: 'Orchids and Epiphytes',
            content: 'Near the end of your journey, observe the beautiful orchids and epiphytic plants that grow on trees.',
            unlockProgress: 66,
          },
        ],
      },
    ];
  }
}

/**
 * Fetches available scavenger hunts from Appwrite database
 */
export async function fetchScavengerHunts(): Promise<ScavengerHunt[]> {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.scavengerHunts,
      [Query.limit(100)]
    );
    
    return response.documents.map((doc: any) => ({
      id: doc.$id,
      title: doc.title,
      description: doc.description,
      items: doc.items || [],
    }));
  } catch (error) {
    console.error('Error fetching scavenger hunts:', error);
    // Return mock data as fallback
    return [
      {
        id: '1',
        title: 'Plant Finder Challenge',
        description: 'Find these plants throughout the domes!',
        items: [
          {
            id: '1',
            name: 'Monstera Deliciosa',
            description: 'Find the plant with large, split leaves',
            completed: false,
          },
          {
            id: '2',
            name: 'Bird of Paradise',
            description: 'Look for the plant with orange and blue flowers',
            completed: false,
          },
          {
            id: '3',
            name: 'Fiddle Leaf Fig',
            description: 'Find the plant with large, violin-shaped leaves',
            completed: false,
          },
        ],
      },
    ];
  }
}

/**
 * Fetches available cafe tours from Appwrite database
 */
export async function fetchCafeTours(): Promise<CafeTour[]> {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.cafeTours,
      [Query.limit(100)]
    );
    
    return response.documents.map((doc: any) => ({
      id: doc.$id,
      title: doc.title,
      description: doc.description,
      parts: doc.parts || [],
    }));
  } catch (error) {
    console.error('Error fetching cafe tours:', error);
    // Return mock data as fallback
    return [
      {
        id: '1',
        title: 'Cafe and Garden Tour',
        description: 'Learn about the plants used in our cafe and garden.',
        parts: [
          {
            id: 'part1',
            title: 'Herb Garden',
            content: 'Our cafe uses fresh herbs grown right here in the domes. Let\'s start by exploring the herb garden.',
            unlockProgress: 0,
          },
          {
            id: 'part2',
            title: 'Edible Plants',
            content: 'Many of the plants you see are not just beautiful, but also edible. Learn about which plants are used in our menu.',
            unlockProgress: 33,
          },
          {
            id: 'part3',
            title: 'Sustainable Practices',
            content: 'Discover how we maintain sustainable growing practices that benefit both the environment and our cafe.',
            unlockProgress: 66,
          },
        ],
      },
    ];
  }
}

/**
 * Calculates user progress through the dome based on BLE beacon data
 * @param beaconData Format: [[ids], [rssi]] where ids are LocationContext IDs and rssi are signal strengths
 * @returns Progress percentage (0-100)
 * TODO: Implement actual API call
 */
export async function calculateProgress(beaconData: BeaconAPIFormat): Promise<ProgressData> {
  // TODO: Replace with actual API call
  // Example: const response = await fetch(`${API_BASE_URL}/progress`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ ids: beaconData.ids, rssi: beaconData.rssi }),
  // });
  // return await response.json();
  
  // Mock implementation - returns random progress for development
  // In production, this should call the actual API with the beacon data
  const mockProgress = Math.floor(Math.random() * 100);
  return { progress: mockProgress };
}

/**
 * Validates a ticket barcode
 * @param barcode The scanned barcode string
 * @returns true if valid, false otherwise
 * 
 * NOTE: For demo purposes, all non-empty barcodes are treated as valid.
 * In production, this should validate against the Appwrite tickets collection.
 */
export async function validateBarcode(barcode: string): Promise<boolean> {
  // Demo mode: Accept any non-empty barcode
  const isValid = barcode.trim().length > 0;
  
  if (isValid) {
    console.log('[Demo Mode] Barcode accepted:', barcode);
  }
  
  return isValid;
  
  /* Production implementation (currently disabled for demo):
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.tickets,
      [Query.equal('barcode', barcode), Query.limit(1)]
    );
    
    if (response.total === 0) {
      return false;
    }
    
    const ticket = response.documents[0];
    
    // Check if ticket is not expired
    if (ticket.expiry_date) {
      const expiry = new Date(ticket.expiry_date);
      if (expiry < new Date()) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error validating barcode:', error);
    return false;
  }
  */
}

