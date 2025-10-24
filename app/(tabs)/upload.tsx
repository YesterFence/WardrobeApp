// upload.tsx
import Button from '@/components/Button';
import CircleButton from '@/components/CircleButton';
import IconButton from '@/components/IconButton';
import ImageViewer from '@/components/ImageViewer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy'; // <<-- legacy import
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type WardrobeImage = {
  id: string;
  uri: string;
  originalUri?: string;
  tags: string[];
  createdAt: string;
};

const STORAGE_KEY = 'WARDROBE_IMAGES';
const DOC_DIR = (FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory ?? '';
const APP_DIR = `${DOC_DIR}wardrobe_images/`;

const AVAILABLE_TAGS = [
  'top', 'bottom', 'dress', 'outerwear', 'shoes', 'casual', 'formal', 'workout',
  'summer', 'winter', 'spring', 'fall', 'rain', 'sunny', 'night', 'day'
];

export default function Upload() {
  const imageRef = useRef<View | null>(null);

  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [showAppOptions, setShowAppOptions] = useState<boolean>(false);

  // Tag modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tagSelections, setTagSelections] = useState<Record<string, boolean>>({});
  const [customTagsText, setCustomTagsText] = useState('');

  // ensure app dir exists
  const ensureAppDir = async () => {
    const dirInfo = await FileSystem.getInfoAsync(APP_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(APP_DIR, { intermediates: true });
      console.log('Created app dir', APP_DIR);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (libraryStatus !== 'granted') {
          Alert.alert('Permission required', 'Media library permission is required to pick images.');
        }
        await ensureAppDir();
      } catch (e) {
        console.warn('Permission or dir setup failed', e);
      }
    })();
  }, []);

  const pickImageAsync = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 1 });
    if (!res.canceled) {
      setSelectedImage(res.assets[0].uri);
      setShowAppOptions(true);
    } else {
      Alert.alert('No image chosen');
    }
  };

  const takePhotoAsync = async () => {
    const res = await ImagePicker.launchCameraAsync({ quality: 1, allowsEditing: true });
    if (!res.canceled) {
      setSelectedImage(res.assets[0].uri);
      setShowAppOptions(true);
    }
  };

  const onAddTags = () => {
    if (!selectedImage) return Alert.alert('Select an image first.');
    const seed: Record<string, boolean> = {};
    AVAILABLE_TAGS.forEach(t => (seed[t] = false));
    setTagSelections(seed);
    setCustomTagsText('');
    setIsModalVisible(true);
  };

  const toggleTag = (tag: string) => setTagSelections(prev => ({ ...prev, [tag]: !prev[tag] }));

  // central save function — tags can be empty array
  const saveImageWithTags = async (tags: string[]) => {
    if (!selectedImage) return Alert.alert('No image selected.');
    try {
      await ensureAppDir();
      const filename = `img_${Date.now()}.jpg`;
      const destUri = `${APP_DIR}${filename}`;

      try {
        await FileSystem.copyAsync({ from: selectedImage, to: destUri });
      } catch (copyError) {
        console.warn('copyAsync failed, trying downloadAsync', copyError);
        await FileSystem.downloadAsync(selectedImage, destUri);
      }

      const metadata: WardrobeImage = {
        id: `${Date.now()}`,
        uri: destUri,
        originalUri: selectedImage,
        tags,
        createdAt: new Date().toISOString(),
      };

      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const arr: WardrobeImage[] = raw ? JSON.parse(raw) : [];
      arr.unshift(metadata);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

      setIsModalVisible(false);
      setShowAppOptions(false);
      setSelectedImage(undefined);
      Alert.alert('Saved to Wardrobe!');
      console.log('Saved metadata', metadata);
    } catch (e) {
      console.error('save error', e);
      Alert.alert('Save failed', String(e));
    }
  };

  // save without tags button uses empty tags
  const saveWithoutTags = () => saveImageWithTags([]);

  // modal-based save (collects chosen + custom tags)
  const saveWithModalTags = () => {
    const chosen = Object.entries(tagSelections).filter(([_, on]) => on).map(([tag]) => tag);
    const custom = customTagsText.split(',').map(t => t.trim()).filter(Boolean);
    saveImageWithTags([...chosen, ...custom]);
  };

  const onReset = () => {
    setSelectedImage(undefined);
    setShowAppOptions(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <View ref={imageRef} collapsable={false}>
          <ImageViewer imgSource={require('@/assets/images/background-image.png')} selectedImage={selectedImage} />
        </View>
      </View>

      {showAppOptions ? (
        <View style={styles.optionsContainer}>
          <View style={styles.optionsRow}>
            <IconButton icon="refresh" label="Reset" onPress={onReset} />
            {/* CircleButton now opens tag modal (optional) */}
            <CircleButton onPress={onAddTags} />
            {/* Save without tags immediately */}
            <IconButton icon="save-alt" label="Save" onPress={saveWithoutTags} />
          </View>

          <View style={{ marginTop: 8 }}>
            <Text style={{ color: '#fff', textAlign: 'center' }}>Tip: press + to add tags, or press Save to save now and tag later.</Text>
          </View>
        </View>
      ) : (
        <View style={styles.footerContainer}>
          <Button onPress={pickImageAsync} label="Choose a photo" theme="primary" />
          <Button label="Take a photo" onPress={takePhotoAsync} />
        </View>
      )}

      {/* Tag Modal */}
      <Modal visible={isModalVisible} animationType="slide" onRequestClose={() => setIsModalVisible(false)}>
        <View style={modalStyles.modalContainer}>
          <Text style={modalStyles.title}>Add tags</Text>
          <ScrollView style={{ width: '100%' }}>
            <Text style={modalStyles.label}>Pick tags (tap to toggle)</Text>
            <View style={modalStyles.tagsWrap}>
              {AVAILABLE_TAGS.map(tag => (
                <Pressable
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[modalStyles.tagPill, tagSelections[tag] ? modalStyles.tagOn : modalStyles.tagOff]}>
                  <Text style={modalStyles.tagText}>{tag}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={modalStyles.label}>Custom tags (comma-separated)</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="e.g. thrifted, blue, silk"
              value={customTagsText}
              onChangeText={setCustomTagsText}
            />

            <View style={modalStyles.actions}>
              <Pressable style={modalStyles.button} onPress={() => setIsModalVisible(false)}>
                <Text style={modalStyles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable style={modalStyles.buttonPrimary} onPress={saveWithModalTags}>
                <Text style={modalStyles.buttonPrimaryText}>Save to Wardrobe</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#25292e', alignItems: 'center' },
  imageContainer: { flex: 1 },
  footerContainer: { flex: 1 / 3, alignItems: 'center' },
  optionsContainer: { position: 'absolute', bottom: 60, width: '100%', alignItems: 'center' },
  optionsRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-around', width: '90%' },
});

const modalStyles = StyleSheet.create({
  modalContainer: { flex: 1, padding: 20, backgroundColor: '#111' },
  title: { color: '#fff', fontSize: 20, marginBottom: 12 },
  label: { color: '#ddd', marginBottom: 8 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  tagPill: { padding: 8, margin: 4, borderRadius: 16 },
  tagOn: { backgroundColor: '#ffd33d' },
  tagOff: { backgroundColor: '#333' },
  tagText: { color: '#111' },
  input: { backgroundColor: '#222', color: '#fff', padding: 8, borderRadius: 8, marginBottom: 12 },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  button: { padding: 12, borderRadius: 8, backgroundColor: '#333', flex: 1, marginRight: 6, alignItems: 'center' },
  buttonText: { color: '#fff' },
  buttonPrimary: { padding: 12, borderRadius: 8, backgroundColor: '#ffd33d', flex: 2, marginLeft: 6, alignItems: 'center' },
  buttonPrimaryText: { color: '#111', fontWeight: 'bold' },
});


// // upload.tsx
// import Button from '@/components/Button';
// import CircleButton from '@/components/CircleButton';
// import IconButton from '@/components/IconButton';
// import ImageViewer from '@/components/ImageViewer';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as FileSystem from 'expo-file-system';
// import * as ImagePicker from 'expo-image-picker';
// import React, { useEffect, useRef, useState } from 'react';
// import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

// type WardrobeImage = {
//   id: string;
//   uri: string;
//   originalUri?: string;
//   tags: string[];
//   createdAt: string;
// };

// const STORAGE_KEY = 'WARDROBE_IMAGES';

// // SAFE way to read directory with types mismatch fallback
// const DOC_DIR = (FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory ?? '';
// const APP_DIR = `${DOC_DIR}wardrobe_images/`;

// export default function Upload() {
//   const imageRef = useRef<View | null>(null);

//   const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
//   const [showAppOptions, setShowAppOptions] = useState<boolean>(false);

//   // Tag modal state
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [tagSelections, setTagSelections] = useState<Record<string, boolean>>({});
//   const [customTagsText, setCustomTagsText] = useState('');

//   const AVAILABLE_TAGS = [
//     'top', 'bottom', 'dress', 'outerwear', 'shoes', 'casual', 'formal', 'workout',
//     'summer', 'winter', 'spring', 'fall', 'rain', 'sunny', 'night', 'day'
//   ];

//   useEffect(() => {
//     (async () => {
//       try {
//         const dirInfo = await FileSystem.getInfoAsync(APP_DIR);
//         if (!dirInfo.exists) {
//           await FileSystem.makeDirectoryAsync(APP_DIR, { intermediates: true });
//         }
//       } catch (e) {
//         console.warn('Could not ensure app dir:', e);
//       }
//     })();
//   }, []);

//   const pickImageAsync = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       quality: 1,
//     });
//     if (!result.canceled) {
//       setSelectedImage(result.assets[0].uri);
//       setShowAppOptions(true);
//     } else {
//       Alert.alert('No image chosen');
//     }
//   };

//   const takePhotoAsync = async () => {
//     const result = await ImagePicker.launchCameraAsync({ quality: 1, allowsEditing: true });
//     if (!result.canceled) {
//       setSelectedImage(result.assets[0].uri);
//       setShowAppOptions(true);
//     }
//   };

//   const onAddTags = () => {
//     if (!selectedImage) {
//       Alert.alert('Select an image first.');
//       return;
//     }
//     // reset modal state
//     const seed: Record<string, boolean> = {};
//     AVAILABLE_TAGS.forEach(t => (seed[t] = false));
//     setTagSelections(seed);
//     setCustomTagsText('');
//     setIsModalVisible(true);
//   };

//   const toggleTag = (tag: string) => {
//     setTagSelections(prev => ({ ...prev, [tag]: !prev[tag] }));
//   };

//   const onSaveImageAsync = async () => {
//     if (!selectedImage) {
//       Alert.alert('No image selected.');
//       return;
//     }

//     try {
//       // Optionally capture the view with stickers: use captureRef(imageRef.current, ...)
//       // For now copy the selected image file into the app directory
//       const filename = `img_${Date.now()}.jpg`;
//       const destUri = `${APP_DIR}${filename}`;
//       await FileSystem.copyAsync({ from: selectedImage, to: destUri });

//       const chosenTags = Object.entries(tagSelections)
//         .filter(([_, on]) => on)
//         .map(([tag]) => tag);
//       const customTags = customTagsText
//         .split(',')
//         .map(t => t.trim())
//         .filter(Boolean);
//       const tags = [...chosenTags, ...customTags];

//       const metadata: WardrobeImage = {
//         id: `${Date.now()}`,
//         uri: destUri,
//         originalUri: selectedImage,
//         tags,
//         createdAt: new Date().toISOString(),
//       };

//       const raw = await AsyncStorage.getItem(STORAGE_KEY);
//       const arr: WardrobeImage[] = raw ? JSON.parse(raw) : [];
//       arr.unshift(metadata);
//       await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

//       setIsModalVisible(false);
//       setShowAppOptions(false);
//       setSelectedImage(undefined);

//       Alert.alert('Saved to Wardrobe!');
//     } catch (e) {
//       console.error('save error', e);
//       Alert.alert('Save failed', String(e));
//     }
//   };

//   const onReset = () => {
//     setSelectedImage(undefined);
//     setShowAppOptions(false);
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.imageContainer}>
//         {/* use the ref object directly (no returning value function ref) */}
//         <View ref={imageRef} collapsable={false}>
//           <ImageViewer imgSource={require('@/assets/images/background-image.png')} selectedImage={selectedImage} />
//         </View>
//       </View>

//       {showAppOptions ? (
//         <View style={styles.optionsContainer}>
//           <View style={styles.optionsRow}>
//             <IconButton icon="refresh" label="Reset" onPress={onReset} />
//             <CircleButton onPress={onAddTags} />
//             <IconButton icon="save-alt" label="Save" onPress={onSaveImageAsync} />
//           </View>
//         </View>
//       ) : (
//         <View style={styles.footerContainer}>
//           <Button onPress={pickImageAsync} label="Choose a photo" theme="primary" />
//           <Button label="Take a photo" onPress={takePhotoAsync} />
//         </View>
//       )}

//       <Modal visible={isModalVisible} animationType="slide" onRequestClose={() => setIsModalVisible(false)}>
//         <View style={modalStyles.modalContainer}>
//           <Text style={modalStyles.title}>Add tags</Text>
//           <ScrollView style={{ width: '100%' }}>
//             <Text style={modalStyles.label}>Pick tags (tap to toggle)</Text>
//             <View style={modalStyles.tagsWrap}>
//               {AVAILABLE_TAGS.map(tag => (
//                 <Pressable
//                   key={tag}
//                   onPress={() => toggleTag(tag)}
//                   style={[modalStyles.tagPill, tagSelections[tag] ? modalStyles.tagOn : modalStyles.tagOff]}>
//                   <Text style={modalStyles.tagText}>{tag}</Text>
//                 </Pressable>
//               ))}
//             </View>

//             <Text style={modalStyles.label}>Custom tags (comma-separated)</Text>
//             <TextInput
//               style={modalStyles.input}
//               placeholder="e.g. thrifted, blue, silk"
//               value={customTagsText}
//               onChangeText={setCustomTagsText}
//             />

//             <View style={modalStyles.actions}>
//               <Pressable style={modalStyles.button} onPress={() => setIsModalVisible(false)}>
//                 <Text style={modalStyles.buttonText}>Cancel</Text>
//               </Pressable>
//               <Pressable style={modalStyles.buttonPrimary} onPress={onSaveImageAsync}>
//                 <Text style={modalStyles.buttonPrimaryText}>Save to Wardrobe</Text>
//               </Pressable>
//             </View>
//           </ScrollView>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#25292e', alignItems: 'center' },
//   imageContainer: { flex: 1 },
//   footerContainer: { flex: 1 / 3, alignItems: 'center' },
//   optionsContainer: { position: 'absolute', bottom: 80 },
//   optionsRow: { alignItems: 'center', flexDirection: 'row' },
// });

// const modalStyles = StyleSheet.create({
//   modalContainer: { flex: 1, padding: 20, backgroundColor: '#111' },
//   title: { color: '#fff', fontSize: 20, marginBottom: 12 },
//   label: { color: '#ddd', marginBottom: 8 },
//   tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
//   tagPill: { padding: 8, margin: 4, borderRadius: 16 },
//   tagOn: { backgroundColor: '#ffd33d' },
//   tagOff: { backgroundColor: '#333' },
//   tagText: { color: '#111' },
//   input: { backgroundColor: '#222', color: '#fff', padding: 8, borderRadius: 8, marginBottom: 12 },
//   actions: { flexDirection: 'row', justifyContent: 'space-between' },
//   button: { padding: 12, borderRadius: 8, backgroundColor: '#333', flex: 1, marginRight: 6, alignItems: 'center' },
//   buttonText: { color: '#fff' },
//   buttonPrimary: { padding: 12, borderRadius: 8, backgroundColor: '#ffd33d', flex: 2, marginLeft: 6, alignItems: 'center' },
//   buttonPrimaryText: { color: '#111', fontWeight: 'bold' },
// });
