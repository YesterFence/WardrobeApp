// app/(tabs)/wardrobe.tsx

import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../../components/Button';
import { ensureWardrobeFolderExists, listFilesInFolder, readIndex, WardrobeItem } from './storage';

export default function WardrobeScreen() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const router = useRouter();
  const lastTapRef = useRef<number | null>(null);
  const DOUBLE_TAP_DELAY = 300; // ms

  const loadItems = async () => {
    await ensureWardrobeFolderExists();
    const idx = await readIndex();
    if (idx.length === 0) {
      const files = await listFilesInFolder();
      if (files.length > 0) {
        const built = files.map((f) => ({ id: f, uri: f, createdAt: Date.now() }));
        setItems(built);
        return;
      }
    }
    setItems(idx);
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
      // not double yet, store time
      lastTapRef.current = now;
      // optional: reset the timer after delay
      setTimeout(() => {
        lastTapRef.current = null;
      }, DOUBLE_TAP_DELAY + 20);
    }
  }

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No clothes yet — add some to your Wardrobe.</Text>
        <Button theme="primary" label="Upload Clothes" onPress={() => router.push('/upload' as any)} />
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
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: { padding: 12, justifyContent: 'center' },
  card: { flex: 1, margin: 8, alignItems: 'center', justifyContent: 'center' },
  image: { width: 160, height: 220, borderRadius: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#fff', marginBottom: 20 },
});


// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useFocusEffect } from '@react-navigation/native';
// import { Asset } from 'expo-asset';
// import { Image } from 'expo-image';
// import React, { useCallback, useEffect, useState } from 'react';
// import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

// // <-- Import the static images list you created -->
// // If you don't yet have assets/Other/images.ts, use a safe fallback so the app compiles.
// // To seed real images later, create assets/Other/images.ts and export an array of require(...) modules:
// //   export const OTHER_IMAGES = [ require('../../Other/img1.png'), require('../../Other/img2.png') ];
// const OTHER_IMAGES: number[] = [];

// type WardrobeImage = { id: string; uri: string; tags: string[]; createdAt: string };
// const STORAGE_KEY = 'WARDROBE_IMAGES';

// export default function WardrobeScreen() {
//   const [items, setItems] = useState<WardrobeImage[]>([]);
//   const [editing, setEditing] = useState<WardrobeImage | null>(null);
//   const [editTagsText, setEditTagsText] = useState('');

//   const loadItems = async () => {
//     try {
//       const raw = await AsyncStorage.getItem(STORAGE_KEY);
//       if (raw) {
//         console.log('[Wardrobe] loadItems -> found', JSON.parse(raw));
//         setItems(JSON.parse(raw));
//       } else {
//         console.log('[Wardrobe] loadItems -> none found');
//         setItems([]);
//       }
//     } catch (e) {
//       console.error('[Wardrobe] loadItems error', e);
//       Alert.alert('Load error', String(e));
//     }
//   };

//   useFocusEffect(
//     useCallback(() => {
//       loadItems();
//     }, [])
//   );

//   useEffect(() => {
//     loadItems();
//   }, []);

//   // Seed using the static list in assets/Other/images.ts
//   const seedDemoImages = async () => {
//     try {
//       if (!OTHER_IMAGES || OTHER_IMAGES.length === 0) {
//         Alert.alert('No images found in OTHER_IMAGES. Check assets/Other/images.ts and filenames.');
//         console.warn('[Wardrobe] OTHER_IMAGES empty or missing.');
//         return;
//       }

//       console.log('[Wardrobe] seedDemoImages loading assets:', OTHER_IMAGES);
//       await Asset.loadAsync(OTHER_IMAGES);

//       // inside seedDemoImages when mapping:
//         const seeded: WardrobeImage[] = OTHER_IMAGES.map((mod: number, i: number) => {
//         const asset = Asset.fromModule(mod as any);
//         console.log(`[Wardrobe] asset ${i} uri:`, asset.uri);
//         return {
//           id: `seed_${Date.now()}_${i}`,
//           uri: asset.uri,
//           tags: ['seed'],
//           createdAt: new Date().toISOString(),
//         } as WardrobeImage;
//       });


//       await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
//       console.log('[Wardrobe] seedDemoImages -> saved metadata', seeded);
//       await loadItems();
//       Alert.alert('Seeded demo images — check the wardrobe now.');
//     } catch (e) {
//       console.error('[Wardrobe] seedDemoImages error', e);
//       Alert.alert('Seed failed: ' + (e instanceof Error ? e.message : String(e)));
//     }
//   };

