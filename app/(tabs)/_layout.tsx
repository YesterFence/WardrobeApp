import { Ionicons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import { Image, Pressable, StyleSheet } from "react-native";
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
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home-sharp" : "home-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: "Picture",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "camera" : "camera-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: "Wardrobe",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "briefcase" : "briefcase-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="filter"
        options={{
          title: "Filter",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          headerTitle: "Calendar",
          headerTitleAlign: "left",
          headerTitleStyle: styles.headerTitle,
          headerLeft: () => (
            <Pressable
              onPress={() => router.push("/wardrobe")}
              style={styles.iconButton}
            >
              {/* <Image
                source={require("../assets/icon.png")}
                style={styles.iconImage}
              /> */}
            </Pressable>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
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
