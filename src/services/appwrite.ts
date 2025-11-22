import { Account, Client, Databases } from 'react-native-appwrite';

// Appwrite configuration
// IMPORTANT: For production, use environment variables instead of hardcoded values
// Example: process.env.APPWRITE_PROJECT_ID
// See .env.example for configuration template
export const APPWRITE_CONFIG = {
  endpoint: 'https://nyc.cloud.appwrite.io/v1', // Your Appwrite endpoint
  projectId: '69211c3d0030edb86edf', // Replace with your project ID from Appwrite dashboard
  databaseId: 'YOUR_DATABASE_ID', // Your database ID (optional, for future features)
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
