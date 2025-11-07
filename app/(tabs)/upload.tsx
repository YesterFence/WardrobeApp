// app/(tabs)/upload.tsx

// app/(tabs)/upload.tsx
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

import Button from '../../components/Button';
import CircleButton from '../../components/CircleButton';
import IconButton from '../../components/IconButton';
import ImageViewer from '../../components/ImageViewer';
import {
  addItem,
  ensureWardrobeFolderExists,
  updateItem,
  WARDROBE_FOLDER,
  WardrobeItem,
} from './storage';

const PlaceholderImage = require('../../assets/images/background-image.png');

export default function UploadScreen() {
  const params = useLocalSearchParams() as { uri?: string; id?: string };
  const router = useRouter();

  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [showAppOptions, setShowAppOptions] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  // If navigated with params (edit flow), prefill and show options
  useEffect(() => {
    if (params?.uri) {
      try {
        const decoded = decodeURIComponent(params.uri);
        setSelectedImage(decoded);
      } catch {
        setSelectedImage(params.uri);
      }
      // For editing, jump straight to the options view (reset/tags/save)
      setShowAppOptions(true);
    }
    if (params?.id) setEditingId(params.id);
  }, [params]);

  // Pick an image and swap the preview with the picked image (no extra UI)
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
        // Immediately replace the placeholder preview with the chosen photo
        setSelectedImage(uri);
        // Do NOT change text or show extra UI — user will tap "Use this photo" to confirm
      } else {
        // user cancelled — if there's no selectedImage, show a friendly message
        if (!selectedImage) {
          Alert.alert('No image selected', 'You did not pick a photo. Tap "Choose a photo" to try again.');
        }
      }
    } catch (err) {
      console.error('image pick error', err);
      Alert.alert('Error', 'Something went wrong picking the image.');
    }
  };

  // Use this photo: validate that a real photo is present then show app options
  const handleUsePhotoPress = () => {
    if (!selectedImage) {
      Alert.alert('No image selected', 'Please choose a photo before using it.');
      return;
    }
    setShowAppOptions(true);
  };

  // Reset selection and route params; clears UI state
  const onReset = async () => {
    try {
      await router.replace('/upload');
    } catch (err) {
      console.warn('router.replace failed:', err);
    } finally {
      setShowAppOptions(false);
      setSelectedImage(undefined);
      setEditingId(undefined);
    }
  };

  const onAddTags = () => {
    Alert.alert('Tags', 'Tag editor will be implemented here later.');
  };

  // Save or update the image entry (keeps your previous logic, simplified slightly)
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
          // fallback for ph:// and other platform quirks
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
      };

      if (editingId) {
        await updateItem(item);
        Alert.alert('Updated', 'Photo entry updated.');
      } else {
        await addItem(item);
        Alert.alert('Saved', 'Photo saved to your wardrobe.');
      }

      // return to wardrobe to show the new/updated image
      router.push('/wardrobe');

      // clear local UI
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
        <ImageViewer imgSource={PlaceholderImage} selectedImage={selectedImage} />
      </View>

      {showAppOptions ? (
        <View style={styles.optionsContainer}>
          <View style={styles.optionsRow}>
            <IconButton icon="refresh" label="Reset" onPress={onReset} />
            <CircleButton onPress={onAddTags} />
            <IconButton icon="save-alt" label={saving ? 'Saving...' : 'Save'} onPress={onSaveImageAsync} />
          </View>
        </View>
      ) : (
        <View style={styles.footerContainer}>
          <Button theme="primary" label="Choose a photo" onPress={pickImageAsync} />
          <View style={{ height: 12 }} />
          <Button label="Use this photo" onPress={handleUsePhotoPress} disabled={!selectedImage} />
          {/* <Button label="Use this photo" onPress={handleUsePhotoPress} /> */}
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