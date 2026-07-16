/**
 * Thin string key-value wrapper. @react-native-async-storage/async-storage ships an
 * official web implementation backed by localStorage, so this one module works
 * unmodified on the phone and in the browser — no platform-split files needed.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const kvGet = (key: string): Promise<string | null> => AsyncStorage.getItem(key);
export const kvSet = (key: string, value: string): Promise<void> => AsyncStorage.setItem(key, value);
export const kvDelete = (key: string): Promise<void> => AsyncStorage.removeItem(key);

export async function kvKeysWithPrefix(prefix: string): Promise<string[]> {
  const all = await AsyncStorage.getAllKeys();
  return all.filter((k) => k.startsWith(prefix));
}
