// app/(tabs)/upload.tsx

// app/(tabs)/upload.tsx
/**
 * Upload screen (updated behavior)
 *
 * Behavior:
 * - "Choose a photo" replaces the placeholder with the picked image but DOES NOT open options.
 * - "Use this photo" shows the options row (Reset / Add Tags / Save) if an image is selected.
 * - If this screen was reached with ?uri=... (double-tap from Wardrobe), we preload the image
 *   and immediately show options so the user can edit/save.
 * - Reset clears route params (router.replace('/upload')) so the preloaded URI won't reappear.
 *
 * Notes:
 * - Make sure you added 'react-native-get-random-values' in app entry if using uuid.
 * - storage.ts should export addItem, updateItem, ensureWardrobeFolderExists, WARDROBE_FOLDER, WardrobeItem.
 */

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

// import { addItem, ensureWardrobeFolderExists, updateItem, WARDROBE_FOLDER, WardrobeItem, } from './storage';

// const PlaceholderImage = require('../../assets/images/background-image.png');

// export default function Index() {
//   // Read URL query params (if any) AND router for navigation/replace
//   const params = useLocalSearchParams() as { uri?: string; id?: string };
//   const router = useRouter();

//   // UI state
//   const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
//   const [showAppOptions, setShowAppOptions] = useState<boolean>(false);
//   const [saving, setSaving] = useState<boolean>(false);
//   const [editingId, setEditingId] = useState<string | undefined>(undefined);

//   // If we were navigated here with params (double-tap from Wardrobe),
//   // prefill and show options immediately. However, if the user already
//   // manually selected an image (selectedImage !== undefined), don't override it.
//   useEffect(() => {
//     if (params?.uri && !selectedImage) {
//       try {
//         const decoded = decodeURIComponent(params.uri);
//         setSelectedImage(decoded);
//       } catch {
//         setSelectedImage(params.uri);
//       }
//       setShowAppOptions(true); // editing flow for images from wardrobe
//     }
//     if (params?.id) {
//       setEditingId(params.id);
//     }
//     // We intentionally do not clear params here; Reset will clear them explicitly.
//   }, [params]);

//   // 1) Choose photo: replace the placeholder with the chosen photo
//   //    but DO NOT immediately show the options row.
//   const pickImageAsync = async () => {
//     // Request permissions on native platforms
//     if (Platform.OS !== 'web') {
//       const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (!libPerm.granted) {
//         Alert.alert('Permission needed', 'Please allow access to your photos.');
//         return;
//       }
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       quality: 1,
//     });

//     if (!result.canceled) {
//       const uri = result.assets[0].uri;
//       // Replace the default placeholder image with the picked photo
//       // but DO NOT show the options yet — user must press "Use this photo"
//       setSelectedImage(uri);
//       setShowAppOptions(false); // ensure options remain hidden until user presses Use this photo
//       setEditingId(undefined); // this is a new selection (not editing an existing item)
//     } else {
//       Alert.alert('No image selected', 'You did not select any image.');
//     }
//   };

//   // Reset must clear any route params (so preloaded image doesn't reappear),
//   // then clear local UI state.
//   const onReset = async () => {
//     try {
//       // Replace the route with the same path but no query params, clearing useLocalSearchParams
//       // This avoids the flicker where useEffect repopulates the image from params.
//       await router.replace('/upload');
//     } catch (err) {
//       console.warn('router.replace failed:', err);
//     } finally {
//       // Clear local UI state after replacing route
//       setShowAppOptions(false);
//       setSelectedImage(undefined);
//       setEditingId(undefined);
//     }
//   };

//   // Placeholder for tag editor UI — we'll implement later
//   const onAddTags = () => {
//     Alert.alert('Tags', 'Tag editor will be implemented here later.');
//   };

//   // Save (or update) the image entry to AsyncStorage index and copy into app folder when possible
//   const onSaveImageAsync = async () => {
//     if (!selectedImage) {
//       Alert.alert('No image', 'Choose a photo first.');
//       return;
//     }

//     setSaving(true);

//     try {
//       // Ensure folder exists (mobile)
//       await ensureWardrobeFolderExists();

//       // Use uuid for unique ids when creating new entries
//       const id = editingId ?? uuidv4();
//       const ext = selectedImage.split('.').pop()?.split('?')[0] ?? 'jpg';
//       const filename = `img_${id}.${ext}`;
//       const dest = WARDROBE_FOLDER ? `${WARDROBE_FOLDER}${filename}` : '';

