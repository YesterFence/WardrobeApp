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
      <Tabs.Screen
        name="index"
        options={{
          // headerLeft: () => (
          //   <Ionicons
          //     name="person-circle-outline"
          //     size={56}
          //     color="#fff"
          //     style={{ marginLeft: 20 }}
          //     onPress={() => console.log("Profile pressed")}
          //   />
          // ),
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
              name={focused ? "home-sharp" : "home-outline"}
              color={color}
              size={28}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="upload"
        options={{
          // headerLeft: () => (
          //   <Ionicons
          //     name="person-circle-outline"
          //     size={56}
          //     color="#fff"
          //     style={{ marginLeft: 20 }}
          //     onPress={() => console.log("Profile pressed")}
          //   />
          // ),
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
        }}
      />

      <Tabs.Screen
        name="wardrobe"
        options={{
          // headerLeft: () => (
          //   <Ionicons
          //     name="person-circle-outline"
          //     size={56}
          //     color="#fff"
          //     style={{ marginLeft: 20 }}
          //     onPress={() => console.log("Profile pressed")}
          //   />
          // ),
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
        }}
      />

      <Tabs.Screen
        name="filter"
        options={{
          // headerLeft: () => (
          //   <Ionicons
          //     name="person-circle-outline"
          //     size={56}
          //     color="#fff"
          //     style={{ marginLeft: 20 }}
          //     onPress={() => console.log("Profile pressed")}
          //   />
          // ),
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
        }}
      />

      <Tabs.Screen
        name="calendar"
        options={{
          // headerLeft: () => (
          //   <Ionicons
          //     name="person-circle-outline"
          //     size={56}
          //     color="#fff"
          //     style={{ marginLeft: 20 }}
          //     onPress={() => console.log("Profile pressed")}
          //   />
          // ),
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
