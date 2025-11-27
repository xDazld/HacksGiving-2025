import { Client, Account, Databases } from 'react-native-appwrite';
import Constants from 'expo-constants';

// Get configuration from environment variables
const APPWRITE_ENDPOINT = Constants.expoConfig?.extra?.appwriteEndpoint || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = Constants.expoConfig?.extra?.appwriteProjectId || '';
const APPWRITE_DATABASE_ID = Constants.expoConfig?.extra?.appwriteDatabaseId || 'milwaukee-domes';
const APPWRITE_PLANTS_COLLECTION_ID = Constants.expoConfig?.extra?.appwritePlantsCollectionId || 'plants';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);

// Export client for direct access if needed
export default client;

// Export configuration for use in other services
export const appwriteConfig = {
  endpoint: APPWRITE_ENDPOINT,
  projectId: APPWRITE_PROJECT_ID,
  databaseId: APPWRITE_DATABASE_ID,
  collections: {
    tours: 'tours',
    scavengerHunts: 'scavenger-hunts',
    cafeTours: 'cafe-tours',
    plants: APPWRITE_PLANTS_COLLECTION_ID,
    progress: 'progress',
    tickets: 'tickets',
  },
};
