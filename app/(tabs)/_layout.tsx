// app/(tabs)/_layout.tsx

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, Text } from "react-native";
import "react-native-get-random-values";

/* Adds Sections Tabs to app */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FFE6A7",
        headerStyle: {
          backgroundColor: "#432818",
        },
        headerShadowVisible: false,
        headerTintColor: "#fff",
        tabBarStyle: {
          backgroundColor: "#432818",
        },
      }}
    >
      {/* Hide index from tabs - it won't appear in navigation */}
      <Tabs.Screen
        name="index"
        options={{
          href: null, // This removes it from the tab bar
        }}
      />

      {/* Hide index from tabs - it won't appear in navigation */}
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // This removes it from the tab bar
        }}
      />


      <Tabs.Screen
        name="wardrobe"
        options={{
          headerTitle: () => (
            <Text
              style={{
                color: "#fff",
                fontSize: 26,
                fontFamily: "Mogra_400Regular",
              }}
            >
              Clothes-Line
            </Text>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "briefcase" : "briefcase-outline"}
              color={color}
              size={28}
            />
          ),
          title: "Wardrobe",
        }}
      />


      <Tabs.Screen
        name="filter"
        options={{
          headerTitle: () => (
            <Text
              style={{
                color: "#fff",
                fontSize: 26,
                fontFamily: "Mogra_400Regular",
              }}
            >
              Clothes-Line
            </Text>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              color={color}
              size={28}
            />
          ),
          title: "Filter",
        }}
      />


      <Tabs.Screen
        name="upload"
        options={{
          headerTitle: () => (
            <Text
              style={{
                color: "#fff",
                fontSize: 26,
                fontFamily: "Mogra_400Regular",
              }}
            >
              Clothes-Line
            </Text>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "camera" : "camera-outline"}
              color={color}
              size={28}
            />
          ),
          title: "Upload",
        }}
      />


      <Tabs.Screen
        name="create"
        options={{
          headerTitle: () => (
            <Text
              style={{
                color: "#fff",
                fontSize: 26,
                fontFamily: "Mogra_400Regular",
              }}
            >
              Clothes-Line
            </Text>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "shirt" : "shirt-outline"}
              color={color}
              size={28}
            />
          ),
          title: "Create",
        }}
      />


      <Tabs.Screen
        name="calendar"
        options={{
          headerTitle: () => (
            <Text
              style={{
                color: "#fff",
                fontSize: 26,
                fontFamily: "Mogra_400Regular",
              }}
            >
              Clothes-Line
            </Text>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              color={color}
              size={28}
            />
          ),
          title: "Calendar",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  iconButton: {
    marginLeft: 10,
  },
  iconImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});