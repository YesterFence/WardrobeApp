// lib/tags.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

const TAGS_BY_ITEM_KEY = 'WARDROBE_TAGS_BY_ITEM_v1';

export type TagsByItem = Record<string, string[]>;

export async function readTagsByItem(): Promise<TagsByItem> {
  try {
    const raw = await AsyncStorage.getItem(TAGS_BY_ITEM_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as TagsByItem;
  } catch (e) {
    console.warn('readTagsByItem failed', e);
    return {};
  }
}

export async function writeTagsByItem(data: TagsByItem) {
  await AsyncStorage.setItem(TAGS_BY_ITEM_KEY, JSON.stringify(data));
}

export async function removeItemFromAllTags(itemId: string) {
  try {
    const data = await readTagsByItem();
    delete data[itemId];
    await writeTagsByItem(data);
  } catch (e) {
    console.warn('removeItemFromAllTags failed', e);
  }
}

export async function setItemTags(itemId: string, tags: string[]) {
  try {
    const data = await readTagsByItem();
    data[itemId] = tags.map(t => t.trim().toLowerCase()).filter(Boolean);
    await writeTagsByItem(data);
  } catch (e) {
    console.warn('setItemTags failed', e);
  }
}

export async function getItemTags(itemId: string): Promise<string[]> {
  try {
    const data = await readTagsByItem();
    return data[itemId] || [];
  } catch (e) {
    console.warn('getItemTags failed', e);
    return [];
  }
}