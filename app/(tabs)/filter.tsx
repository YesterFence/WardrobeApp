// app/(tabs)/filter.tsx

import {
  addPresetTag,
  getAllTags,
  readFilterTags,
  setFilterTags,
} from '@/lib/storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../../components/Button';

export default function FilterScreen() {
  const router = useRouter();
  const [allTags, setAllTags] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [newPresetTag, setNewPresetTag] = useState('');

  const loadTags = async () => {
    try {
      const tags = await getAllTags();
      setAllTags(tags);
      const active = await readFilterTags();
      setActiveTags(active);
    } catch (e) {
      console.warn('loadTags error', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTags();
    }, [])
  );

  const toggleTag = async (tag: string) => {
    const lower = tag.toLowerCase();
    let updated: string[];

    if (activeTags.includes(lower)) {
      updated = activeTags.filter((t) => t !== lower);
    } else {
      updated = [...activeTags, lower];
    }

    setActiveTags(updated);
    await setFilterTags(updated);
  };

  const clearAllFilters = async () => {
    setActiveTags([]);
    await setFilterTags([]);
  };

  const addNewPresetTag = async () => {
    const trimmed = newPresetTag.trim().toLowerCase();
    if (!trimmed) {
      Alert.alert('Invalid Tag', 'Please enter a tag name');
      return;
    }

    try {
      await addPresetTag(trimmed);
      setNewPresetTag('');
      await loadTags(); // Refresh tag list
      Alert.alert('Success', `Tag "${trimmed}" added to presets`);
    } catch (e) {
      Alert.alert('Error', 'Failed to add preset tag');
    }
  };

  const applyAndViewWardrobe = () => {
    router.push('/wardrobe' as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filter by Tags</Text>

      {activeTags.length > 0 && (
        <View style={styles.activeSection}>
          <Text style={styles.sectionTitle}>
            Active Filters ({activeTags.length})
          </Text>
          <View style={styles.tagContainer}>
            {activeTags.map((tag, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.tagPill, styles.tagActive]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={styles.tagTextActive}>✓ #{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.clearButton} onPress={clearAllFilters}>
            <Text style={styles.clearButtonText}>Clear All Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>All Available Tags</Text>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.tagContainer}>
          {allTags.map((tag, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.tagPill,
                activeTags.includes(tag) && styles.tagSelected,
              ]}
              onPress={() => toggleTag(tag)}
            >
              <Text
                style={[
                  styles.tagText,
                  activeTags.includes(tag) && styles.tagTextSelected,
                ]}
              >
                {activeTags.includes(tag) ? '✓ ' : ''}#{tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add New Preset Tag */}
        <View style={styles.addPresetSection}>
          <Text style={styles.addPresetTitle}>Add New Preset Tag</Text>
          <View style={styles.addPresetRow}>
            <TextInput
              style={styles.presetInput}
              placeholder="e.g., summer, formal..."
              placeholderTextColor="#999"
              value={newPresetTag}
              onChangeText={setNewPresetTag}
              onSubmitEditing={addNewPresetTag}
            />
            <TouchableOpacity style={styles.addButton} onPress={addNewPresetTag}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          theme="primary"
          label="Apply & View Wardrobe"
          onPress={applyAndViewWardrobe}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#BB9457',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    marginTop: 8,
  },
  activeSection: {
    backgroundColor: 'rgba(67, 40, 24, 0.3)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagPill: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tagSelected: {
    backgroundColor: '#432818',
    borderColor: '#FFE6A7',
  },
  tagActive: {
    backgroundColor: '#432818',
    borderColor: '#FFE6A7',
  },
  tagText: {
    color: '#432818',
    fontSize: 16,
    fontWeight: '600',
  },
  tagTextSelected: {
    color: '#FFE6A7',
  },
  tagTextActive: {
    color: '#FFE6A7',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#d32f2f',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  addPresetSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  addPresetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  addPresetRow: {
    flexDirection: 'row',
  },
  presetInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#432818',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});