//       let finalUri = selectedImage;

//       if (dest) {
//         try {
//           // Try to copy local file (works on mobile)
//           await FileSystem.copyAsync({ from: selectedImage, to: dest });
//           finalUri = dest;
//         } catch (copyErr) {
//           // If copy fails, attempt to download remote http(s) URIs, otherwise keep original URI
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
//         // On web, write to documentDirectory may not be available — keep original URI
//         finalUri = selectedImage;
//       }

//       const item: WardrobeItem = {
//         id,
//         uri: finalUri,
//         createdAt: Date.now(),
//       };

//       if (editingId) {
//         // update existing entry (updateItem must be implemented in storage)
//         await updateItem(item);
//         Alert.alert('Updated', 'Photo entry updated.');
//       } else {
//         // add new entry
//         await addItem(item);
//         Alert.alert('Saved', 'Photo saved to your wardrobe.');
//       }

//       // Navigate back to wardrobe so the user sees the list refreshed
//       router.push('/wardrobe');

//       // Clear selection after saving
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
//         {/* Show the currently selected image, or the placeholder asset */}
//         <ImageViewer imgSource={PlaceholderImage} selectedImage={selectedImage} />
//       </View>

//       {showAppOptions ? (
//         // Options row: Reset / Add Tags / Save
//         <View style={styles.optionsContainer}>
//           <View style={styles.optionsRow}>
//             <IconButton icon="refresh" label="Reset" onPress={onReset} />
//             <CircleButton onPress={onAddTags} />
//             <IconButton icon="save-alt" label={saving ? 'Saving...' : 'Save'} onPress={onSaveImageAsync} />
//           </View>
//         </View>
//       ) : (
//         // Footer: Choose a photo and Use this photo (Use shows the options if an image is selected)
//         <View style={styles.footerContainer}>
//           <Button theme="primary" label="Choose a photo" onPress={pickImageAsync} />
//           <View style={{ height: 12 }} />
//           <Button
//             label="Use this photo"
//             onPress={() => {
//               if (!selectedImage) {
//                 // If no image selected, prompt the user to pick one
//                 Alert.alert('No image chosen', 'Please choose a photo first.');
//                 return;
//               }
//               // Show the options row — user intentionally wants to work with this image
//               setShowAppOptions(true);
//             }}
//           />
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


import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { v4 as uuidv4 } from 'uuid'; // you said you installed uuid

import Button from '../../components/Button';
import CircleButton from '../../components/CircleButton';
import IconButton from '../../components/IconButton';
import ImageViewer from '../../components/ImageViewer';
import { addItem, ensureWardrobeFolderExists, updateItem, WARDROBE_FOLDER, WardrobeItem, } from './storage';

const PlaceholderImage = require('../../assets/images/background-image.png');