//   const openEditor = (item: WardrobeImage) => {
//     setEditing(item);
//     setEditTagsText(item.tags ? item.tags.join(', ') : '');
//   };

//   const saveEdits = async () => {
//     if (!editing) return;
//     try {
//       const newTags = editTagsText.split(',').map(t => t.trim()).filter(Boolean);
//       const raw = await AsyncStorage.getItem(STORAGE_KEY);
//       let arr: WardrobeImage[] = raw ? JSON.parse(raw) : items;
//       arr = arr.map(it => (it.uri === editing.uri ? { ...it, tags: newTags } : it));
//       await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
//       setItems(arr);
//       setEditing(null);
//       Alert.alert('Saved tags');
//     } catch (e) {
//       console.error('[Wardrobe] saveEdits error', e);
//       Alert.alert('Save failed', String(e));
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
//         <Text style={{ color: '#fff', fontSize: 18 }}>Wardrobe</Text>
//         <View style={{ flexDirection: 'row' }}>
//           <Pressable
//             onPress={async () => {
//               await seedDemoImages();
//             }}
//             style={{ padding: 6, marginRight: 8 }}>
//             <Text style={{ color: '#ffd33d' }}>Seed demo images</Text>
//           </Pressable>

//           <Pressable onPress={loadItems} style={{ padding: 6 }}>
//             <Text style={{ color: '#ffd33d' }}>Refresh</Text>
//           </Pressable>
//         </View>
//       </View>

//       <FlatList
//         data={items}
//         keyExtractor={i => i.id}
//         numColumns={2}
//         ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 24 }}>No items — press “Seed demo images”</Text>}
//         renderItem={({ item }) => (
//           <Pressable style={styles.card} onPress={() => openEditor(item)}>
//             <Image source={{ uri: item.uri }} style={styles.image} />
//             <Text style={styles.tagText}>{item.tags?.slice(0, 3).join(', ')}</Text>
//             <Text style={{ color: '#aaa', fontSize: 10 }}>{item.uri.split('/').pop()}</Text>
//           </Pressable>
//         )}
//       />

//       <Modal visible={!!editing} animationType="slide" onRequestClose={() => setEditing(null)}>
//         <View style={styles.modal}>
//           <Text style={{ color: '#fff', marginBottom: 8 }}>Edit tags (comma-separated)</Text>
//           <TextInput style={styles.input} value={editTagsText} onChangeText={setEditTagsText} />
//           <View style={{ flexDirection: 'row', marginTop: 12 }}>
//             <Pressable style={styles.button} onPress={() => setEditing(null)}>
//               <Text style={{ color: '#fff' }}>Cancel</Text>
//             </Pressable>
//             <Pressable style={[styles.button, styles.saveButton]} onPress={saveEdits}>
//               <Text style={{ color: '#111', fontWeight: 'bold' }}>Save</Text>
//             </Pressable>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#25292e', padding: 8 },
//   card: { margin: 6, width: '47%', alignItems: 'center' },
//   image: { width: '100%', height: 180, borderRadius: 12, backgroundColor: '#333' },
//   tagText: { color: '#fff', marginTop: 6 },
//   modal: { flex: 1, backgroundColor: '#111', padding: 16 },
//   input: { backgroundColor: '#222', color: '#fff', padding: 8, borderRadius: 8 },
//   button: { padding: 12, backgroundColor: '#333', borderRadius: 8, marginRight: 8, alignItems: 'center', flex: 1 },
//   saveButton: { backgroundColor: '#ffd33d' },
// });




// wardrobe.tsx
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useFocusEffect } from '@react-navigation/native';
// import * as FileSystem from 'expo-file-system/legacy'; // legacy import
// import { Image } from 'expo-image';
// import React, { useCallback, useEffect, useState } from 'react';
// import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

// type WardrobeImage = { id: string; uri: string; tags: string[]; createdAt: string };

// const STORAGE_KEY = 'WARDROBE_IMAGES';
// const DOC_DIR = (FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory ?? '';
// const APP_DIR = `${DOC_DIR}wardrobe_images/`;

// export default function WardrobeScreen() {
//   const [items, setItems] = useState<WardrobeImage[]>([]);
//   const [editing, setEditing] = useState<WardrobeImage | null>(null);
//   const [editTagsText, setEditTagsText] = useState('');

