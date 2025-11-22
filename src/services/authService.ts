import { account } from './appwrite';
import { ID, Models } from 'react-native-appwrite';

export interface UserData {
  userId: string;
  email: string;
  name: string;
  age?: number;
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
  async updatePreferences(prefs: Record<string, any>): Promise<Models.User<Models.Preferences>> {
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
   * This is a placeholder - you would implement actual validation logic
   */
  async validateBarcode(barcodeData: string): Promise<boolean> {
    // In a real implementation, you would:
    // 1. Query your database for the barcode
    // 2. Check if it's valid and not already used
    // 3. Return true/false based on validation
    
    // For now, we'll just check if it's not empty
    return barcodeData.length > 0;
  }
}

export default new AuthService();
