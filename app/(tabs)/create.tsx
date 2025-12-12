// app/(tabs)/create.tsx

import { listFilesInFolder, readIndex, WardrobeItem } from '@/lib/storage';
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

type Outfit = {
  id: string;
  items: WardrobeItem[];
  date: string;
};

export default function CreateOutfitScreen() {
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<WardrobeItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load wardrobe items
  const loadWardrobe = async () => {
    const idx = await readIndex();
    const files = await listFilesInFolder();
    let items: WardrobeItem[] =
      idx.length > 0
        ? idx
        : files.map((f) => ({
            id: f,
            uri: f,
            createdAt: Date.now(),
            tags: [],
          }));
    setWardrobeItems(items);
  };

  useEffect(() => {
    loadWardrobe();
  }, []);

  // Toggle selection of an item
  const toggleItem = (item: WardrobeItem) => {
    setSelectedItems((prev) =>
      prev.find((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item]
    );
  };

  // Save outfit locally without date
  const saveOutfit = async () => {
    if (selectedItems.length === 0) {
      Alert.alert(
        "No items selected",
        "Please select items to save your outfit."
      );
      return;
    }

    try {
      const stored = (await AsyncStorage.getItem("outfits")) || "[]";
      const outfits = JSON.parse(stored);

      const outfit: Outfit = {
        id: Date.now().toString(),
        items: selectedItems,
        date: "", // No date assigned
      };

      outfits.push(outfit);
      await AsyncStorage.setItem("outfits", JSON.stringify(outfits));

      Alert.alert("Saved!", "Your outfit has been saved.");
      setSelectedItems([]); // Clear selection after saving
    } catch (e) {
      Alert.alert("Error", "Failed to save outfit");
      console.error("Save outfit error:", e);
    }
  };

  // Open calendar modal to assign date
  const addToCalendar = () => {
    if (selectedItems.length === 0) {
      Alert.alert("No items selected", "Select at least 1 clothing item.");
      return;
    }
    setShowDatePicker(true);
  };

  // Save outfit with selected date
  const saveOutfitWithDate = async (dateString: string) => {
    try {
      const stored = (await AsyncStorage.getItem("outfits")) || "[]";
      const outfits: Outfit[] = JSON.parse(stored);

      const outfit: Outfit = {
        id: Date.now().toString(),
        items: selectedItems,
        date: dateString,
      };

      outfits.push(outfit);
      await AsyncStorage.setItem("outfits", JSON.stringify(outfits));

      setShowDatePicker(false);
      setSelectedDate("");
      setSelectedItems([]); // Clear selection
      Alert.alert("Success!", `Outfit saved for ${dateString}`);
    } catch (e) {
      Alert.alert("Error", "Failed to save outfit to calendar");
      console.error("Save outfit with date error:", e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Outfit Preview */}
      <View style={styles.outfitPreview}>
        <Text style={styles.sectionLabel}>Outfit Preview</Text>
        {selectedItems.length === 0 ? (
          <Text style={styles.placeholderText}>
            (Your outfit will appear here)
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedItems.map((item) => (
              <Image
                key={item.id}
                source={{ uri: item.uri }}
                style={styles.previewItem}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Wardrobe Items */}
      <View style={styles.wardrobeContainer}>
        <Text style={styles.sectionLabel}>Wardrobe</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollRow}
        >
          {wardrobeItems.map((item) => {
            const isSelected = selectedItems.find((i) => i.id === item.id);
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => toggleItem(item)}
                style={[
                  styles.wardrobeItem,
                  isSelected && styles.selectedBorder,
                ]}
              >
                <Image source={{ uri: item.uri }} style={styles.itemImage} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <Text style={styles.placeholderText}>Tap to select items</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.saveButton} onPress={saveOutfit}>
          <Text style={styles.buttonText}>Save Outfit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.calendarButton}
          onPress={addToCalendar}
        >
          <Text style={styles.buttonText}>Add to Calendar</Text>
        </TouchableOpacity>
      </View>

      {/* DATE PICKER MODAL */}
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a Date</Text>

            <Calendar
              onDayPress={(day) => {
                saveOutfitWithDate(day.dateString);
              }}
              markedDates={{
                [selectedDate]: { selected: true, selectedColor: "#432818" },
              }}
              theme={{
                backgroundColor: "#fff",
                calendarBackground: "#fff",
                textSectionTitleColor: "#432818",
                selectedDayBackgroundColor: "#432818",
                selectedDayTextColor: "#fff",
                todayTextColor: "#BB9457",
                dayTextColor: "#432818",
              }}
            />

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.closeModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#BB9457", padding: 20 },

  sectionLabel: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 10,
  },

  outfitPreview: {
    flex: 2,
    backgroundColor: "#4328",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    padding: 10,
  },

  placeholderText: { color: "#FFE6A7", fontStyle: "italic" },

  wardrobeContainer: { flex: 1 },

  scrollRow: { marginBottom: 8 },

  wardrobeItem: { marginRight: 10, borderRadius: 13, opacity: 0.8 },

  selectedBorder: {
    borderWidth: 3,
    borderColor: "#FFE6A7",
    padding: 2,
    borderRadius: 12,
  },

  itemImage: { width: 80, height: 80, borderRadius: 10 },

  previewItem: { width: 80, height: 120, marginRight: 12, borderRadius: 10 },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 50,
  },

  saveButton: {
    backgroundColor: "#4328",
    padding: 12,
    borderRadius: 10,
    width: "48%",
  },

  calendarButton: {
    backgroundColor: "#4328",
    padding: 12,
    borderRadius: 10,
    width: "48%",
  },

  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16, textAlign: "center" },

  // Modal Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    width: "88%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
    color: "#432818",
  },

  closeModalButton: {
    marginTop: 15,
    backgroundColor: "#432818",
    padding: 12,
    borderRadius: 10,
  },

  closeModalText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});


