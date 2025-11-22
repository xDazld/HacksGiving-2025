import { Client, Account, Databases } from 'react-native-appwrite';

// Appwrite configuration
// These should be replaced with your actual Appwrite project values
export const APPWRITE_CONFIG = {
  endpoint: 'https://cloud.appwrite.io/v1', // Your Appwrite endpoint
  projectId: 'YOUR_PROJECT_ID', // Your project ID
  databaseId: 'YOUR_DATABASE_ID', // Your database ID (optional)
  userCollectionId: 'YOUR_USER_COLLECTION_ID', // Your user collection ID (optional)
};

// Initialize Appwrite client
const client = new Client();

client
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId);

// Initialize Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);

export default client;
