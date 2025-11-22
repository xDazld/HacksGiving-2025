import { account } from './appwrite';
import { ID, Models } from 'react-native-appwrite';

export interface UserData {
  userId: string;
  email: string;
  name: string;
  age?: number;
}

export interface UserPreferences {
  age?: number;
  barcodeData?: string;
  scanTimestamp?: string;
  [key: string]: any; // Allow additional custom fields
}

/**
 * Authentication service using Appwrite
 */
class AuthService {
  /**
   * Create a new user account with email and password
   */
  async createAccount(
    email: string,
    password: string,
    name: string
  ): Promise<Models.User<Models.Preferences>> {
    try {
      const user = await account.create(ID.unique(), email, password, name);
      return user;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<Models.Session> {
    try {
      const session = await account.createEmailPasswordSession(email, password);
      return session;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  /**
   * Login anonymously (for barcode/ticket validation)
   * This can be used for guest access
   */
  async loginAnonymous(): Promise<Models.Session> {
    try {
      const session = await account.createAnonymousSession();
      return session;
    } catch (error) {
      console.error('Error creating anonymous session:', error);
      throw error;
    }
  }

  /**
   * Get current logged-in user
   */
  async getCurrentUser(): Promise<Models.User<Models.Preferences> | null> {
    try {
      const user = await account.get();
      return user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await account.deleteSession('current');
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  /**
   * Update user preferences (e.g., age, barcode validation)
   */
  async updatePreferences(prefs: UserPreferences): Promise<Models.User<Models.Preferences>> {
    try {
      const user = await account.updatePrefs(prefs);
      return user;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  /**
   * Validate a barcode/ticket against stored data
   * 
   * IMPORTANT: This is a placeholder implementation for demonstration.
   * In production, you should:
   * 1. Query your Appwrite database for the barcode
   * 2. Check if it's valid, not expired, and not already used
   * 3. Verify against a secure backend API
   * 4. Consider rate limiting to prevent brute force attacks
   * 
   * Example production implementation:
   * ```typescript
   * const response = await databases.listDocuments(
   *   APPWRITE_CONFIG.databaseId!,
   *   'tickets',
   *   [Query.equal('barcode', barcodeData), Query.equal('used', false)]
   * );
   * return response.documents.length > 0;
   * ```
   */
  async validateBarcode(barcodeData: string): Promise<boolean> {
    // Basic validation: check if barcode is not empty
    // TODO: Implement actual validation against your ticket database
    return barcodeData.length > 0;
  }
}

export default new AuthService();
