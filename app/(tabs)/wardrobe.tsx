// app/(tabs)/wardrobe.tsx

import { readFilterTags, readIndex, WardrobeItem } from '@/lib/storage';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../../components/Button';

export default function WardrobeScreen() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const router = useRouter();
  const lastTapRef = useRef<number | null>(null);
  const DOUBLE_TAP_DELAY = 300;

  const loadItems = async () => {
    try {
      const allItems = await readIndex();
      const filters = await readFilterTags();
      setActiveTags(filters);

      if (filters.length > 0) {
        const filtered = allItems.filter((item) =>
          (item.tags ?? []).some((t: string) => filters.includes(t.toLowerCase()))
        );
        setItems(filtered);
      } else {
        setItems(allItems);
      }
    } catch (e) {
      console.warn('loadItems error', e);
      setItems([]);
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
      router.push(`/upload?id=${item.id}` as any);
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
        {activeTags.length > 0 && (
          <View style={styles.activeFilters}>
            <Text style={styles.filterTitle}>Active Filters:</Text>
            {activeTags.map((tag, idx) => (
              <Text key={idx} style={styles.filterTag}>
                #{tag}
              </Text>
            ))}
          </View>
        )}
        <Button
          theme="primary"
          label="Upload Clothes"
          onPress={() => router.push('/upload' as any)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {activeTags.length > 0 && (
        <View style={styles.filterBar}>
          <Text style={styles.filterBarText}>Filtered by: </Text>
          {activeTags.map((tag, idx) => (
            <Text key={idx} style={styles.filterBarTag}>
              #{tag}
            </Text>
          ))}
        </View>
      )}
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContainer}
        data={items}
        keyExtractor={(i) => i.id}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => handleTap(item)}
          >
            <Image source={{ uri: item.uri }} style={styles.image} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#BB9457' },
  filterBar: { backgroundColor: '#432818', padding: 12, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  filterBarText: { color: '#FFE6A7', fontSize: 14, fontWeight: '600', marginRight: 8 },
  filterBarTag: { color: '#fff', fontSize: 14, marginRight: 8, backgroundColor: 'rgba(255, 230, 167, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  list: { flex: 1 },
  listContainer: { backgroundColor: '#BB9457', padding: 12 },
  card: { flex: 1, margin: 8, alignItems: 'center', justifyContent: 'center' },
  image: { width: 150, height: 150, borderRadius: 12 },
  empty: { flex: 1, backgroundColor: '#BB9457', alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyText: { color: '#fff', fontSize: 18, marginBottom: 20, textAlign: 'center' },
  activeFilters: { backgroundColor: 'rgba(67, 40, 24, 0.3)', padding: 16, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  filterTitle: { color: '#FFE6A7', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  filterTag: { color: '#fff', fontSize: 14, marginVertical: 4 },
});