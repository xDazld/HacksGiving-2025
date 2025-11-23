import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

// Create i18n instance
const i18n = new I18n({
  en,
  es,
});

// Set default language
i18n.locale = 'en';
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

interface LocalizationContextType {
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  t: (key: string, options?: any) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

const STORAGE_KEY = '@language_preference';

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState('en');

  // Load saved language preference on mount
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedLanguage) {
        i18n.locale = savedLanguage;
        setLocaleState(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
    }
  };

  const setLocale = async (newLocale: string) => {
    try {
      // Update i18n locale
      i18n.locale = newLocale;
      
      // Update state (this will trigger re-render)
      setLocaleState(newLocale);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEY, newLocale);
      
      console.log('Language changed to:', newLocale);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // Make t function depend on locale so components re-render when locale changes
  const t = useCallback((key: string, options?: any) => {
    return i18n.t(key, options);
  }, [locale]); // Re-create function when locale changes

  return (
    <LocalizationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
}

