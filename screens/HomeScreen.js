import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen({ navigation }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => loadItems());
    loadItems();
    return unsub;
  }, [navigation]);

  const loadItems = async () => {
    try {
      const json = await AsyncStorage.getItem('@clothes_items');
      const parsed = json ? JSON.parse(json) : [];
      setItems(parsed.reverse()); // show newest first
    } catch (e) {
      console.log('Load error', e);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.uri }} style={styles.image} />
      <View style={styles.meta}>
        <Text style={styles.title}>{item.type} — {item.color}</Text>
        <Text>Season: {item.season || '—'}</Text>
        <Text>Tags: {item.tags?.join(', ') || '—'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Button title="Add Clothing" onPress={() => navigation.navigate('AddItem')} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: 12 }}
        ListEmptyComponent={<Text style={{marginTop:20}}>No items yet — add one!</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  card: { flexDirection: 'row', padding: 10, marginBottom: 10, backgroundColor: '#fff', borderRadius: 8, elevation: 2 },
  image: { width: 90, height: 90, borderRadius: 6, backgroundColor: '#eee' },
  meta: { flex: 1, paddingLeft: 10, justifyContent: 'center' },
  title: { fontWeight: '700', marginBottom: 4 },
});
