import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';
import { validateBarcode } from '@/services/api';

interface AuthContextType {
  user: User | null;
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
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
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

      const newUser: User = {
        age,
        barcode,
        isAuthenticated: true,
        hasUsedTicket: false,
      };

      // Save to storage
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
      await AsyncStorage.removeItem(STORAGE_KEY);
      setUser(null);
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

