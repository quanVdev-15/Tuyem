// utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'MEMORY_MARKERS';

export const saveMarkers = async (markers) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
  } catch (e) {
    console.error('Saving markers failed:', e);
  }
};

export const loadMarkers = async () => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json != null ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Loading markers failed:', e);
    return [];
  }
};
