// app/_layout.tsx

import { ensureWardrobeFolderExists } from '@/lib/storage';
import { Stack } from 'expo-router';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    ensureWardrobeFolderExists();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="not_found" />
    </Stack>
  );
}

// import { Stack } from 'expo-router';
// import { StatusBar } from 'expo-status-bar';
// import { LogBox } from 'react-native';

// LogBox.ignoreAllLogs(true);


// export default function RootLayout() {
//   return (
//     <>
//       <StatusBar style='light'/>
//       <Stack>
//         <Stack.Screen 
//         name="(tabs)" 
//         options={{ 
//           headerShown: false,
//         }} 
//         />
//         <Stack.Screen 
//         name="+not_found" 
//         options={{}} 
//         />
//       </Stack>
//     </>
//   );
// }
