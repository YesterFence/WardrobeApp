// app/(tabs)/wardrobe.tsx

// app/(tabs)/wardrobe.tsx
// import { useRouter } from "expo-router";
// import React, { useEffect, useState } from "react";
// import {
//   Alert,
//   FlatList,
//   Image,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// import { loadWardrobe, WardrobeItem } from "./storage";
// // import { getTagsForItem } from "./tags";

// export default function WardrobeScreen() {
//   const [items, setItems] = useState<WardrobeItem[]>([]);
//   const [tagsMap, setTagsMap] = useState<Record<string, string[]>>({});
//   const router = useRouter();

//   const refreshWardrobe = async () => {
//     const loaded = await loadWardrobe();
//     setItems(loaded);

//     // load tags for each item
//     const map: Record<string, string[]> = {};
//     await Promise.all(
//       loaded.map(async (i) => {
//         // const t = await getTagsForItem(i.id);
//         // map[i.id] = t;
//       })
//     );
//     setTagsMap(map);
//   };

//   useEffect(() => {
//     refreshWardrobe();
//   }, []);

//   // Open upload screen with image preloaded for editing
//   const handleEditTags = (item: WardrobeItem) => {
//     router.push({
//       pathname: "/upload",
//       params: { uri: item.uri, id: item.id },
//     });
//   };

//   const renderItem = ({ item }: { item: WardrobeItem }) => {
//     const tags = tagsMap[item.id] || [];

//     return (
//       <TouchableOpacity
//         onPress={() => handleEditTags(item)}
//         onLongPress={() => Alert.alert("Info", `Tags: ${tags.join(", ")}`)}
//         style={styles.itemContainer}
//       >
//         <Image source={{ uri: item.uri }} style={styles.image} />
//         <View style={styles.tagRow}>
//           {tags.slice(0, 3).map((t) => (
//             <View key={t} style={styles.tagChip}>
//               <Text style={styles.tagText}>{t}</Text>
//             </View>
//           ))}
//           {tags.length > 3 && (
//             <Text style={styles.moreText}>+{tags.length - 3} more</Text>
//           )}
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       {items.length === 0 ? (
//         <View style={styles.emptyContainer}>
//           <Text style={styles.emptyText}>Your wardrobe is empty.</Text>
//         </View>
//       ) : (
//         <FlatList
//           data={items}
//           keyExtractor={(item) => item.id}
//           renderItem={renderItem}
//           numColumns={2}
//           contentContainerStyle={styles.listContainer}
//         />
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#fff" },
//   listContainer: { padding: 8 },
//   itemContainer: {
//     flex: 1,
//     margin: 8,
//     borderRadius: 12,
//     overflow: "hidden",
//     backgroundColor: "#eee",
//   },
//   image: { width: "100%", aspectRatio: 1, borderRadius: 12 },
//   tagRow: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     padding: 4,
//     backgroundColor: "#f2f2f2",
//   },
//   tagChip: {
//     backgroundColor: "#BB9457",
//     borderRadius: 12,
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     margin: 2,
//   },
//   tagText: { color: "#fff", fontSize: 12, fontWeight: "700" },
//   moreText: { fontSize: 12, marginLeft: 4, alignSelf: "center" },
//   emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
//   emptyText: { color: "#888", fontSize: 16 },
// });




import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../../components/Button';
import { ensureWardrobeFolderExists, listFilesInFolder, readFilterTags, WardrobeItem, } from './storage';
import { getItemsForTag } from './tags';


export default function WardrobeScreen() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const router = useRouter();
  const lastTapRef = useRef<number | null>(null);
  const DOUBLE_TAP_DELAY = 300; // ms

  // Load wardrobe + active filters
  const loadItems = async () => {
    await ensureWardrobeFolderExists();

    // Load current items
    const idx = await readIndex();
    const files = await listFilesInFolder();

    // Build fallback list if index is empty
    let built: WardrobeItem[] = idx;
    if (idx.length === 0 && files.length > 0) {
      built = files.map((f) => ({ id: f, uri: f, createdAt: Date.now(), tags: [] }));
    }

    // Load active filter tags from storage
    // inside loadItems()
    const filters = await readFilterTags();
    if (filters.length === 1) {
      // fast path: get only items for this tag
      const results = await getItemsForTag(filters[0]);
      setItems(results);
      
    } else {
        setActiveTags(filters);
    }

    // Apply tag filtering (case insensitive)
    if (filters.length > 0) {
      const filtered = built.filter((item) =>
        (item.tags ?? []).some((t) => filters.includes(t.toLowerCase()))
      );
      setItems(filtered);
    } else {
      setItems(built);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  function handleTap(item: WardrobeItem) {
    const now = Date.now();
    if (lastTapRef.current && now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected -> navigate to upload with params
      const uriParam = encodeURIComponent(item.uri);
      const idParam = encodeURIComponent(item.id);
      router.push(`/upload?uri=${uriParam}&id=${idParam}`);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        lastTapRef.current = null;
      }, DOUBLE_TAP_DELAY + 20);
    }
  }

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          {activeTags.length > 0
            ? 'No clothes match your selected tags.'
            : 'No clothes yet — add some to your Wardrobe.'}
        </Text>
        <Button
          theme="primary"
          label="Upload Clothes"
          onPress={() => router.push('/upload' as any)}
        />
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: '#BB9457' }}
      contentContainerStyle={styles.listContainer}
      data={items}
      keyExtractor={(i) => i.id}
      numColumns={2}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => handleTap(item)}>
          <Image source={{ uri: item.uri }} style={styles.image} />
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagContainer}>
              {item.tags.slice(0, 2).map((tag, idx) => (
                <Text key={idx} style={styles.tag}>
                  #{tag}
                </Text>
              ))}
              {item.tags.length > 2 && <Text style={styles.moreTag}>+{item.tags.length - 2}</Text>}
            </View>
          )}
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: '#BB9457',
    justifyContent: 'center',
    ...StyleSheet.flatten({
      padding: 12,
    })
  },
  card: {
    flex: 1,
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    width: 160,
    height: 220,
    borderRadius: 12,
  },
  tagContainer: {
    position: 'absolute', 
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: 'rgba(0,0,0,0.6)', 
    color: '#fff',
    fontSize: 12,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginRight: 4,
  },
  moreTag: {
    backgroundColor: 'rgba(255,255,255,0.3)', 
    color: '#fff',
    fontSize: 12,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  empty: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  emptyText: { 
    color: '#fff', 
    marginBottom: 20, 
    textAlign: 'center', 
    paddingHorizontal: 16 
  },
});
