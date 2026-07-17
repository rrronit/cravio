import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { AuthSession } from './api';

const SESSION_KEY = 'cravio.auth.session';

export const loadStoredSession = async (): Promise<AuthSession | null> => {
  if (Platform.OS === 'web') return null;
  const value = await SecureStore.getItemAsync(SESSION_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as AuthSession;
  } catch {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return null;
  }
};

export const storeSession = async (session: AuthSession): Promise<void> => {
  if (Platform.OS !== 'web') await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
};

export const clearStoredSession = async (): Promise<void> => {
  if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(SESSION_KEY);
};
