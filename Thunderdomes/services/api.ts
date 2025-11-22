import { Tour, ScavengerHunt, CafeTour, ProgressData, BeaconAPIFormat } from '@/types';

const API_BASE_URL = 'https://api.example.com'; // TODO: Replace with actual API base URL

/**
 * Fetches available audio tours from the API
 * TODO: Implement actual API call
 */
export async function fetchTours(): Promise<Tour[]> {
  // TODO: Replace with actual API call
  // Example: const response = await fetch(`${API_BASE_URL}/tours`);
  // return await response.json();
  
  // Mock data for development
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

/**
 * Fetches available scavenger hunts from the API
 * TODO: Implement actual API call
 */
export async function fetchScavengerHunts(): Promise<ScavengerHunt[]> {
  // TODO: Replace with actual API call
  // Example: const response = await fetch(`${API_BASE_URL}/scavenger-hunts`);
  // return await response.json();
  
  // Mock data for development
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

/**
 * Fetches available cafe tours from the API
 * TODO: Implement actual API call
 */
export async function fetchCafeTours(): Promise<CafeTour[]> {
  // TODO: Replace with actual API call
  // Example: const response = await fetch(`${API_BASE_URL}/cafe-tours`);
  // return await response.json();
  
  // Mock data for development
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
 * TODO: Implement actual API call
 */
export async function validateBarcode(barcode: string): Promise<boolean> {
  // TODO: Replace with actual API call
  // Example: const response = await fetch(`${API_BASE_URL}/validate-ticket`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ barcode }),
  // });
  // const data = await response.json();
  // return data.valid === true;
  
  // Mock implementation - accepts any non-empty barcode for development
  return barcode.trim().length > 0;
}

