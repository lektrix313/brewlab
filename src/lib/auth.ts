import * as SecureStore from 'expo-secure-store';

/**
 * Token cache for Clerk using Expo SecureStore.
 * This persists session tokens across app restarts.
 */
export const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch {
      return;
    }
  },
};
