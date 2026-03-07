import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

// Paleta de colores para cada modo
const lightColors = {
  background: '#f5f5f5',
  surface: '#ffffff',
  card: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  headerBg: '#ffffff',
  inputBg: '#f9f9f9',
  primary: '#1E90FF',
  success: '#4CAF50',
  warning: '#FF9800',
  danger: '#f44336',
  tabBarBg: '#ffffff',
  tabBarBorder: '#e0e0e0',
  tabBarActive: '#1E90FF',
  tabBarInactive: '#999999',
  statusBarStyle: 'dark-content' as const,
  shadow: '#000000',
};

const darkColors = {
  background: '#121212',
  surface: '#1E1E1E',
  card: '#1E1E1E',
  text: '#E0E0E0',
  textSecondary: '#AAAAAA',
  textTertiary: '#777777',
  border: '#333333',
  borderLight: '#2A2A2A',
  headerBg: '#1A1A1A',
  inputBg: '#2A2A2A',
  primary: '#4DA6FF',
  success: '#66BB6A',
  warning: '#FFB74D',
  danger: '#EF5350',
  tabBarBg: '#1A1A1A',
  tabBarBorder: '#333333',
  tabBarActive: '#4DA6FF',
  tabBarInactive: '#777777',
  statusBarStyle: 'light-content' as const,
  shadow: '#000000',
};

export type ThemeColors = {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderLight: string;
  headerBg: string;
  inputBg: string;
  primary: string;
  success: string;
  warning: string;
  danger: string;
  tabBarBg: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  statusBarStyle: 'dark-content' | 'light-content';
  shadow: string;
};

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@proseapp_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  // Cargar preferencia guardada
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved);
      }
      setIsReady(true);
    });
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
  }, []);

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  if (!isReady) return null;

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
};
