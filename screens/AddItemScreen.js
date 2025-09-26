import React, { useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AddItemScreen({ navigation }) {
  const [imageUri, setImageUri] = useState(null);
  const [type, setType] = useState('Top');
  const [color, setColor] = useState('');
  const [season, setSeason] = useState('');
  const [tags, setTags] = useState('');

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const saveItem = async () => {
    if (!imageUri) {
      Alert.alert('Add photo', 'Please take or pick a photo first.');
      return;
    }
    const newItem = {
      id: Date.now(),
      uri: imageUri,
      type,
      color,
      season,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    try {
      const json = await AsyncStorage.getItem('@clothes_items');
      const items = json ? JSON.parse(json) : [];
      items.push(newItem);
      await AsyncStorage.setItem('@clothes_items', JSON.stringify(items));
      navigation.goBack();
    } catch (e) {
      console.log('Save error', e);
      Alert.alert('Error', 'Could not save item.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button title="Pick from gallery" onPress={pickFromGallery} />
      <View style={{ height: 8 }} />
      <Button title="Take a photo" onPress={takePhoto} />
      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}
      <Text style={styles.label}>Type (Top / Bottom)</Text>
      <TextInput style={styles.input} value={type} onChangeText={setType} />
      <Text style={styles.label}>Color</Text>
      <TextInput style={styles.input} value={color} onChangeText={setColor} placeholder="e.g. blue" />
      <Text style={styles.label}>Season</Text>
      <TextInput style={styles.input} value={season} onChangeText={setSeason} placeholder="e.g. summer" />
      <Text style={styles.label}>Tags (comma separated)</Text>
      <TextInput style={styles.input} value={tags} onChangeText={setTags} placeholder="e.g. striped, casual" />
      <View style={{ height: 12 }} />
      <Button title="Save item" onPress={saveItem} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  preview: { width: '100%', height: 320, marginTop: 12, borderRadius: 8 },
  label: { marginTop: 10, marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 6 },
});
