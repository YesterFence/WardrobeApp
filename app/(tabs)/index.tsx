// app/(tabs)/index.tsx

import { Redirect } from 'expo-router';

export default function Index() {
  // Automatically redirect to wardrobe
  return <Redirect href="/wardrobe" />;
}