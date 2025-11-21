// app/(tabs)/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const DOC_DIR: string = ((FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory ?? '') as string;
export const WARDROBE_FOLDER = DOC_DIR ? `${DOC_DIR}Wardrobe/` : '';

const INDEX_KEY = 'WARDROBE_INDEX_v1';
const FILTER_KEY = 'WARDROBE_FILTER_v1'; // stores array of active tags

// storage.ts (add / replace these blocks where appropriate)
const PRESET_TAGS_KEY = 'WARDROBE_PRESET_TAGS_v1';

// Read preset tags (returns array of strings, stored normalized)
export async function readPresetTags(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(PRESET_TAGS_KEY);
    if (!raw) {
      // default presets — change these to whatever you want shipped with the app
      const defaults = [
        'top', 'bottom', 'outer', 'dress', 'shoes',
        'casual', 'formal', 'workout', 'summer', 'winter',
        'spring', 'fall', 'black', 'white', 'blue', 'red'
      ];
      await setPresetTags(defaults);
      return defaults;
    }
    return JSON.parse(raw) as string[];
  } catch (e) {
    console.warn('readPresetTags failed', e);
    return [];
  }
}

// Overwrite preset tags array (internal helper)
export async function setPresetTags(tags: string[]) {
  // normalize: trim + lowercase + unique
  const normalized = Array.from(new Set(tags.map(t => t.trim().toLowerCase()).filter(Boolean)));
  await AsyncStorage.setItem(PRESET_TAGS_KEY, JSON.stringify(normalized));
}

// Add a single preset tag (idempotent)
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

// Expand getAllTags() to include preset tags + item tags (deduped)
export async function getAllTags(): Promise<string[]> {
  try {
    const preset = await readPresetTags();
    const list = await readIndex();
    const set = new Set<string>(preset.map(t => t.toLowerCase()));
    for (const it of list) {
      (it.tags ?? []).forEach(t => set.add(t.toLowerCase()));
    }
    return Array.from(set).sort();
  } catch (e) {
    console.warn('getAllTags failed', e);
    return [];
  }
}


export type WardrobeItem = {
  id: string;
  uri: string;
  createdAt: number;
  tags?: string[]; // <-- new
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
    const newList = list.filter(i => i.id !== id);
    await writeIndex(newList);
    // optionally delete file from WARDROBE_FOLDER
    const filename = `${WARDROBE_FOLDER}img_${id}.jpg`;
    try { await FileSystem.deleteAsync(filename, { idempotent: true }); } catch {}
  } catch (e) {
    console.warn('deleteItem failed', e);
  }
}

// return absolute URIs for files in folder (existing helper)
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

/** ----- New: Tag + Filter helpers ----- **/

// read / write the active filter tags (used by filter.tsx and wardrobe.tsx)
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


// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as FileSystem from 'expo-file-system';

// const DOC_DIR: string = ((FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory ?? '') as string;

// export const WARDROBE_FOLDER = DOC_DIR ? `${DOC_DIR}Wardrobe/` : '';
// const INDEX_KEY = 'WARDROBE_INDEX_v1';

// export type WardrobeItem = {
//   id: string;
//   uri: string;
//   createdAt: number;
//   // later: tags?: string[];
// };

// export async function ensureWardrobeFolderExists() {
//   try {
//     if (!DOC_DIR) return; // web or very limited runtime
//     await FileSystem.makeDirectoryAsync(WARDROBE_FOLDER, { intermediates: true });
//   } catch (e: any) {
//     // ignore "already exists" errors, warn otherwise
//     if (!String(e).toLowerCase().includes('file exists')) {
//       console.warn('ensureWardrobeFolderExists error', e);
//     }
//   }
// }

// export async function readIndex(): Promise<WardrobeItem[]> {
//   try {
//     const raw = await AsyncStorage.getItem(INDEX_KEY);
//     if (!raw) return [];
//     return JSON.parse(raw) as WardrobeItem[];
//   } catch (e) {
//     console.warn('readIndex parse error', e);
//     return [];
//   }
// }

// export async function writeIndex(items: WardrobeItem[]) {
//   await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(items));
// }

// export async function addItem(item: WardrobeItem) {
//   const list = await readIndex();
//   list.unshift(item);
//   await writeIndex(list);
// }

// export async function updateItem(updated: WardrobeItem) {
//   try {
//     const list = await readIndex();
//     const idx = list.map((i) => (i.id === updated.id ? updated : i));
//     await writeIndex(idx);
//   } catch (e) {
//     console.warn('updateItem failed', e);
//   }
// }

// export async function listFilesInFolder(): Promise<string[]> {
//   try {
//     if (!DOC_DIR) return [];
//     const names = await FileSystem.readDirectoryAsync(WARDROBE_FOLDER);
//     return names.map((n) => `${WARDROBE_FOLDER}${n}`);
//   } catch (e) {
//     console.warn('listFilesInFolder failed', e);
//     return [];
//   }
// }