// import { listFilesInFolder, readIndex, WardrobeItem } from '@/lib/storage';
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import React, { useEffect, useState } from "react";
// import {
//   Alert,
//   Image,
//   Modal,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { Calendar } from "react-native-calendars";

// export default function CreateOutfitScreen({ route, navigation }: any) {
//   const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
//   const [selectedItems, setSelectedItems] = useState<WardrobeItem[]>([]);
//   const [selectedDate, setSelectedDate] = useState<string>("");
//   const [showDatePicker, setShowDatePicker] = useState(false);

//   // Load wardrobe items
//   const loadWardrobe = async () => {
//     const idx = await readIndex();
//     const files = await listFilesInFolder();
//     let items: WardrobeItem[] =
//       idx.length > 0
//         ? idx
//         : files.map((f) => ({
//             id: f,
//             uri: f,
//             createdAt: Date.now(),
//             tags: [],
//           }));
//     setWardrobeItems(items);
//   };

//   useEffect(() => {
//     loadWardrobe();
//   }, []);

//   // Toggle selection of an item
//   const toggleItem = (item: WardrobeItem) => {
//     setSelectedItems((prev) =>
//       prev.find((i) => i.id === item.id)
//         ? prev.filter((i) => i.id !== item.id)
//         : [...prev, item]
//     );
//   };

//   // Save outfit locally
//   const saveOutfit = async () => {
//     if (selectedItems.length === 0) {
//       Alert.alert(
//         "No items selected",
//         "Please select items to save your outfit."
//       );
//       return;
//     }

//     const stored = (await AsyncStorage.getItem("outfits")) || "[]";
//     const outfits = JSON.parse(stored);

//     const outfit = {
//       id: Date.now().toString(),
//       items: selectedItems,
//       date: selectedDate || null,
//     };

//     outfits.push(outfit);
//     await AsyncStorage.setItem("outfits", JSON.stringify(outfits));

//     Alert.alert("Saved!", "Your outfit has been saved.");
//   };

//   // Open calendar modal instead of alert
//   const addToCalendar = () => {
//     if (selectedItems.length === 0) {
//       Alert.alert("No items selected", "Select at least 1 clothing item.");
//       return;
//     }
//     setShowDatePicker(true);
//   };

