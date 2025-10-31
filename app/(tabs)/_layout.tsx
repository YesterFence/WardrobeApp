import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import 'react-native-get-random-values';
import { StyleSheet } from 'react-native';

/* Adds Sections Tabs to app */
export default function TabsLayout() {
  return (
    <Tabs
    screenOptions={{
        tabBarActiveTintColor: '#FFE6A7',
        headerStyle: {
            backgroundColor: '#432818',
        },
        headerShadowVisible: false,
        headerTintColor: '#fff',
        tabBarStyle: {
            backgroundColor: '#432818',
        },
    }}
    >
        <Tabs.Screen name="index" 
        options={{ 
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
                <Ionicons 
                    name={focused ? 'home-sharp' : 'home-outline'} 
                    color={color} 
                    size={24} 
                />
            ),
        }} 
        />
        <Tabs.Screen name="upload" 
        options={{ 
            title: 'Picture',
            tabBarIcon: ({ color, focused }) => (
                <Ionicons 
                    name={focused ? 'camera' : 'camera-outline'} 
                    color={color} 
                    size={24} 
                />
            ),
        }} 
        />
        <Tabs.Screen name="wardrobe" 
        options={{ 
            title: 'Wardrobe', 
            tabBarIcon: ({ color, focused }) => (
                <Ionicons 
                    name={focused ? 'briefcase' : 'briefcase-outline'} 
                    color={color} 
                    size={24}
                />
            ),
        }} 
        />
        
       <Tabs.Screen name="filter" 
        options={{ 
            title: 'Filter', 
            tabBarIcon: ({ color, focused }) => (
                <Ionicons 
                    name={focused ? 'grid' : 'grid-outline'} 
                    color={color} 
                    size={24}
                />
            ),
        }} 
        />
        <Tabs.Screen name="calendar" 
        options={{ 
            title: 'Calendar', 
            tabBarIcon: ({ color, focused }) => (
                <Ionicons 
                    name={focused ? 'calendar' : 'calendar-outline'} 
                    color={color} 
                    size={24}
                />
            ),
        }} 
        />
    </Tabs>
  );
}

const styles = StyleSheet.create({
});