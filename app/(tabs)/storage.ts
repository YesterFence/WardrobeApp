// // app/(tabs)/storage.ts

// app/(tabs)/storage.ts
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as FileSystem from "expo-file-system";
// import { removeItemFromAllTags } from "./tags"; // adjust path if needed

// export type WardrobeItem = {
//   id: string;
//   filename?: string;
//   uri: string;
//   createdAt: number;
// };

// const INDEX_KEY = "WARDROBE_INDEX_v2";
// const PRESET_TAGS_KEY = "WARDROBE_PRESET_TAGS_v1";
// const WARDROBE_DIR = `${(FileSystem as any).documentDirectory ?? ""}Wardrobe/`;

// // ensure folder exists
// async function ensureFolder() {
//   try {
//     const info = await FileSystem.getInfoAsync(WARDROBE_DIR);
//     if (!info.exists) {
//       await FileSystem.makeDirectoryAsync(WARDROBE_DIR, { intermediates: true });
//     }
//   } catch (e) {
//     console.warn("ensureFolder failed", e);
//   }
// }

// async function readIndex(): Promise<WardrobeItem[]> {
//   try {
//     const raw = await AsyncStorage.getItem(INDEX_KEY);
//     return raw ? (JSON.parse(raw) as WardrobeItem[]) : [];
//   } catch (e) {
//     console.warn("readIndex failed", e);
//     return [];
//   }
// }

// async function writeIndex(items: WardrobeItem[]) {
//   try {
//     await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(items));
//   } catch (e) {
//     console.warn("writeIndex failed", e);
//   }
// }

// /**
//  * storeImage
//  * - copies the provided URI into app folder
//  * - returns a WardrobeItem { id, filename, uri, createdAt }
//  */
// export async function storeImage(originalUri: string): Promise<WardrobeItem> {
//   await ensureFolder();

//   // make a reasonably unique filename
//   const id = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
//   // try preserve extension
//   let ext = "jpg";
//   try {
//     const parts = originalUri.split(".");
//     const raw = parts[parts.length - 1].split("?")[0];
//     if (raw.length <= 5) ext = raw;
//   } catch {}

//   const filename = `img_${id}.${ext}`;
//   const dest = `${WARDROBE_DIR}${filename}`;

//   try {
//     // try copy first (works for file://)
//     await FileSystem.copyAsync({ from: originalUri, to: dest });
//   } catch (copyErr) {
//     console.warn("copyAsync failed, attempting fallback:", copyErr);
//     try {
//       // if http(s), try downloadAsync
//       if (originalUri.startsWith("http://") || originalUri.startsWith("https://")) {
//         await FileSystem.downloadAsync(originalUri, dest);
//       } else {
//         // fallback: fetch -> arrayBuffer -> base64 write (may be memory heavy)
//         const res = await fetch(originalUri);
//         if (!res.ok) throw new Error("fetch failed");
//         const blob = await res.blob();
//         const arr = await blob.arrayBuffer();
//         // convert to base64
//         let binary = "";
//         const bytes = new Uint8Array(arr);
//         for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
//         const b64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");

//         // Use (FileSystem as any).EncodingType if the typing doesn't expose it
//         const encodingOption = (FileSystem as any).EncodingType?.Base64 ?? "base64";
//         // cast options to any to avoid type complaints
//         await (FileSystem as any).writeAsStringAsync(dest, b64, { encoding: encodingOption } as any);
//       }
//     } catch (fallbackErr) {
//       console.warn("Fallback storing failed, returning item that points to original URI:", fallbackErr);
//       return {
//         id,
//         filename,
//         uri: originalUri,
//         createdAt: Date.now(),
//       };
//     }
//   }

//   return {
//     id,
//     filename,
//     uri: dest,
//     createdAt: Date.now(),
//   };
// }

// export async function loadWardrobe(): Promise<WardrobeItem[]> {
//   return readIndex();
// }

