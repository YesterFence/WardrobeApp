// app/(tabs)/settings.tsx
// Add this as a new tab or add the clear button to your index.tsx

import { clearAllData } from '@/lib/storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete ALL photos, tags, and settings. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              await clearAllData();
              Alert.alert('Success', 'All data has been cleared. The app will restart.');
              // Navigate back to home
              router.replace('/' as any);
            } catch (e) {
              Alert.alert('Error', 'Failed to clear data. Please try again.');
              console.error('Clear data error:', e);
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleClearAllData}
          disabled={isClearing}
        >
          {isClearing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.dangerButtonText}>Clear All Data</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.warningText}>
          ⚠️ This will delete all photos and tags permanently
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.infoText}>Wardrobe App v1.0</Text>
        <Text style={styles.infoText}>Manage your clothing collection</Text>
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
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  dangerButton: {
    backgroundColor: '#d32f2f',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    color: '#FFE6A7',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
});