export default function Index() {
  // Read local route params (if any). Example: /upload?uri=...&id=...
  const params = useLocalSearchParams() as { uri?: string; id?: string };
  const router = useRouter();

  // UI state
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [showAppOptions, setShowAppOptions] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  // If we were navigated here with params (from double-tap), prefill the image and editingId
  useEffect(() => {
    if (params?.uri) {
      // Try decodeURIComponent in case the uri was encoded when navigating
      try {
        const decoded = decodeURIComponent(params.uri);
        setSelectedImage(decoded);
      } catch {
        setSelectedImage(params.uri);
      }
      setShowAppOptions(true); // show options immediately to let user save/add tags/etc.
    }
    if (params?.id) {
      setEditingId(params.id);
    }
  }, [params]);

  // Open image picker and set selected image
  const pickImageAsync = async () => {
    // Ask for permissions on native platforms
    if (Platform.OS !== 'web') {
      const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!libPerm.granted) {
        Alert.alert('Permission needed', 'Please allow access to your photos.');
        return;
      }
    }

    // Launch the image library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
      setShowAppOptions(true);
    } else {
      Alert.alert('No image selected', 'You did not select any image.');
    }
  };

  // Reset the upload UI (clear selection / editing state)
  const onReset = async () => {
  try {
    // Replace the current route with the same path but without query params.
    // This clears useLocalSearchParams() so the effect won't repopulate selectedImage.
    // Use whichever form your expo-router supports; the simple string form usually works.
    await router.replace('/upload');
    // Alternative explicit form:
    // await router.replace({ pathname: '/upload', params: {} });
  } catch (err) {
    // If router.replace fails for any reason, keep going and clear local state anyway
    console.warn('router.replace failed:', err);
  } finally {
    // Clear local UI state
    setShowAppOptions(false);
    setSelectedImage(undefined);
    setEditingId(undefined);
  }
};

  // Placeholder for tags — we'll implement tag modal/UI later
  const onAddTags = () => {
    Alert.alert('Tags', 'Tag editor will be implemented here later.');
  };

  // Save or update the image entry
  const onSaveImageAsync = async () => {
    if (!selectedImage) {
      Alert.alert('No image', 'Choose a photo first.');
      return;
    }

    setSaving(true);

    try {
      // Ensure the folder exists on mobile. On web, WARDROBE_FOLDER may be empty string.
      await ensureWardrobeFolderExists();

      // Use uuid for stable unique IDs. If editing, keep the editingId.
      const id = editingId ?? uuidv4();

      // Guess extension (jpg fallback)
      const ext = selectedImage.split('.').pop()?.split('?')[0] ?? 'jpg';
      const filename = `img_${id}.${ext}`;

      // Destination path in app sandbox (may be '' on web)
      const dest = WARDROBE_FOLDER ? `${WARDROBE_FOLDER}${filename}` : '';

      let finalUri = selectedImage;

      // Try copying into the app folder (works on mobile). If dest empty (web), store original URI.
      if (dest) {
        try {
          // copyAsync will copy file:// URIs on mobile
          await FileSystem.copyAsync({ from: selectedImage, to: dest });
          finalUri = dest;
        } catch (copyErr) {
          // If copy fails, attempt downloadAsync for http(s) URIs, otherwise fall back to original URI
          if (selectedImage.startsWith('http')) {
            try {
              await FileSystem.downloadAsync(selectedImage, dest);
              finalUri = dest;
            } catch (downloadErr) {
              console.warn('downloadAsync failed', downloadErr);
              finalUri = selectedImage;
            }
          } else {
            // Some iOS URIs like ph:// sometimes can't be copied directly; keep original URI instead
            console.warn('File copy failed, storing original uri instead', copyErr);
            finalUri = selectedImage;
          }
        }
      } else {
        // On web we often can't write to documentDirectory; keep the original URI in the index
        finalUri = selectedImage;
      }

      // Build the WardrobeItem object
      const item: WardrobeItem = {
        id,
        uri: finalUri,
        createdAt: Date.now(),
      };

      // If we're editing an existing item, call updateItem (update in index).
      // Otherwise add a new entry with addItem.
      if (editingId) {
        await updateItem(item); // ensure updateItem exists in storage.ts
        Alert.alert('Updated', 'Photo entry updated.');
      } else {
        await addItem(item);
        Alert.alert('Saved', 'Photo saved to your wardrobe.');
      }

      // Optionally navigate back to Wardrobe so the user sees the new/updated image.
      // This helps ensure the list reloads and user gets immediate feedback.
      router.push('/wardrobe');

      // Reset UI
      setSelectedImage(undefined);
      setShowAppOptions(false);
      setEditingId(undefined);
    } catch (e) {
      console.error('save error', e);
      Alert.alert('Error', "Couldn't save image — check console for details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {/* ImageViewer shows either the selectedImage (uri) or a placeholder asset */}
        <ImageViewer imgSource={PlaceholderImage} selectedImage={selectedImage} />
      </View>

      {showAppOptions ? (
        <View style={styles.optionsContainer}>
          <View style={styles.optionsRow}>
            {/* Reset selection */}
            <IconButton icon="refresh" label="Reset" onPress={onReset} />
            {/* Add tags (placeholder) */}
            <CircleButton onPress={onAddTags} />
            {/* Save — shows "Saving..." when performing save operation */}
            <IconButton icon="save-alt" label={saving ? 'Saving...' : 'Save'} onPress={onSaveImageAsync} />
          </View>
        </View>
      ) : (
        <View style={styles.footerContainer}>
          {/* Pick a photo from the library */}
          <Button theme="primary" label="Choose a photo" onPress={pickImageAsync} />
          <View style={{ height: 12 }} />
          {/* Show options without saving — same as "Use this photo" in your UX */}
          <Button label="Use this photo" onPress={() => setShowAppOptions(true)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
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
