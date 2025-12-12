// lib/storage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { removeItemFromAllTags } from './tags';

const DOC_DIR: string = ((FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory ?? '') as string;
export const WARDROBE_FOLDER = DOC_DIR ? `${DOC_DIR}Wardrobe/` : '';

const INDEX_KEY = 'WARDROBE_INDEX_v1';
const FILTER_KEY = 'WARDROBE_FILTER_v1';
const PRESET_TAGS_KEY = 'WARDROBE_PRESET_TAGS_v1';

const MAIN_CATEGORIES = ['hat', 'shirt', 'coat', 'jacket', 'pants', 'shoes', 'dress', 'skirt'];

export type WardrobeItem = {
  id: string;
  filename?: string;
  uri: string;
  createdAt: number;
  tags?: string[];
};

export async function ensureWardrobeFolderExists() {
  try {
    if (!DOC_DIR) return;
    await FileSystem.makeDirectoryAsync(WARDROBE_FOLDER, { intermediates: true });
  } catch (e: any) {
    if (!String(e).toLowerCase().includes('file exists')) {
      console.warn('ensureWardrobeFolderExists error', e);
    }
  }
}

export async function readPresetTags(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(PRESET_TAGS_KEY);
    if (!raw) {
      const defaults = [
        ...MAIN_CATEGORIES,
        'casual', 'formal', 'workout', 'business',
        'summer', 'winter', 'spring', 'fall',
        'black', 'white', 'blue', 'red', 'green', 'gray', 'brown'
      ];
      await setPresetTags(defaults);
      return sortTagsWithMainFirst(defaults);
    }
    const tags = JSON.parse(raw) as string[];
    return sortTagsWithMainFirst(tags);
  } catch (e) {
    console.warn('readPresetTags failed', e);
    return sortTagsWithMainFirst(MAIN_CATEGORIES);
  }
}

function sortTagsWithMainFirst(tags: string[]): string[] {
  const mainInList = tags.filter(t => MAIN_CATEGORIES.includes(t.toLowerCase()));
  const others = tags.filter(t => !MAIN_CATEGORIES.includes(t.toLowerCase())).sort();
  const orderedMain = MAIN_CATEGORIES.filter(mc => mainInList.includes(mc));
  return [...orderedMain, ...others];
}

export async function setPresetTags(tags: string[]) {
  const normalized = Array.from(new Set(tags.map(t => t.trim().toLowerCase()).filter(Boolean)));
  await AsyncStorage.setItem(PRESET_TAGS_KEY, JSON.stringify(normalized));
}

export async function addPresetTag(tag: string) {
  try {
    const t = tag.trim().toLowerCase();
    if (!t) return;
    const existing = await readPresetTags();
    if (!existing.includes(t)) {
      existing.push(t);
      await setPresetTags(existing);
    }
  } catch (e) {
    console.warn('addPresetTag failed', e);
  }
}

export async function getAllTags(): Promise<string[]> {
  try {
    const preset = await readPresetTags();
    const list = await readIndex();
    const set = new Set<string>(preset.map(t => t.toLowerCase()));
    for (const it of list) {
      (it.tags ?? []).forEach(t => set.add(t.toLowerCase()));
    }
    const allTags = Array.from(set);
    return sortTagsWithMainFirst(allTags);
  } catch (e) {
    console.warn('getAllTags failed', e);
    return sortTagsWithMainFirst(MAIN_CATEGORIES);
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
    const exists = list.some(i => i.id === updated.id);
    const newList = exists ? list.map(i => (i.id === updated.id ? updated : i)) : [updated, ...list];
    await writeIndex(newList);
  } catch (e) {
    console.warn('updateItem failed', e);
  }
}

export async function deleteItem(id: string) {
  try {
    const list = await readIndex();
    const item = list.find(i => i.id === id);
    const newList = list.filter(i => i.id !== id);

    try {
      if (item?.filename) {
        const path = `${WARDROBE_FOLDER}${item.filename}`;
        await FileSystem.deleteAsync(path, { idempotent: true });
      } else if (item?.uri?.startsWith(WARDROBE_FOLDER)) {
        await FileSystem.deleteAsync(item.uri, { idempotent: true });
      }
    } catch (err) {
      console.warn('file delete warning', err);
    }
    
    await writeIndex(newList);
    await removeItemFromAllTags(id);
  } catch (e) {
    console.warn('deleteItem failed', e);
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

export async function setFilterTags(tags: string[]) {
  await AsyncStorage.setItem(FILTER_KEY, JSON.stringify(tags));
}

export async function readFilterTags(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(FILTER_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch (e) {
    console.warn('readFilterTags parse error', e);
    return [];
  }
}

export async function clearAllData() {
  try {
    if (DOC_DIR && WARDROBE_FOLDER) {
      const files = await FileSystem.readDirectoryAsync(WARDROBE_FOLDER);
      for (const file of files) {
        await FileSystem.deleteAsync(`${WARDROBE_FOLDER}${file}`, { idempotent: true });
      }
    }

    await AsyncStorage.multiRemove([
      INDEX_KEY,
      FILTER_KEY,
      PRESET_TAGS_KEY,
      'WARDROBE_TAGS_BY_ITEM_v1',
    ]);

    console.log('All data cleared successfully');
  } catch (e) {
    console.error('clearAllData error', e);
    throw e;
  }
}