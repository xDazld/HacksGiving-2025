import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';
import { account } from '@/services/appwriteClient';
import { validateBarcode } from '@/services/api';
import { Models } from 'react-native-appwrite';

interface AuthContextType {
  user: User | null;
  appwriteAccount: Models.User<Models.Preferences> | null;
  login: (age: number, barcode: string) => Promise<boolean>;
  logout: () => Promise<void>;
  markTicketAsUsed: () => Promise<void>;
  scanNewTicket: (barcode: string) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = '@thunderdomes:user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appwriteAccount, setAppwriteAccount] = useState<Models.User<Models.Preferences> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      // First, try to get the current Appwrite session
      try {
        const currentAccount = await account.get();
        setAppwriteAccount(currentAccount);
        
        // Load user preferences from Appwrite
        const prefs = await account.getPrefs();
        if (prefs.age && prefs.barcode) {
          const localUser: User = {
            age: prefs.age as number,
            barcode: prefs.barcode as string,
            isAuthenticated: true,
            hasUsedTicket: (prefs.hasUsedTicket as boolean) || false,
          };
          setUser(localUser);
          // Also sync to AsyncStorage as backup
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localUser));
        }
      } catch (appwriteError) {
        // No active Appwrite session, try loading from AsyncStorage
        const storedUser = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (age: number, barcode: string): Promise<boolean> => {
    try {
      // Validate barcode with API
      const isValid = await validateBarcode(barcode);
      if (!isValid) {
        return false;
      }

      // Create an anonymous session in Appwrite
      try {
        await account.createAnonymousSession();
        const currentAccount = await account.get();
        setAppwriteAccount(currentAccount);
        
        // Store user preferences in Appwrite
        await account.updatePrefs({
          age,
          barcode,
          hasUsedTicket: false,
        });
      } catch (appwriteError) {
        console.error('Failed to create Appwrite session:', appwriteError);
        // Continue with local storage only if Appwrite fails
      }

      const newUser: User = {
        age,
        barcode,
        isAuthenticated: true,
        hasUsedTicket: false,
      };

      // Save to storage as backup
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Delete Appwrite session
      try {
        await account.deleteSessions();
      } catch (appwriteError) {
        console.error('Failed to delete Appwrite session:', appwriteError);
      }
      
      await AsyncStorage.removeItem(STORAGE_KEY);
      setUser(null);
      setAppwriteAccount(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const markTicketAsUsed = async () => {
    if (!user) return;

    try {
      const updatedUser: User = {
        ...user,
        hasUsedTicket: true,
      };
      
      // Update Appwrite preferences
      try {
        await account.updatePrefs({
          age: updatedUser.age,
          barcode: updatedUser.barcode,
          hasUsedTicket: true,
        });
      } catch (appwriteError) {
        console.error('Failed to update Appwrite preferences:', appwriteError);
      }
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to mark ticket as used:', error);
    }
  };

  const scanNewTicket = async (barcode: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Validate barcode with API
      const isValid = await validateBarcode(barcode);
      if (!isValid) {
        return false;
      }

      // Keep the same age, update barcode and reset ticket status
      const updatedUser: User = {
        ...user,
        barcode,
        hasUsedTicket: false,
      };

      // Update Appwrite preferences
      try {
        await account.updatePrefs({
          age: updatedUser.age,
          barcode: updatedUser.barcode,
          hasUsedTicket: false,
        });
      } catch (appwriteError) {
        console.error('Failed to update Appwrite preferences:', appwriteError);
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      return true;
    } catch (error) {
      console.error('Failed to scan new ticket:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        appwriteAccount,
        login,
        logout,
        markTicketAsUsed,
        scanNewTicket,
        isLoading,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

