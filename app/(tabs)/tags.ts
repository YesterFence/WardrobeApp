// app/(tabs)/tags.ts

// app/(tabs)/tags.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

// ---------------------------
// Types
// ---------------------------
export type WardrobeItem = {
  id: string;
  uri: string;
  createdAt: number;
  tags: string[];
};

export type TagData = {
  name: string;
  count: number;
};

export type TagListEntry = {
  tag: string;
  createdAt: number; // optional, set 0 if unknown
  uses: number;      // optional, set 0 if unknown
  count: number;
};

// ---------------------------
// Default tags (preset)
// ---------------------------
export const DEFAULT_TAGS: string[] = [
  "top",
  "bottom",
  "shirt",
  "pants",
  "shoes",
  "jacket",
  "dress",
  "hat",
  "socks",
];

// ---------------------------
// Functions
// ---------------------------

// Get all tags currently in the wardrobe items
export const getAllTags = async (
  sortBy: "alpha" | "date" | "uses" = "alpha"
): Promise<TagListEntry[]> => {
  try {
    const itemsStr = await AsyncStorage.getItem("WARDROBE_ITEMS");
    const items: WardrobeItem[] = itemsStr ? JSON.parse(itemsStr) : [];

    const tagCountMap: { [key: string]: number } = {};

    items.forEach((item) => {
      item.tags.forEach((tag) => {
        tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
      });
    });

    // Include default tags
    DEFAULT_TAGS.forEach((tag) => {
      if (!tagCountMap[tag]) tagCountMap[tag] = 0;
    });

    // Convert to TagListEntry[]
    const tagDataArray: TagListEntry[] = Object.entries(tagCountMap).map(([tag, count]) => ({
      tag,
      createdAt: 0, // placeholder
      uses: count,
      count,
    }));

    // Sort based on sortBy
    tagDataArray.sort((a, b) => {
      if (sortBy === "alpha") return a.tag.localeCompare(b.tag);
      if (sortBy === "uses") return (b.uses ?? 0) - (a.uses ?? 0);
      if (sortBy === "date") return (b.createdAt ?? 0) - (a.createdAt ?? 0);
      return 0;
    });

    return tagDataArray;
  } catch (err) {
    console.error("Error fetching tags:", err);
    return DEFAULT_TAGS.map((t) => ({ tag: t, createdAt: 0, uses: 0, count: 0 }));
  }
};

// export const getAllTags = async (): Promise<TagData[]> => {
//   try {
//     const itemsStr = await AsyncStorage.getItem("WARDROBE_ITEMS");
//     const items: WardrobeItem[] = itemsStr ? JSON.parse(itemsStr) : [];

//     const tagCountMap: { [key: string]: number } = {};

//     items.forEach((item) => {
//       item.tags.forEach((tag) => {
//         tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
//       });
//     });

//     // Include default tags even if not used yet
//     DEFAULT_TAGS.forEach((tag) => {
//       if (!tagCountMap[tag]) tagCountMap[tag] = 0;
//     });

//     const tagDataArray: TagData[] = Object.entries(tagCountMap).map(([name, count]) => ({
//       name,
//       count,
//     }));

//     tagDataArray.sort((a, b) => a.name.localeCompare(b.name));

//     return tagDataArray;
//   } catch (err) {
//     console.error("Error fetching tags:", err);
//     return DEFAULT_TAGS.map((t) => ({ name: t, count: 0 }));
//   }
// };

// Get tags for a single wardrobe item
export const getTagsForItem = async (itemId: string): Promise<string[]> => {
  const itemsStr = await AsyncStorage.getItem("WARDROBE_ITEMS");
  const items: WardrobeItem[] = itemsStr ? JSON.parse(itemsStr) : [];
  const item = items.find((i) => i.id === itemId);
  return item?.tags ?? [];
};

// Add a tag if it doesn’t exist yet
export const ensureTagExists = async (tag: string) => {
  const normTag = tag.trim().toLowerCase();
  if (!DEFAULT_TAGS.includes(normTag)) {
    DEFAULT_TAGS.push(normTag);
  }
};

// Update a wardrobe item with new tags (replace old with new)
export const updateTagIndexForItem = async (itemId: string, oldTags: string[], newTags: string[]) => {
  const itemsStr = await AsyncStorage.getItem("WARDROBE_ITEMS");
  const items: WardrobeItem[] = itemsStr ? JSON.parse(itemsStr) : [];

  const updatedItems = items.map((item) => {
    if (item.id === itemId) {
      return { ...item, tags: newTags };
    }
    return item;
  });

  await AsyncStorage.setItem("WARDROBE_ITEMS", JSON.stringify(updatedItems));
};

// Delete a tag completely from all wardrobe items
export const deleteTagCompletely = async (tag: string) => {
  const itemsStr = await AsyncStorage.getItem("WARDROBE_ITEMS");
  const items: WardrobeItem[] = itemsStr ? JSON.parse(itemsStr) : [];

  const updatedItems = items.map((item) => ({
    ...item,
    tags: item.tags.filter((t) => t !== tag),
  }));

  await AsyncStorage.setItem("WARDROBE_ITEMS", JSON.stringify(updatedItems));
};

