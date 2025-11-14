import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { SplashScreen } from "expo-router";
import { useEffect } from "react";
import { useFonts, Mogra_400Regular } from "@expo-google-fonts/mogra";

LogBox.ignoreAllLogs(true);

export default function RootLayout() {
  // Load the font here
  const [fontsLoaded] = useFonts({
    Mogra_400Regular,
  });

  // Keep splash screen until fonts load
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Don't render ANY UI until the font is ready
  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style='light' />
      <Stack>
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="+not_found" 
          options={{}} 
        />
      </Stack>
    </>
  );
}