// export async function addItem(item: WardrobeItem) {
//   const list = await readIndex();
//   list.unshift(item);
//   await writeIndex(list);
// }

// export async function updateItem(updated: WardrobeItem) {
//   const list = await readIndex();
//   const i = list.findIndex((it) => it.id === updated.id);
//   if (i !== -1) list[i] = updated;
//   else list.unshift(updated);
//   await writeIndex(list);
// }

// export async function deleteItem(id: string) {
//   // remove tag references (safe if tags.ts handles missing)
//   try {
//     await removeItemFromAllTags(id);
//   } catch (e) {
//     console.warn("removeItemFromAllTags failed", e);
//   }

//   const list = await readIndex();
//   const item = list.find((it) => it.id === id);
//   const filtered = list.filter((it) => it.id !== id);

//   if (item?.uri?.startsWith(WARDROBE_DIR)) {
//     try {
//       await FileSystem.deleteAsync(item.uri, { idempotent: true });
//     } catch (e) {
//       console.warn("Failed to delete file during deleteItem:", e);
//     }
//   }

//   await writeIndex(filtered);
// }

// /* -------------------------
//    Preset tags helpers
//    (used by upload.tsx UI)
//    ------------------------- */

// export async function readPresetTags(): Promise<string[]> {
//   try {
//     const raw = await AsyncStorage.getItem(PRESET_TAGS_KEY);
//     if (!raw) {
//       const defaults = [
//         "top",
//         "bottom",
//         "outer",
//         "dress",
//         "shoes",
//         "casual",
//         "formal",
//         "workout",
//         "summer",
//         "winter",
//         "spring",
//         "fall",
//         "black",
//         "white",
//         "blue",
//         "red",
//       ];
//       await AsyncStorage.setItem(PRESET_TAGS_KEY, JSON.stringify(defaults));
//       return defaults;
//     }
//     return JSON.parse(raw);
//   } catch (e) {
//     console.warn("readPresetTags failed", e);
//     return [];
//   }
// }

// export async function addPresetTag(tag: string) {
//   try {
//     const raw = await AsyncStorage.getItem(PRESET_TAGS_KEY);
//     const existing: string[] = raw ? JSON.parse(raw) : [];
//     const t = tag.trim().toLowerCase();
//     if (!t) return;
//     if (!existing.includes(t)) {
//       existing.push(t);
//       await AsyncStorage.setItem(PRESET_TAGS_KEY, JSON.stringify(existing));
//     }
//   } catch (e) {
//     console.warn("addPresetTag failed", e);
//   }
// }

// export async function removePresetTag(tag: string) {
//   try {
//     const raw = await AsyncStorage.getItem(PRESET_TAGS_KEY);
//     const list: string[] = raw ? JSON.parse(raw) : [];
//     const normalized = tag.trim().toLowerCase();
//     const filtered = list.filter((t) => t !== normalized);
//     await AsyncStorage.setItem(PRESET_TAGS_KEY, JSON.stringify(filtered));
//   } catch (e) {
//     console.warn("removePresetTag failed", e);
//   }
// }




import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { removeItemFromAllTags } from './tags';

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
  filename?: string; // e.g. img_<id>.jpg
  uri: string; // absolute uri to display (either WARDROBE_FOLDER + filename or original)
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

    // Delete file if we know the filename or uri is inside the wardrobe folder
    try {
      if (item?.filename) {
        const path = `${WARDROBE_FOLDER}${item.filename}`;
        await FileSystem.deleteAsync(path, { idempotent: true });
      } else if (item?.uri?.startsWith(WARDROBE_FOLDER)) {
        await FileSystem.deleteAsync(item.uri, { idempotent: true });
      }
    } catch (err) {
      // ignore delete errors (idempotent)
      console.warn('file delete warning', err);
    }
    // after you successfully filter the index and persist it:
    await writeIndex(newList);
    // also remove any tag references
    await removeItemFromAllTags(id);
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