// Toggle a tag for a specific item
export const toggleTagForItem = async (itemId: string, tag: string) => {
  const itemsStr = await AsyncStorage.getItem("WARDROBE_ITEMS");
  const items: WardrobeItem[] = itemsStr ? JSON.parse(itemsStr) : [];

  const updatedItems = items.map((item) => {
    if (item.id === itemId) {
      const tagsSet = new Set(item.tags);
      if (tagsSet.has(tag)) tagsSet.delete(tag);
      else tagsSet.add(tag);
      return { ...item, tags: Array.from(tagsSet) };
    }
    return item;
  });

  await AsyncStorage.setItem("WARDROBE_ITEMS", JSON.stringify(updatedItems));
};

// Remove an item completely from all tags
export const removeItemFromAllTags = async (itemId: string) => {
  const itemsStr = await AsyncStorage.getItem("WARDROBE_ITEMS");
  let items: WardrobeItem[] = itemsStr ? JSON.parse(itemsStr) : [];

  items = items.filter((item) => item.id !== itemId);
  await AsyncStorage.setItem("WARDROBE_ITEMS", JSON.stringify(items));
};

// Optional: add a new default tag
export const addDefaultTag = (tag: string) => {
  if (!DEFAULT_TAGS.includes(tag)) DEFAULT_TAGS.push(tag);
};

// Optional: remove a default tag
export const removeDefaultTag = (tag: string) => {
  const index = DEFAULT_TAGS.indexOf(tag);
  if (index > -1) DEFAULT_TAGS.splice(index, 1);
};








// import AsyncStorage from "@react-native-async-storage/async-storage";

// // ---------------------------
// // Types
// // ---------------------------
// export type WardrobeItem = {
//   id: string;
//   uri: string;
//   createdAt: number;
//   tags: string[];
// };

// export type TagData = {
//   name: string;
//   count: number;
// };

// // ---------------------------
// // Default tags (preset)
// // ---------------------------
// export const DEFAULT_TAGS: string[] = [
//   "top",
//   "bottom",
//   "shirt",
//   "pants",
//   "shoes",
//   "jacket",
//   "dress",
//   "hat",
//   "socks",
// ];

// // ---------------------------
// // Functions
// // ---------------------------

// // Get all tags currently in the wardrobe items
// export const getAllTags = async (): Promise<TagData[]> => {
//   try {
//     const itemsStr = await AsyncStorage.getItem("WARDROBE_ITEMS");
//     const items: WardrobeItem[] = itemsStr ? JSON.parse(itemsStr) : [];

//     const tagCountMap: { [key: string]: number } = {};

//     // Count tags
//     items.forEach((item) => {
//       item.tags.forEach((tag) => {
//         tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
//       });
//     });

//     // Include default tags even if not used yet
//     DEFAULT_TAGS.forEach((tag) => {
//       if (!tagCountMap[tag]) tagCountMap[tag] = 0;
//     });

//     // Convert to array and sort alphabetically
//     const tagDataArray: TagData[] = Object.entries(tagCountMap).map(([name, count]) => ({ name, count }));
//     tagDataArray.sort((a, b) => a.name.localeCompare(b.name));

//     return tagDataArray;
//   } catch (err) {
//     console.error("Error fetching tags:", err);
//     return DEFAULT_TAGS.map((t) => ({ name: t, count: 0 }));
//   }
// };

// // Add or remove a tag from a wardrobe item
// export const toggleTagForItem = async (itemId: string, tag: string) => {
//   try {
//     const itemsStr = await AsyncStorage.getItem("WARDROBE_ITEMS");
//     const items: WardrobeItem[] = itemsStr ? JSON.parse(itemsStr) : [];

//     const updatedItems = items.map((item) => {
//       if (item.id === itemId) {
//         const tagsSet = new Set(item.tags);
//         if (tagsSet.has(tag)) {
//           tagsSet.delete(tag); // remove tag
//         } else {
//           tagsSet.add(tag); // add tag
//         }
//         return { ...item, tags: Array.from(tagsSet) };
//       }
//       return item;
//     });

//     await AsyncStorage.setItem("WARDROBE_ITEMS", JSON.stringify(updatedItems));
//   } catch (err) {
//     console.error("Error toggling tag:", err);
//   }
// };

// // Remove an item completely from all tags (useful if deleting an item)
// export const removeItemFromAllTags = async (itemId: string) => {
//   try {
//     const itemsStr = await AsyncStorage.getItem("WARDROBE_ITEMS");
//     let items: WardrobeItem[] = itemsStr ? JSON.parse(itemsStr) : [];

//     // Remove the item from the list
//     items = items.filter((item) => item.id !== itemId);

//     await AsyncStorage.setItem("WARDROBE_ITEMS", JSON.stringify(items));
//   } catch (err) {
//     console.error("Error removing item from all tags:", err);
//   }
// };

// // Optional: add a new default tag
// export const addDefaultTag = (tag: string) => {
//   if (!DEFAULT_TAGS.includes(tag)) DEFAULT_TAGS.push(tag);
// };

// // Optional: remove a default tag
// export const removeDefaultTag = (tag: string) => {
//   const index = DEFAULT_TAGS.indexOf(tag);
//   if (index > -1) DEFAULT_TAGS.splice(index, 1);
// };
