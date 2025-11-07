// app/(tabs)/wardrobe.tsx

import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../../components/Button';
import { ensureWardrobeFolderExists, listFilesInFolder, readFilterTags, readIndex, WardrobeItem, } from './storage';


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
    const filters = await readFilterTags();
    setActiveTags(filters);

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
      style={{ backgroundColor: '#25292e' }}
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
  listContainer: { padding: 12, justifyContent: 'center' },
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#fff', marginBottom: 20, textAlign: 'center', paddingHorizontal: 16 },
});



// import { useFocusEffect } from '@react-navigation/native';
// import { Image } from 'expo-image';
// import { useRouter } from 'expo-router';
// import React, { useCallback, useRef, useState } from 'react';
// import { FlatList, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
// import Button from '../../components/Button';
// import {
//   ensureWardrobeFolderExists,
//   listFilesInFolder,
//   readIndex,
//   readFilterTags,
//   writeIndex,
//   WardrobeItem,
// } from './storage';

// export default function WardrobeScreen() {
//   const [items, setItems] = useState<WardrobeItem[]>([]);
//   const [activeTags, setActiveTags] = useState<string[]>([]);
//   const router = useRouter();
//   const lastTapRef = useRef<number | null>(null);
//   const DOUBLE_TAP_DELAY = 300; // ms

//   // Load wardrobe + active filters
//   const loadItems = async () => {
//     await ensureWardrobeFolderExists();

//     const idx = await readIndex();
//     const files = await listFilesInFolder();

//     // If no saved index, build one from folder files
//     let built: WardrobeItem[] = idx;
//     if (idx.length === 0 && files.length > 0) {
//       built = files.map((f) => ({ id: f, uri: f, createdAt: Date.now(), tags: [] }));
//     }

//     // Load filter tags
//     const filters = await readFilterTags();
//     setActiveTags(filters);

//     // Apply filtering
//     if (filters.length > 0) {
//       const filtered = built.filter((item) =>
//         (item.tags ?? []).some((t) => filters.includes(t.toLowerCase()))
//       );
//       setItems(filtered);
//     } else {
//       setItems(built);
//     }
//   };

//   useFocusEffect(
//     useCallback(() => {
//       loadItems();
//     }, [])
//   );

//   // Double-tap detection
//   function handleTap(item: WardrobeItem) {
//     const now = Date.now();
//     if (lastTapRef.current && now - lastTapRef.current < DOUBLE_TAP_DELAY) {
//       const uriParam = encodeURIComponent(item.uri);
//       const idParam = encodeURIComponent(item.id);
//       router.push(`/upload?uri=${uriParam}&id=${idParam}`);
//       lastTapRef.current = null;
//     } else {
//       lastTapRef.current = now;
//       setTimeout(() => {
//         lastTapRef.current = null;
//       }, DOUBLE_TAP_DELAY + 20);
//     }
//   }

//   // 🧹 Clear all tags (for testing)
//   async function clearAllTags() {
//     try {
//       const items = await readIndex();
//       const cleared = items.map((i) => ({ ...i, tags: [] }));
//       await writeIndex(cleared);
//       Alert.alert('✅ Cleared Tags', 'All tags have been removed.');
//       setItems(cleared);
//     } catch (e) {
//       console.warn('clearAllTags failed', e);
//       Alert.alert('Error', 'Failed to clear tags.');
//     }
//   }

//   if (items.length === 0) {
//     return (
//       <View style={styles.empty}>
//         <Text style={styles.emptyText}>
//           {activeTags.length > 0
//             ? 'No clothes match your selected tags.'
//             : 'No clothes yet — add some to your Wardrobe.'}
//         </Text>
//         <Button theme="primary" label="Upload Clothes" onPress={() => router.push('/upload' as any)} />
//         <Button theme="secondary" label="Clear All Tags" onPress={clearAllTags} />
//       </View>
//     );
//   }

//   return (
//     <View style={{ flex: 1, backgroundColor: '#25292e' }}>
//       {/* Add a Clear All Tags button at the top */}
//       <View style={styles.topBar}>
//         <Button theme="secondary" label="Clear All Tags" onPress={clearAllTags} />
//       </View>

//       <FlatList
//         contentContainerStyle={styles.listContainer}
//         data={items}
//         keyExtractor={(i) => i.id}
//         numColumns={2}
//         renderItem={({ item }) => (
//           <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => handleTap(item)}>
//             <Image source={{ uri: item.uri }} style={styles.image} />
//             {item.tags && item.tags.length > 0 && (
//               <View style={styles.tagContainer}>
//                 {item.tags.slice(0, 2).map((tag, idx) => (
//                   <Text key={idx} style={styles.tag}>
//                     #{tag}
//                   </Text>
//                 ))}
//                 {item.tags.length > 2 && (
//                   <Text style={styles.moreTag}>+{item.tags.length - 2}</Text>
//                 )}
//               </View>
//             )}
//           </TouchableOpacity>
//         )}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   topBar: {
//     paddingTop: 10,
//     paddingHorizontal: 10,
//     backgroundColor: '#25292e',
//     alignItems: 'flex-start',
//   },
//   listContainer: { padding: 12, justifyContent: 'center' },
//   card: {
//     flex: 1,
//     margin: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     position: 'relative',
//   },
//   image: { width: 160, height: 220, borderRadius: 12 },
//   tagContainer: {
//     position: 'absolute',
//     bottom: 6,
//     left: 6,
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//   },
//   tag: {
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     color: '#fff',
//     fontSize: 12,
//     borderRadius: 6,
//     paddingHorizontal: 5,
//     paddingVertical: 2,
//     marginRight: 4,
//   },
//   moreTag: {
//     backgroundColor: 'rgba(255,255,255,0.3)',
//     color: '#fff',
//     fontSize: 12,
//     borderRadius: 6,
//     paddingHorizontal: 5,
//     paddingVertical: 2,
//   },
//   empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
//   emptyText: { color: '#fff', marginBottom: 20, textAlign: 'center', paddingHorizontal: 16 },
// });
