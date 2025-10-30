// app/(tabs)/storage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const DOC_DIR: string = ((FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory ?? '') as string;

export const WARDROBE_FOLDER = DOC_DIR ? `${DOC_DIR}Wardrobe/` : '';
const INDEX_KEY = 'WARDROBE_INDEX_v1';

export type WardrobeItem = {
  id: string;
  uri: string;
  createdAt: number;
  // later: tags?: string[];
};

export async function ensureWardrobeFolderExists() {
  try {
    if (!DOC_DIR) return; // web or very limited runtime
    await FileSystem.makeDirectoryAsync(WARDROBE_FOLDER, { intermediates: true });
  } catch (e: any) {
    // ignore "already exists" errors, warn otherwise
    if (!String(e).toLowerCase().includes('file exists')) {
      console.warn('ensureWardrobeFolderExists error', e);
    }
  }
}

export async function readIndex(): Promise<WardrobeItem[]> {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WardrobeItem[];
  } catch (e) {
    console.warn('readIndex parse error', e);
    return [];
  }
}

export async function writeIndex(items: WardrobeItem[]) {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(items));
}

export async function addItem(item: WardrobeItem) {
  const list = await readIndex();
  list.unshift(item);
  await writeIndex(list);
}

export async function updateItem(updated: WardrobeItem) {
  try {
    const list = await readIndex();
    const idx = list.map((i) => (i.id === updated.id ? updated : i));
    await writeIndex(idx);
  } catch (e) {
    console.warn('updateItem failed', e);
  }
}

export async function listFilesInFolder(): Promise<string[]> {
  try {
    if (!DOC_DIR) return [];
    const names = await FileSystem.readDirectoryAsync(WARDROBE_FOLDER);
    return names.map((n) => `${WARDROBE_FOLDER}${n}`);
  } catch (e) {
    console.warn('listFilesInFolder failed', e);
    return [];
  }
}