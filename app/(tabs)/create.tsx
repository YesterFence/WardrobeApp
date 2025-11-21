import { StyleSheet, Text, View } from "react-native";

export default function CreateOutfitScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Outfit Creator Page</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#BB9457",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#fff",
  },
});
