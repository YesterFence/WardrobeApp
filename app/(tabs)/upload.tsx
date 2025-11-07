// app/(tabs)/upload.tsx

// app/(tabs)/upload.tsx
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

import Button from '../../components/Button';
import CircleButton from '../../components/CircleButton';
import IconButton from '../../components/IconButton';
import ImageViewer from '../../components/ImageViewer';
import { addItem, addPresetTag, ensureWardrobeFolderExists, readIndex, readPresetTags, updateItem, WARDROBE_FOLDER, WardrobeItem, } from './storage';

const PlaceholderImage = require('../../assets/images/background-image.png');

export default function UploadScreen() {
  const params = useLocalSearchParams() as { uri?: string; id?: string };
  const router = useRouter();

  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [showAppOptions, setShowAppOptions] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  // Tag UI state
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [presetTags, setPresetTags] = useState<string[]>([]);
  const [selectedTagsSet, setSelectedTagsSet] = useState<Record<string, boolean>>({});
  const [newTagInput, setNewTagInput] = useState('');
  const [currentTags, setCurrentTags] = useState<string[]>([]); // tags to persist on save (lowercase normalized)

  // Prefill when navigated with ?uri=...&id=...
  useEffect(() => {
    if (params?.uri) {
      try {
        const decoded = decodeURIComponent(params.uri);
        setSelectedImage(decoded);
      } catch {
        setSelectedImage(params.uri);
      }
      // editing flow: show options immediately
      setShowAppOptions(true);
    }
    if (params?.id) {
      setEditingId(params.id);
      // also try to prefill tags from index
      (async () => {
        try {
          const idx = await readIndex();
          const it = idx.find((i) => i.id === params.id);
          if (it?.tags) {
            const normalized = (it.tags ?? []).map((t) => t.toLowerCase());
            setCurrentTags(normalized);
            const sel: Record<string, boolean> = {};
            normalized.forEach((t) => (sel[t] = true));
            setSelectedTagsSet(sel);
          }
        } catch (e) {
          console.warn('prefill tags error', e);
        }
      })();
    }
  }, [params]);

  // Pick image and immediately swap preview (no extra UI)
  const pickImageAsync = async () => {
    if (Platform.OS !== 'web') {
      const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!libPerm.granted) {
        Alert.alert('Permission needed', 'Please allow access to your photos.');
        return;
      }
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setSelectedImage(uri);
        // keep showAppOptions as-is; user will tap "Use this photo" to proceed
      } else {
        if (!selectedImage) {
          Alert.alert('No image selected', 'You did not pick a photo. Tap "Choose a photo" to try again.');
        }
      }
    } catch (err) {
      console.error('image pick error', err);
      Alert.alert('Error', 'Something went wrong picking the image.');
    }
  };

  // Use this photo: only enabled when selectedImage exists (button disabled otherwise)
  const handleUsePhotoPress = () => {
    if (!selectedImage) {
      Alert.alert('No image selected', 'Please choose a photo before using it.');
      return;
    }
    setShowAppOptions(true);
  };

  // Reset everything
  const onReset = async () => {
    try {
      await router.replace('/upload');
    } catch (err) {
      console.warn('router.replace failed:', err);
    } finally {
      setShowAppOptions(false);
      setSelectedImage(undefined);
      setEditingId(undefined);
      setCurrentTags([]);
      setSelectedTagsSet({});
    }
  };

  // Open Tag modal: load presets and pre-select current tags
  const openTagModal = async () => {
    try {
      const presets = await readPresetTags();
      setPresetTags(presets);
      // ensure selectedTagsSet reflects currentTags
      const selObj: Record<string, boolean> = {};
      (currentTags ?? []).forEach((t) => (selObj[t.toLowerCase()] = true));
      setSelectedTagsSet(selObj);
      setTagModalVisible(true);
    } catch (e) {
      console.warn('openTagModal failed', e);
      setPresetTags([]);
      setTagModalVisible(true);
    }
  };

  const toggleTag = (t: string) => {
    const key = t.toLowerCase();
    setSelectedTagsSet((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Add new preset tag and select it immediately
  const handleAddNewTag = async () => {
    const raw = newTagInput.trim();
    if (!raw) return;
    const norm = raw.toLowerCase();
    try {
      await addPresetTag(norm);
      const refreshed = await readPresetTags();
      setPresetTags(refreshed);
      setSelectedTagsSet((prev) => ({ ...prev, [norm]: true }));
      setNewTagInput('');
    } catch (e) {
      console.warn('add new tag failed', e);
    }
  };

  // Save tags from modal: if editing existing item, update the item immediately;
  // otherwise store tags in state (will be persisted on Save image)
  const saveTagsFromModal = async () => {
    const tags = Object.keys(selectedTagsSet).filter((k) => selectedTagsSet[k]).map((t) => t.toLowerCase());
    setCurrentTags(tags);
    if (editingId) {
      try {
        // read full item to preserve other fields
        const idx = await readIndex();
        const it = idx.find((i) => i.id === editingId);
        if (it) {
          const updated: WardrobeItem = { ...it, tags };
          await updateItem(updated);
          Alert.alert('Tags saved', 'Tags updated for this photo.');
        } else {
          // If item not found, create minimal entry (rare)
          const fallback: WardrobeItem = {
            id: editingId,
            uri: selectedImage ?? '',
            createdAt: Date.now(),
            tags,
          };
          await addItem(fallback);
          Alert.alert('Tags saved', 'Tags saved.');
        }
      } catch (e) {
        console.warn('save tags (edit) failed', e);
        Alert.alert('Error', 'Could not save tags to item.');
      }
    }
    setTagModalVisible(false);
  };

  // Save or update the image entry (includes currentTags)
  const onSaveImageAsync = async () => {
    if (!selectedImage) {
      Alert.alert('No image', 'Choose a photo first.');
      return;
    }

    setSaving(true);

    try {
      await ensureWardrobeFolderExists();
      const id = editingId ?? uuidv4();
      const ext = selectedImage.split('.').pop()?.split('?')[0] ?? 'jpg';
      const filename = `img_${id}.${ext}`;
      const dest = WARDROBE_FOLDER ? `${WARDROBE_FOLDER}${filename}` : '';

      let finalUri = selectedImage;

      if (dest) {
        try {
          const destInfo = await FileSystem.getInfoAsync(dest);
          if (!destInfo.exists) {
            await FileSystem.copyAsync({ from: selectedImage, to: dest });
          }
          finalUri = dest;
        } catch (copyErr) {
          if (selectedImage.startsWith('http')) {
            try {
              await FileSystem.downloadAsync(selectedImage, dest);
              finalUri = dest;
            } catch (downloadErr) {
              console.warn('downloadAsync failed', downloadErr);
              finalUri = selectedImage;
            }
          } else {
            console.warn('File copy failed, storing original uri instead', copyErr);
            finalUri = selectedImage;
          }
        }
      } else {
        finalUri = selectedImage;
      }

      const item: WardrobeItem = {
        id,
        uri: finalUri,
        createdAt: Date.now(),
        tags: currentTags.length > 0 ? currentTags : undefined,
      };

      if (editingId) {
        await updateItem(item);
        Alert.alert('Updated', 'Photo entry updated.');
      } else {
        await addItem(item);
        Alert.alert('Saved', 'Photo saved to your wardrobe.');
      }

      // navigate back to wardrobe to show the new/updated image
      router.push('/wardrobe');

      // clear local UI
      setSelectedImage(undefined);
      setShowAppOptions(false);
      setEditingId(undefined);
      setCurrentTags([]);
      setSelectedTagsSet({});
    } catch (e) {
      console.error('save error', e);
      Alert.alert('Error', "Couldn't save image — check console for details.");
    } finally {
      setSaving(false);
    }
  };

  const isPlaceholderActive = !selectedImage;

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <ImageViewer imgSource={PlaceholderImage} selectedImage={selectedImage} />
      </View>

      {/* Tag editor modal */}
      <Modal visible={tagModalVisible} transparent animationType="slide">
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.sheet}>
            <Text style={modalStyles.title}>Select tags</Text>

            <ScrollView style={{ maxHeight: 220 }} contentContainerStyle={{ paddingBottom: 12 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {presetTags.map((t) => {
                  const key = t.toLowerCase();
                  const active = !!selectedTagsSet[key];
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => toggleTag(t)}
                      style={[
                        modalStyles.chip,
                        active ? modalStyles.chipActive : modalStyles.chipInactive,
                      ]}
                    >
                      <Text style={[modalStyles.chipText, active ? modalStyles.chipTextActive : null]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={modalStyles.addRow}>
              <TextInput
                placeholder="Add new tag (e.g. linen)"
                value={newTagInput}
                onChangeText={setNewTagInput}
                style={modalStyles.input}
              />
              <TouchableOpacity onPress={handleAddNewTag} style={modalStyles.addButton}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={modalStyles.actionsRow}>
              <TouchableOpacity onPress={() => setTagModalVisible(false)} style={modalStyles.actionBtn}>
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={saveTagsFromModal} style={[modalStyles.actionBtn, { marginLeft: 12 }]}>
                <Text style={{ fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Options or footer */}
      {showAppOptions ? (
        <View style={styles.optionsContainer}>
          <View style={styles.optionsRow}>
            <IconButton icon="refresh" label="Reset" onPress={onReset} />
            <CircleButton onPress={openTagModal} />
            <IconButton icon="save-alt" label={saving ? 'Saving...' : 'Save'} onPress={onSaveImageAsync} />
          </View>
        </View>
      ) : (
        <View style={styles.footerContainer}>
          <Button theme="primary" label="Choose a photo" onPress={pickImageAsync} />
          <View style={{ height: 12 }} />
          <Button label="Use this photo" onPress={handleUsePhotoPress} disabled={!selectedImage} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#BB9457',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
  },
  footerContainer: {
    flex: 1 / 3,
    alignItems: 'center',
  },
  optionsContainer: {
    position: 'absolute',
    bottom: 80,
  },
  optionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    maxHeight: '85%',
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: '#ffd33d',
  },
  chipInactive: {
    backgroundColor: '#eee',
  },
  chipText: {
    textTransform: 'capitalize',
    color: '#333',
  },
  chipTextActive: {
    color: '#25292e',
    fontWeight: '700',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 40,
  },
  addButton: {
    marginLeft: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionBtn: {
    padding: 8,
  },
});



// import * as FileSystem from 'expo-file-system';
// import * as ImagePicker from 'expo-image-picker';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import React, { useEffect, useState } from 'react';
// import { Alert, Platform, StyleSheet, View } from 'react-native';
// import { v4 as uuidv4 } from 'uuid';

// import Button from '../../components/Button';
// import CircleButton from '../../components/CircleButton';
// import IconButton from '../../components/IconButton';
// import ImageViewer from '../../components/ImageViewer';
// import {
//   addItem,
//   ensureWardrobeFolderExists,
//   updateItem,
//   WARDROBE_FOLDER,
//   WardrobeItem,
// } from './storage';

// const PlaceholderImage = require('../../assets/images/background-image.png');

// export default function UploadScreen() {
//   const params = useLocalSearchParams() as { uri?: string; id?: string };
//   const router = useRouter();

//   const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
//   const [showAppOptions, setShowAppOptions] = useState<boolean>(false);
//   const [saving, setSaving] = useState<boolean>(false);
//   const [editingId, setEditingId] = useState<string | undefined>(undefined);

//   // If navigated with params (edit flow), prefill and show options
//   useEffect(() => {
//     if (params?.uri) {
//       try {
//         const decoded = decodeURIComponent(params.uri);
//         setSelectedImage(decoded);
//       } catch {
//         setSelectedImage(params.uri);
//       }
//       // For editing, jump straight to the options view (reset/tags/save)
//       setShowAppOptions(true);
//     }
//     if (params?.id) setEditingId(params.id);
//   }, [params]);

//   // Pick an image and swap the preview with the picked image (no extra UI)
//   const pickImageAsync = async () => {
//     if (Platform.OS !== 'web') {
//       const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (!libPerm.granted) {
//         Alert.alert('Permission needed', 'Please allow access to your photos.');
//         return;
//       }
//     }

//     try {
//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         quality: 1,
//       });

//       if (!result.canceled) {
//         const uri = result.assets[0].uri;
//         // Immediately replace the placeholder preview with the chosen photo
//         setSelectedImage(uri);
//         // Do NOT change text or show extra UI — user will tap "Use this photo" to confirm
//       } else {
//         // user cancelled — if there's no selectedImage, show a friendly message
//         if (!selectedImage) {
//           Alert.alert('No image selected', 'You did not pick a photo. Tap "Choose a photo" to try again.');
//         }
//       }
//     } catch (err) {
//       console.error('image pick error', err);
//       Alert.alert('Error', 'Something went wrong picking the image.');
//     }
//   };

//   // Use this photo: validate that a real photo is present then show app options
//   const handleUsePhotoPress = () => {
//     if (!selectedImage) {
//       Alert.alert('No image selected', 'Please choose a photo before using it.');
//       return;
//     }
//     setShowAppOptions(true);
//   };

//   // Reset selection and route params; clears UI state
//   const onReset = async () => {
//     try {
//       await router.replace('/upload');
//     } catch (err) {
//       console.warn('router.replace failed:', err);
//     } finally {
//       setShowAppOptions(false);
//       setSelectedImage(undefined);
//       setEditingId(undefined);
//     }
//   };

//   const onAddTags = () => {
//     Alert.alert('Tags', 'Tag editor will be implemented here later.');
//   };

//   // Save or update the image entry (keeps your previous logic, simplified slightly)
//   const onSaveImageAsync = async () => {
//     if (!selectedImage) {
//       Alert.alert('No image', 'Choose a photo first.');
//       return;
//     }

//     setSaving(true);
//     try {
//       await ensureWardrobeFolderExists();
//       const id = editingId ?? uuidv4();
//       const ext = selectedImage.split('.').pop()?.split('?')[0] ?? 'jpg';
//       const filename = `img_${id}.${ext}`;
//       const dest = WARDROBE_FOLDER ? `${WARDROBE_FOLDER}${filename}` : '';

//       let finalUri = selectedImage;

//       if (dest) {
//         try {
//           const destInfo = await FileSystem.getInfoAsync(dest);
//           if (!destInfo.exists) {
//             await FileSystem.copyAsync({ from: selectedImage, to: dest });
//           }
//           finalUri = dest;
//         } catch (copyErr) {
//           // fallback for ph:// and other platform quirks
//           if (selectedImage.startsWith('http')) {
//             try {
//               await FileSystem.downloadAsync(selectedImage, dest);
//               finalUri = dest;
//             } catch (downloadErr) {
//               console.warn('downloadAsync failed', downloadErr);
//               finalUri = selectedImage;
//             }
//           } else {
//             console.warn('File copy failed, storing original uri instead', copyErr);
//             finalUri = selectedImage;
//           }
//         }
//       } else {
//         finalUri = selectedImage;
//       }

//       const item: WardrobeItem = {
//         id,
//         uri: finalUri,
//         createdAt: Date.now(),
//       };

//       if (editingId) {
//         await updateItem(item);
//         Alert.alert('Updated', 'Photo entry updated.');
//       } else {
//         await addItem(item);
//         Alert.alert('Saved', 'Photo saved to your wardrobe.');
//       }

//       // return to wardrobe to show the new/updated image
//       router.push('/wardrobe');

//       // clear local UI
//       setSelectedImage(undefined);
//       setShowAppOptions(false);
//       setEditingId(undefined);
//     } catch (e) {
//       console.error('save error', e);
//       Alert.alert('Error', "Couldn't save image — check console for details.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.imageContainer}>
//         <ImageViewer imgSource={PlaceholderImage} selectedImage={selectedImage} />
//       </View>

//       {showAppOptions ? (
//         <View style={styles.optionsContainer}>
//           <View style={styles.optionsRow}>
//             <IconButton icon="refresh" label="Reset" onPress={onReset} />
//             <CircleButton onPress={onAddTags} />
//             <IconButton icon="save-alt" label={saving ? 'Saving...' : 'Save'} onPress={onSaveImageAsync} />
//           </View>
//         </View>
//       ) : (
//         <View style={styles.footerContainer}>
//           <Button theme="primary" label="Choose a photo" onPress={pickImageAsync} />
//           <View style={{ height: 12 }} />
//           <Button label="Use this photo" onPress={handleUsePhotoPress} disabled={!selectedImage} />
//           {/* <Button label="Use this photo" onPress={handleUsePhotoPress} /> */}
//         </View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#25292e',
//     alignItems: 'center',
//   },
//   imageContainer: {
//     flex: 1,
//   },
//   footerContainer: {
//     flex: 1 / 3,
//     alignItems: 'center',
//   },
//   optionsContainer: {
//     position: 'absolute',
//     bottom: 80,
//   },
//   optionsRow: {
//     alignItems: 'center',
//     flexDirection: 'row',
//   },
// });