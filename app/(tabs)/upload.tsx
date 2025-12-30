// // app/(tabs)/upload.tsx

// app/(tabs)/upload.tsx

import Button from '@/components/Button';
import CircleButton from '@/components/CircleButton';
import IconButton from '@/components/IconButton';
import ImageViewer from '@/components/ImageViewer';
import {
  addItem,
  deleteItem,
  ensureWardrobeFolderExists,
  getAllTags,
  readIndex,
  updateItem,
  WARDROBE_FOLDER,
  WardrobeItem,
} from '@/lib/storage';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const PlaceholderImage = require('@/assets/images/background-image.png');

export default function UploadScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const editId = params.id as string | undefined;

  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [showAppOptions, setShowAppOptions] = useState<boolean>(false);
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [filteredTags, setFilteredTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);
  const [showAddNewTag, setShowAddNewTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // Reset to default state
  const resetToDefault = useCallback(() => {
    setSelectedImage(undefined);
    setShowAppOptions(false);
    setCurrentTags([]);
    setIsEditMode(false);
    setEditingItem(null);
  }, []);

  // Handle focus effect - reset unless we have an editId
  useFocusEffect(
    useCallback(() => {
      if (editId) {
        loadItemForEdit(editId);
      } else {
        resetToDefault();
      }
    }, [editId, resetToDefault])
  );

  const loadItemForEdit = async (id: string) => {
    try {
      const items = await readIndex();
      const item = items.find((i) => i.id === id);
      if (item) {
        setEditingItem(item);
        setSelectedImage(item.uri);
        setCurrentTags(item.tags || []);
        setShowAppOptions(true);
        setIsEditMode(true);
      }
    } catch (e) {
      console.warn('loadItemForEdit error', e);
    }
  };

  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setShowAppOptions(true);
    } else {
      Alert.alert('No image selected', 'You did not select any image.');
    }
  };

  const takePhotoAsync = async () => {
    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPerm.granted) {
      Alert.alert('Permission needed', 'Please allow access to your camera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setShowAppOptions(true);
    }
  };

  const onReset = () => {
    resetToDefault();
    // Clear the editId from params by replacing the route
    router.replace('/upload');
  };

  const openTagModal = async () => {
    const tags = await getAllTags();
    setAllTags(tags);
    setFilteredTags(tags);
    setSearchQuery('');
    setShowTagModal(true);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredTags(allTags);
    } else {
      const query = text.toLowerCase();
      const filtered = allTags.filter(tag => tag.toLowerCase().includes(query));
      setFilteredTags(filtered);
    }
  };

  const toggleTag = (tag: string) => {
    const lower = tag.toLowerCase();
    if (currentTags.includes(lower)) {
      setCurrentTags(currentTags.filter((t) => t !== lower));
    } else {
      setCurrentTags([...currentTags, lower]);
    }
  };

  const addNewTagToPresets = async () => {
    const trimmed = newTagInput.trim().toLowerCase();
    if (!trimmed) {
      Alert.alert('Invalid Tag', 'Please enter a tag name');
      return;
    }

    try {
      const { addPresetTag } = await import('@/lib/storage');
      await addPresetTag(trimmed);
      
      const tags = await getAllTags();
      setAllTags(tags);
      setFilteredTags(tags);
      
      if (!currentTags.includes(trimmed)) {
        setCurrentTags([...currentTags, trimmed]);
      }
      
      setNewTagInput('');
      setShowAddNewTag(false);
      Alert.alert('Success', `Tag "${trimmed}" added!`);
    } catch (e) {
      Alert.alert('Error', 'Failed to add tag');
    }
  };

  const onSaveImageToWardrobe = async () => {
    if (!selectedImage) return;

    try {
      await ensureWardrobeFolderExists();

      if (isEditMode && editingItem) {
        const updatedItem: WardrobeItem = {
          ...editingItem,
          tags: currentTags,
        };
        await updateItem(updatedItem);
        
        Alert.alert('Success', 'Item updated!');
        
        // Reset and navigate
        resetToDefault();
        router.replace('/(tabs)/wardrobe');
      } else {
        const id = `img_${Date.now()}`;
        const filename = `${id}.jpg`;
        const dest = WARDROBE_FOLDER + filename;

        await FileSystem.copyAsync({
          from: selectedImage,
          to: dest,
        });

        const newItem: WardrobeItem = {
          id,
          filename,
          uri: dest,
          createdAt: Date.now(),
          tags: currentTags,
        };

        await addItem(newItem);
        
        Alert.alert('Success', 'Saved to wardrobe!');
        
        // Reset state and navigate
        resetToDefault();
        router.replace('/(tabs)/wardrobe');
      }
    } catch (e) {
      console.error('Save error:', e);
      Alert.alert('Error', `Failed to save image: ${e}`);
    }
  };

  const onDeleteItem = async () => {
    if (!isEditMode || !editingItem) return;

    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteItem(editingItem.id);
          
          Alert.alert('Deleted', 'Item removed from wardrobe');
          
          // Reset and navigate
          resetToDefault();
          router.replace('/(tabs)/wardrobe');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <ImageViewer imgSource={PlaceholderImage} selectedImage={selectedImage} />
      </View>

      {currentTags.length > 0 && (
        <View style={styles.tagDisplay}>
          {currentTags.map((tag, idx) => (
            <View key={idx} style={styles.tagPill}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {showAppOptions ? (
        <View style={styles.optionsContainer}>
          <View style={styles.optionsRow}>
            <IconButton icon="refresh" label="Reset" onPress={onReset} />
            <CircleButton onPress={openTagModal} />
            <IconButton icon="save-alt" label="Save" onPress={onSaveImageToWardrobe} />
          </View>
          {isEditMode && (
            <TouchableOpacity style={styles.deleteButton} onPress={onDeleteItem}>
              <Text style={styles.deleteText}>Delete Item</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.footerContainer}>
          <Button theme="primary" label="Choose a Photo" onPress={pickImageAsync} />
          <Button theme="primary" label="Take a Photo" onPress={takePhotoAsync} />
        </View>
      )}

      <Modal visible={showTagModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Tags</Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Search tags..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
            />

            <ScrollView style={styles.tagScroll}>
              {filteredTags.length > 0 ? (
                filteredTags.map((tag, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.tagOption, currentTags.includes(tag) && styles.tagSelected]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={styles.tagOptionText}>
                      {currentTags.includes(tag) ? '✓ ' : ''}#{tag}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noResultsText}>No tags found matching "{searchQuery}"</Text>
              )}

              {!showAddNewTag ? (
                <TouchableOpacity 
                  style={styles.addNewButton}
                  onPress={() => setShowAddNewTag(true)}
                >
                  <Text style={styles.addNewButtonText}>+ Add New Tag</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.newTagContainer}>
                  <TextInput
                    style={styles.newTagInput}
                    placeholder="Enter new tag name..."
                    placeholderTextColor="#999"
                    value={newTagInput}
                    onChangeText={setNewTagInput}
                    onSubmitEditing={addNewTagToPresets}
                    autoCapitalize="none"
                    autoFocus
                  />
                  <View style={styles.newTagButtons}>
                    <TouchableOpacity 
                      style={styles.cancelButton}
                      onPress={() => {
                        setShowAddNewTag(false);
                        setNewTagInput('');
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.confirmButton}
                      onPress={addNewTagToPresets}
                    >
                      <Text style={styles.confirmButtonText}>Add Tag</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => {
                setShowTagModal(false);
                setShowAddNewTag(false);
                setNewTagInput('');
              }}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#BB9457', alignItems: 'center' },
  imageContainer: { flex: 1, paddingTop: 20 },
  tagDisplay: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, paddingBottom: 10 },
  tagPill: { backgroundColor: '#432818', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 8 },
  tagText: { color: '#FFE6A7', fontSize: 14, fontWeight: '600' },
  footerContainer: { flex: 1 / 3, alignItems: 'center', justifyContent: 'center' },
  optionsContainer: { position: 'absolute', bottom: 80, alignItems: 'center' },
  optionsRow: { alignItems: 'center', flexDirection: 'row' },
  deleteButton: { marginTop: 20, backgroundColor: '#d32f2f', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  deleteText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', maxHeight: '75%', backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  searchInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 12, backgroundColor: '#f5f5f5' },
  tagScroll: { maxHeight: 320 },
  tagOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tagSelected: { backgroundColor: '#FFE6A7' },
  tagOptionText: { fontSize: 16 },
  noResultsText: { padding: 20, textAlign: 'center', color: '#999', fontStyle: 'italic' },
  addNewButton: { padding: 16, backgroundColor: '#432818', marginVertical: 12, borderRadius: 8, alignItems: 'center' },
  addNewButtonText: { color: '#FFE6A7', fontSize: 16, fontWeight: '600' },
  newTagContainer: { padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8, marginVertical: 8 },
  newTagInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#fff', marginBottom: 12 },
  newTagButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelButton: { flex: 1, padding: 10, backgroundColor: '#999', borderRadius: 8, marginRight: 8, alignItems: 'center' },
  cancelButtonText: { color: '#fff', fontWeight: '600' },
  confirmButton: { flex: 1, padding: 10, backgroundColor: '#432818', borderRadius: 8, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontWeight: '600' },
  doneButton: { backgroundColor: '#432818', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  doneButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

// import Button from '@/components/Button';
// import CircleButton from '@/components/CircleButton';
// import IconButton from '@/components/IconButton';
// import ImageViewer from '@/components/ImageViewer';
// import {
//   addItem,
//   deleteItem,
//   ensureWardrobeFolderExists,
//   getAllTags,
//   readIndex,
//   updateItem,
//   WARDROBE_FOLDER,
//   WardrobeItem,
// } from '@/lib/storage';
// import { Ionicons } from "@expo/vector-icons";
// import { useFocusEffect } from '@react-navigation/native';
// import * as FileSystem from 'expo-file-system/legacy';
// import * as ImagePicker from 'expo-image-picker';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import { useCallback, useState } from 'react';
// import {
//   Alert,
//   Modal,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from 'react-native';

// const PlaceholderImage = require('@/assets/images/background-image.png');

// export default function UploadScreen() {
//   const router = useRouter();
//   const params = useLocalSearchParams();
//   const editId = params.id as string | undefined;

//   const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
//   const [showAppOptions, setShowAppOptions] = useState<boolean>(false);
//   const [currentTags, setCurrentTags] = useState<string[]>([]);
//   const [showTagModal, setShowTagModal] = useState(false);
//   const [allTags, setAllTags] = useState<string[]>([]);
//   const [filteredTags, setFilteredTags] = useState<string[]>([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);
//   const [showAddNewTag, setShowAddNewTag] = useState(false);
//   const [newTagInput, setNewTagInput] = useState('');

//   // Reset to default state
//   const resetToDefault = useCallback(() => {
//     setSelectedImage(undefined);
//     setShowAppOptions(false);
//     setCurrentTags([]);
//     setIsEditMode(false);
//     setEditingItem(null);
//   }, []);

//   // Handle focus effect - reset unless we have an editId
//   useFocusEffect(
//     useCallback(() => {
//       if (editId) {
//         loadItemForEdit(editId);
//       } else {
//         resetToDefault();
//       }
//     }, [editId, resetToDefault])
//   );

//   const loadItemForEdit = async (id: string) => {
//     try {
//       const items = await readIndex();
//       const item = items.find((i) => i.id === id);
//       if (item) {
//         setEditingItem(item);
//         setSelectedImage(item.uri);
//         setCurrentTags(item.tags || []);
//         setShowAppOptions(true);
//         setIsEditMode(true);
//       }
//     } catch (e) {
//       console.warn('loadItemForEdit error', e);
//     }
//   };

//   const pickImageAsync = async () => {
//     let result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ['images'],
//       allowsEditing: true,
//       aspect: [1, 1],
//       quality: 1,
//     });

//     if (!result.canceled) {
//       setSelectedImage(result.assets[0].uri);
//       setShowAppOptions(true);
//     } else {
//       Alert.alert('No image selected', 'You did not select any image.');
//     }
//   };

//   const takePhotoAsync = async () => {
//     const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
//     if (!cameraPerm.granted) {
//       Alert.alert('Permission needed', 'Please allow access to your camera.');
//       return;
//     }

//     const result = await ImagePicker.launchCameraAsync({
//       allowsEditing: true,
//       aspect: [1, 1],
//       quality: 1,
//     });

//     if (!result.canceled) {
//       setSelectedImage(result.assets[0].uri);
//       setShowAppOptions(true);
//     }
//   };

//   const onReset = () => {
//     resetToDefault();
//     // Clear the editId from params by replacing the route
//     router.replace('/upload');
//   };

//   const openTagModal = async () => {
//     const tags = await getAllTags();
//     setAllTags(tags);
//     setFilteredTags(tags);
//     setSearchQuery('');
//     setShowTagModal(true);
//   };

//   const handleSearchChange = (text: string) => {
//     setSearchQuery(text);
//     if (text.trim() === '') {
//       setFilteredTags(allTags);
//     } else {
//       const query = text.toLowerCase();
//       const filtered = allTags.filter(tag => tag.toLowerCase().includes(query));
//       setFilteredTags(filtered);
//     }
//   };

//   const toggleTag = (tag: string) => {
//     const lower = tag.toLowerCase();
//     if (currentTags.includes(lower)) {
//       setCurrentTags(currentTags.filter((t) => t !== lower));
//     } else {
//       setCurrentTags([...currentTags, lower]);
//     }
//   };

//   const addNewTagToPresets = async () => {
//     const trimmed = newTagInput.trim().toLowerCase();
//     if (!trimmed) {
//       Alert.alert('Invalid Tag', 'Please enter a tag name');
//       return;
//     }

//     try {
//       const { addPresetTag } = await import('@/lib/storage');
//       await addPresetTag(trimmed);
      
//       const tags = await getAllTags();
//       setAllTags(tags);
//       setFilteredTags(tags);
      
//       if (!currentTags.includes(trimmed)) {
//         setCurrentTags([...currentTags, trimmed]);
//       }
      
//       setNewTagInput('');
//       setShowAddNewTag(false);
//       Alert.alert('Success', `Tag "${trimmed}" added!`);
//     } catch (e) {
//       Alert.alert('Error', 'Failed to add tag');
//     }
//   };

//   const onSaveImageToWardrobe = async () => {
//     if (!selectedImage) return;

//     try {
//       await ensureWardrobeFolderExists();

//       if (isEditMode && editingItem) {
//         const updatedItem: WardrobeItem = {
//           ...editingItem,
//           tags: currentTags,
//         };
//         await updateItem(updatedItem);
        
//         // Reset and clear editId
//         resetToDefault();
//         router.replace('/upload');
        
//         Alert.alert('Success', 'Item updated!');
//         router.push('/wardrobe' as any);
//       } else {
//         const id = `img_${Date.now()}`;
//         const filename = `${id}.jpg`;
//         const dest = WARDROBE_FOLDER + filename;

//         await FileSystem.copyAsync({
//           from: selectedImage,
//           to: dest,
//         });

//         const newItem: WardrobeItem = {
//           id,
//           filename,
//           uri: dest,
//           createdAt: Date.now(),
//           tags: currentTags,
//         };

//         await addItem(newItem);
        
//         // Reset state and clear route
//         resetToDefault();
//         router.replace('/upload');
        
//         Alert.alert('Success', 'Saved to wardrobe!');
//         router.push('/wardrobe' as any);
//       }
//     } catch (e) {
//       console.error('Save error:', e);
//       Alert.alert('Error', `Failed to save image: ${e}`);
//     }
//   };

//   const onDeleteItem = async () => {
//     if (!isEditMode || !editingItem) return;

//     Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Delete',
//         style: 'destructive',
//         onPress: async () => {
//           await deleteItem(editingItem.id);
          
//           // Reset and clear editId
//           resetToDefault();
//           router.replace('/upload');
          
//           // Alert.alert('Deleted', 'Item removed from wardrobe');
//           router.push('/wardrobe' as any);
//         },
//       },
//     ]);
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.imageContainer}>
//         <ImageViewer imgSource={PlaceholderImage} selectedImage={selectedImage} />
//       </View>

//       {currentTags.length > 0 && (
//         <View style={styles.tagDisplay}>
//           {currentTags.map((tag, idx) => (
//             <View key={idx} style={styles.tagPill}>
//               <Text style={styles.tagText}>#{tag}</Text>
//             </View>
//           ))}
//         </View>
//       )}

//       {showAppOptions ? (
//         <View style={styles.optionsContainer}>
//           <View style={styles.optionsRow}>
//             <IconButton icon="refresh" label="Reset" onPress={onReset} />
//             <CircleButton onPress={openTagModal} />
//             <IconButton icon="save-alt" label="Save" onPress={onSaveImageToWardrobe} />
//           </View>
//           {isEditMode && (
//             <TouchableOpacity style={styles.deleteButton} onPress={onDeleteItem}>
//               <Text style={styles.deleteText}>Delete Item</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       ) : (

//         <View style={styles.footerContainer}>
//           <Button
//             theme="primary"
//             label="Take a Photo"
//             onPress={takePhotoAsync}
//             icon={<Ionicons name="camera-outline" size={20} color="#25292e" />}
//           />

//           <Button
//             theme="primary"
//             label="Choose a Photo"
//             onPress={pickImageAsync}
//             icon={<Ionicons name="folder-outline" size={20} color="#25292e" />}
//           />
//         </View>
//         // <View style={styles.footerContainer}>
//         //   <Button theme="primary" label="Take a Photo" onPress={takePhotoAsync} />
//         //   <Button theme="primary" label="Choose a Photo" onPress={pickImageAsync} />
//         // </View>
//       )}

//       <Modal visible={showTagModal} animationType="slide" transparent={true}>
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Select Tags</Text>

//             <TextInput
//               style={styles.searchInput}
//               placeholder="Search tags..."
//               placeholderTextColor="#999"
//               value={searchQuery}
//               onChangeText={handleSearchChange}
//               autoCapitalize="none"
//             />

//             <ScrollView style={styles.tagScroll}>
//               {filteredTags.length > 0 ? (
//                 filteredTags.map((tag, idx) => (
//                   <TouchableOpacity
//                     key={idx}
//                     style={[styles.tagOption, currentTags.includes(tag) && styles.tagSelected]}
//                     onPress={() => toggleTag(tag)}
//                   >
//                     <Text style={styles.tagOptionText}>
//                       {currentTags.includes(tag) ? '✓ ' : ''}#{tag}
//                     </Text>
//                   </TouchableOpacity>
//                 ))
//               ) : (
//                 <Text style={styles.noResultsText}>No tags found matching "{searchQuery}"</Text>
//               )}

//               {!showAddNewTag ? (
//                 <TouchableOpacity 
//                   style={styles.addNewButton}
//                   onPress={() => setShowAddNewTag(true)}
//                 >
//                   <Text style={styles.addNewButtonText}>+ Add New Tag</Text>
//                 </TouchableOpacity>
//               ) : (
//                 <View style={styles.newTagContainer}>
//                   <TextInput
//                     style={styles.newTagInput}
//                     placeholder="Enter new tag name..."
//                     placeholderTextColor="#999"
//                     value={newTagInput}
//                     onChangeText={setNewTagInput}
//                     onSubmitEditing={addNewTagToPresets}
//                     autoCapitalize="none"
//                     autoFocus
//                   />
//                   <View style={styles.newTagButtons}>
//                     <TouchableOpacity 
//                       style={styles.cancelButton}
//                       onPress={() => {
//                         setShowAddNewTag(false);
//                         setNewTagInput('');
//                       }}
//                     >
//                       <Text style={styles.cancelButtonText}>Cancel</Text>
//                     </TouchableOpacity>
//                     <TouchableOpacity 
//                       style={styles.confirmButton}
//                       onPress={addNewTagToPresets}
//                     >
//                       <Text style={styles.confirmButtonText}>Add Tag</Text>
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               )}
//             </ScrollView>

//             <TouchableOpacity
//               style={styles.doneButton}
//               onPress={() => {
//                 setShowTagModal(false);
//                 setShowAddNewTag(false);
//                 setNewTagInput('');
//               }}
//             >
//               <Text style={styles.doneButtonText}>Done</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#BB9457', alignItems: 'center' },
//   imageContainer: { flex: 1, padding: 20 },
//   tagDisplay: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, paddingBottom: 10 },
//   tagPill: { backgroundColor: '#432818', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 8 },
//   tagText: { color: '#FFE6A7', fontSize: 14, fontWeight: '600' },
//   footerContainer: { flex: 1 / 3, alignItems: 'center', justifyContent: 'center' },
//   optionsContainer: { position: 'absolute', bottom: 80, alignItems: 'center' },
//   optionsRow: { alignItems: 'center', flexDirection: 'row' },
//   deleteButton: { marginTop: 20, backgroundColor: '#d32f2f', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
//   deleteText: { color: '#fff', fontWeight: '600', fontSize: 16 },
//   modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', },
//   modalContent: { width: '85%', maxHeight: '75%', backgroundColor: '#fff', borderRadius: 12, padding: 20 },
//   modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
//   searchInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 12, backgroundColor: '#f5f5f5' },
//   tagScroll: { maxHeight: 320 },
//   tagOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
//   tagSelected: { backgroundColor: '#FFE6A7' },
//   tagOptionText: { fontSize: 16 },
//   noResultsText: { padding: 20, textAlign: 'center', color: '#999', fontStyle: 'italic' },
//   addNewButton: { padding: 16, backgroundColor: '#432818', marginVertical: 12, borderRadius: 8, alignItems: 'center' },
//   addNewButtonText: { color: '#FFE6A7', fontSize: 16, fontWeight: '600' },
//   newTagContainer: { padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8, marginVertical: 8 },
//   newTagInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#fff', marginBottom: 12 },
//   newTagButtons: { flexDirection: 'row', justifyContent: 'space-between' },
//   cancelButton: { flex: 1, padding: 10, backgroundColor: '#999', borderRadius: 8, marginRight: 8, alignItems: 'center' },
//   cancelButtonText: { color: '#fff', fontWeight: '600' },
//   confirmButton: { flex: 1, padding: 10, backgroundColor: '#432818', borderRadius: 8, alignItems: 'center' },
//   confirmButtonText: { color: '#fff', fontWeight: '600' },
//   doneButton: { backgroundColor: '#432818', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
//   doneButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
// });