//   return (
//     <View style={styles.container}>
//       {/* Outfit Preview */}
//       <View style={styles.outfitPreview}>
//         <Text style={styles.sectionLabel}>Outfit Preview</Text>
//         {selectedItems.length === 0 ? (
//           <Text style={styles.placeholderText}>
//             (Your outfit will appear here)
//           </Text>
//         ) : (
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             {selectedItems.map((item) => (
//               <Image
//                 key={item.id}
//                 source={{ uri: item.uri }}
//                 style={styles.previewItem}
//               />
//             ))}
//           </ScrollView>
//         )}
//       </View>

//       {/* Wardrobe Items */}
//       <View style={styles.wardrobeContainer}>
//         <Text style={styles.sectionLabel}>Wardrobe</Text>
//         <ScrollView
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           style={styles.scrollRow}
//         >
//           {wardrobeItems.map((item) => {
//             const isSelected = selectedItems.find((i) => i.id === item.id);
//             return (
//               <TouchableOpacity
//                 key={item.id}
//                 onPress={() => toggleItem(item)}
//                 style={[
//                   styles.wardrobeItem,
//                   isSelected && styles.selectedBorder,
//                 ]}
//               >
//                 <Image source={{ uri: item.uri }} style={styles.itemImage} />
//               </TouchableOpacity>
//             );
//           })}
//         </ScrollView>
//         <Text style={styles.placeholderText}>Tap to select items</Text>
//       </View>

//       {/* Action Buttons */}
//       <View style={styles.buttonRow}>
//         <TouchableOpacity style={styles.saveButton} onPress={saveOutfit}>
//           <Text style={styles.buttonText}>Save Outfit</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.calendarButton}
//           onPress={addToCalendar}
//         >
//           <Text style={styles.buttonText}>Add to Calendar</Text>
//         </TouchableOpacity>
//       </View>

//       {/* DATE PICKER MODAL */}
//       <Modal visible={showDatePicker} transparent animationType="fade">
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Select a Date</Text>

//             <Calendar
//               onDayPress={(day) => {
//                 setSelectedDate(day.dateString);
//                 setShowDatePicker(false);
//                 saveOutfit(); // Save immediately with date
//               }}
//               markedDates={{
//                 [selectedDate]: { selected: true, selectedColor: "#432818" },
//               }}
//               theme={{
//                 backgroundColor: "#fff",
//                 calendarBackground: "#fff",
//                 textSectionTitleColor: "#432818",
//                 selectedDayBackgroundColor: "#432818",
//                 selectedDayTextColor: "#fff",
//                 todayTextColor: "#BB9457",
//                 dayTextColor: "#432818",
//               }}
//             />

//             <TouchableOpacity
//               style={styles.closeModalButton}
//               onPress={() => setShowDatePicker(false)}
//             >
//               <Text style={styles.closeModalText}>Cancel</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#BB9457", padding: 20 },

//   sectionLabel: {
//     fontSize: 18,
//     color: "#fff",
//     fontWeight: "600",
//     marginTop: 15,
//     marginBottom: 10,
//   },

//   outfitPreview: {
//     flex: 2,
//     backgroundColor: "#4328",
//     borderRadius: 12,
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 20,
//   },

//   placeholderText: { color: "#FFE6A7", fontStyle: "italic" },

//   wardrobeContainer: { flex: 1 },

//   scrollRow: { marginBottom: 8 },

//   wardrobeItem: { marginRight: 10, borderRadius: 13, opacity: 0.8 },

//   selectedBorder: {
//     borderWidth: 3,
//     borderColor: "#432818",
//     padding: 2,
//     borderRadius: 12,
//   },

//   itemImage: { width: 80, height: 80, borderRadius: 10 },

//   previewItem: { width: 80, height: 120, marginRight: 12, borderRadius: 10 },

//   buttonRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginTop: 50,
//   },

//   saveButton: {
//     backgroundColor: "#4328",
//     padding: 12,
//     borderRadius: 10,
//     width: "48%",
//   },

//   calendarButton: {
//     backgroundColor: "#4328",
//     padding: 12,
//     borderRadius: 10,
//     width: "48%",
//   },

//   buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },

//   // Modal Styling
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "center",
//     alignItems: "center",
//   },

//   modalContent: {
//     width: "88%",
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 20,
//   },

//   modalTitle: {
//     fontSize: 20,
//     fontWeight: "600",
//     marginBottom: 12,
//     textAlign: "center",
//     color: "#432818",
//   },

//   closeModalButton: {
//     marginTop: 15,
//     backgroundColor: "#432818",
//     padding: 12,
//     borderRadius: 10,
//   },

//   closeModalText: {
//     color: "#fff",
//     textAlign: "center",
//     fontSize: 16,
//     fontWeight: "600",
//   },
// });