//   const loadItems = async () => {
//     try {
//       const raw = await AsyncStorage.getItem(STORAGE_KEY);
//       if (raw) {
//         setItems(JSON.parse(raw));
//         return;
//       }

//       // If no metadata found, try to list files in the app dir (file-explorer fallback)
//       try {
//         const dirInfo = await FileSystem.getInfoAsync(APP_DIR);
//         if (dirInfo.exists) {
//           const files = await FileSystem.readDirectoryAsync(APP_DIR);
//           const list = files.map(f => ({
//             id: `file_${f}`,
//             uri: `${APP_DIR}${f}`,
//             tags: [],
//             createdAt: '',
//           }));
//           setItems(list);
//           return;
//         }
//       } catch (e) {
//         console.warn('Could not read app dir', e);
//       }

//       setItems([]);
//     } catch (e) {
//       console.error('loadItems error', e);
//     }
//   };

//   useFocusEffect(
//     useCallback(() => {
//       loadItems();
//     }, [])
//   );

//   useEffect(() => {
//     loadItems();
//   }, []);

//   const openEditor = (item: WardrobeImage) => {
//     setEditing(item);
//     setEditTagsText(item.tags ? item.tags.join(', ') : '');
//   };

//   const saveEdits = async () => {
//     if (!editing) return;
//     const newTags = editTagsText.split(',').map(t => t.trim()).filter(Boolean);
//     // if items came from the directory fallback they may not have IDs matching AsyncStorage metadata.
//     // We'll attempt to update metadata list if present; otherwise update in-memory and save metadata.
//     const raw = await AsyncStorage.getItem(STORAGE_KEY);
//     let arr: WardrobeImage[] = raw ? JSON.parse(raw) : items;
//     arr = arr.map(it => (it.uri === editing.uri ? { ...it, tags: newTags } : it));
//     await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
//     setItems(arr);
//     setEditing(null);
//     Alert.alert('Saved tags');
//   };

//   return (
//     <View style={styles.container}>
//       <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
//         <Text style={{ color: '#fff', fontSize: 18 }}>Wardrobe</Text>
//         <Pressable onPress={loadItems} style={{ padding: 6 }}>
//           <Text style={{ color: '#ffd33d' }}>Refresh</Text>
//         </Pressable>
//       </View>

//       <FlatList
//         data={items}
//         keyExtractor={i => i.id}
//         numColumns={2}
//         renderItem={({ item }) => (
//           <Pressable style={styles.card} onPress={() => openEditor(item)}>
//             <Image source={{ uri: item.uri }} style={styles.image} />
//             <Text style={styles.tagText}>{item.tags?.slice(0, 3).join(', ')}</Text>
//             <Text style={{ color: '#aaa', fontSize: 10 }}>{item.uri.split('/').pop()}</Text>
//           </Pressable>
//         )}
//       />

//       <Modal visible={!!editing} animationType="slide" onRequestClose={() => setEditing(null)}>
//         <View style={styles.modal}>
//           <Text style={{ color: '#fff', marginBottom: 8 }}>Edit tags (comma-separated)</Text>
//           <TextInput style={styles.input} value={editTagsText} onChangeText={setEditTagsText} />
//           <View style={{ flexDirection: 'row', marginTop: 12 }}>
//             <Pressable style={styles.button} onPress={() => setEditing(null)}>
//               <Text style={{ color: '#fff' }}>Cancel</Text>
//             </Pressable>
//             <Pressable style={[styles.button, styles.saveButton]} onPress={saveEdits}>
//               <Text style={{ color: '#111', fontWeight: 'bold' }}>Save</Text>
//             </Pressable>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#25292e', padding: 8 },
//   card: { margin: 6, width: '47%', alignItems: 'center' },
//   image: { width: '100%', height: 180, borderRadius: 12, backgroundColor: '#333' },
//   tagText: { color: '#fff', marginTop: 6 },
//   modal: { flex: 1, backgroundColor: '#111', padding: 16 },
//   input: { backgroundColor: '#222', color: '#fff', padding: 8, borderRadius: 8 },
//   button: { padding: 12, backgroundColor: '#333', borderRadius: 8, marginRight: 8, alignItems: 'center', flex: 1 },
//   saveButton: { backgroundColor: '#ffd33d' },
// });