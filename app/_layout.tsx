// app/_layout.tsx

import { ensureWardrobeFolderExists } from '@/lib/storage';
import { Mogra_400Regular, useFonts } from '@expo-google-fonts/mogra';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync(); // Required before loading fonts

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Mogra_400Regular
  });

  useEffect(() => {
    // Create wardrobe folder once
    ensureWardrobeFolderExists();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // Keep splash screen up
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="not_found" />
    </Stack>
  );
}

// import { ensureWardrobeFolderExists } from '@/lib/storage';
// import { Mogra_400Regular, useFonts } from "@expo-google-fonts/mogra";
// import { Stack } from 'expo-router';
// import { useEffect } from 'react';

// export default function RootLayout() {
  
//   const [fontsLoaded] = useFonts({
//     Mogra_400Regular
//   })
  
//   useEffect(() => {
//     if (fontsLoaded) {
//       SplashScreen.hideAsync();
//     }
//   }, [frontsLoaded]);

//     ensureWardrobeFolderExists();
//   }, []);

//   return (
//     <Stack>
//       <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//       <Stack.Screen name="not_found" />
//     </Stack>
//   );
// }