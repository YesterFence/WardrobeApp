import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clothes-Line</Text>

      <Pressable style={styles.button} onPress={() => router.push('/wardrobe' as any)}>
        <Text style={styles.buttonText}>Wardrobe</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => router.push('/upload' as any)}>
        <Text style={styles.buttonText}>Upload Clothes</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => router.push('/filter' as any)}>
        <Text style={styles.buttonText}>Filter</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => router.push('/calendar' as any)}>
        <Text style={styles.buttonText}>Calendar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    marginBottom: 20,
  },
  button: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginVertical: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#25292e',
    fontWeight: '600',
  },
});
