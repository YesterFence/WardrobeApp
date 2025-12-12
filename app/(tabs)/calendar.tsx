// app/(tabs)/calendar.tsx

import { WardrobeItem } from '@/lib/storage';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import moment from "moment";
import { useCallback, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Calendar } from "react-native-calendars";

type Outfit = {
  id: string;
  items: WardrobeItem[];
  date: string;
};

export default function CalendarSwitcher() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"week" | "month" | "day">("week");
  const [currentWeekStart, setCurrentWeekStart] = useState(moment().startOf("week"));
  const [selectedDay, setSelectedDay] = useState<string>(moment().format("YYYY-MM-DD"));
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});

  // Load outfits from storage
  const loadOutfits = async () => {
    try {
      const stored = await AsyncStorage.getItem("outfits");
      if (stored) {
        const parsedOutfits: Outfit[] = JSON.parse(stored);
        setOutfits(parsedOutfits);
        
        // Create marked dates for calendar
        const marked: Record<string, any> = {};
        parsedOutfits.forEach(outfit => {
          if (outfit.date) {
            marked[outfit.date] = {
              marked: true,
              dotColor: '#FFE6A7',
            };
          }
        });
        
        // Add selected day highlighting
        if (selectedDay) {
          marked[selectedDay] = {
            ...marked[selectedDay],
            selected: true,
            selectedColor: '#432818',
          };
        }
        
        setMarkedDates(marked);
      }
    } catch (e) {
      console.error("Load outfits error:", e);
    }
  };

  // Reload outfits when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadOutfits();
    }, [selectedDay])
  );

  // Get outfit for a specific date
  const getOutfitForDate = (dateString: string): Outfit | undefined => {
    return outfits.find(outfit => outfit.date === dateString);
  };

  // Calculate current week
  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    currentWeekStart.clone().add(i, "days")
  );

  const todayStr = moment().format("YYYY-MM-DD");

  // Week navigation
  const goToNextWeek = () => setCurrentWeekStart((prev) => prev.clone().add(1, "week"));
  const goToPrevWeek = () => setCurrentWeekStart((prev) => prev.clone().subtract(1, "week"));

  // Navigate to create outfit page
  const navigateToCreate = () => {
    router.push('/create' as any);
  };

  return (
    <View style={styles.container}>
      {/* View Mode Buttons */}
      <View style={styles.viewModeContainer}>
        {["week", "month", "day"].map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.viewModeButton, viewMode === mode && styles.viewModeSelected]}
            onPress={() => setViewMode(mode as any)}
          >
            <Text style={styles.viewModeText}>{mode.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Render based on mode */}
      {viewMode === "week" && (
        <ScrollView style={styles.scrollContainer}>
          {weekDays.map((day) => {
            const dayStr = day.format("YYYY-MM-DD");
            const isSelected = dayStr === selectedDay;
            const isToday = dayStr === todayStr;
            const outfit = getOutfitForDate(dayStr);

            return (
              <View key={dayStr} style={styles.dayContainer}>
                <TouchableOpacity
                  onPress={() => setSelectedDay(dayStr)}
                  style={[
                    styles.day,
                    isSelected && styles.selectedDay,
                    isToday && styles.todayHighlight
                  ]}
                >
                  <Text style={styles.dayText}>{day.format("dddd, MMM D")}</Text>
                  
                  {outfit && outfit.items.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.outfitScroll}>
                      {outfit.items.map((item) => (
                        <Image
                          key={item.id}
                          source={{ uri: item.uri }}
                          style={styles.outfitImage}
                        />
                      ))}
                    </ScrollView>
                  ) : (
                    <TouchableOpacity onPress={navigateToCreate}>
                      <Text style={styles.addOutfitText}>Tap to add an outfit</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.navButton} onPress={goToPrevWeek}>
              <Text style={styles.navButtonText}>Previous Week</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={goToNextWeek}>
              <Text style={styles.navButtonText}>Next Week</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {viewMode === "month" && (
        <View>
          <Calendar
            current={selectedDay}
            onDayPress={(day) => setSelectedDay(day.dateString)}
            markedDates={markedDates}
            theme={{
              calendarBackground: "#BB9457",
              dayTextColor: "#fff",
              monthTextColor: "#fff",
              arrowColor: "#fff",
              textDisabledColor: "#666",
            }}
          />
          
          {/* Show outfit for selected day */}
          <View style={styles.selectedDayOutfit}>
            <Text style={styles.selectedDateText}>
              {moment(selectedDay).format("MMMM D, YYYY")}
            </Text>
            {(() => {
              const outfit = getOutfitForDate(selectedDay);
              if (outfit && outfit.items.length > 0) {
                return (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {outfit.items.map((item) => (
                      <Image
                        key={item.id}
                        source={{ uri: item.uri }}
                        style={styles.monthOutfitImage}
                      />
                    ))}
                  </ScrollView>
                );
              } else {
                return (
                  <TouchableOpacity onPress={navigateToCreate} style={styles.addButton}>
                    <Text style={styles.addOutfitText}>Tap to add an outfit</Text>
                  </TouchableOpacity>
                );
              }
            })()}
          </View>
        </View>
      )}

      {viewMode === "day" && (
        <View style={styles.dayView}>
          <Text style={styles.dayViewDate}>{moment(selectedDay).format("dddd, MMM D, YYYY")}</Text>
          
          {(() => {
            const outfit = getOutfitForDate(selectedDay);
            if (outfit && outfit.items.length > 0) {
              return (
                <View style={styles.dayViewOutfit}>
                  <Text style={styles.outfitLabel}>Your Outfit:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {outfit.items.map((item) => (
                      <Image
                        key={item.id}
                        source={{ uri: item.uri }}
                        style={styles.dayOutfitImage}
                      />
                    ))}
                  </ScrollView>
                </View>
              );
            } else {
              return (
                <TouchableOpacity onPress={navigateToCreate} style={styles.addButton}>
                  <Text style={styles.addOutfitText}>Tap to add an outfit</Text>
                </TouchableOpacity>
              );
            }
          })()}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#BB9457", padding: 20 },
  scrollContainer: { flex: 1, marginBottom: 10 },
  dayContainer: { marginBottom: 12 },
  day: { backgroundColor: "#4328", padding: 20, borderRadius: 10 },
  selectedDay: { borderColor: "#FFE6A7", borderWidth: 2 },
  todayHighlight: { borderColor: "#FFE6A7", borderWidth: 2, borderStyle: 'dashed' },
  dayText: { color: "#fff", fontSize: 18, fontWeight: "600", marginBottom: 10 },
  outfitScroll: { marginTop: 8 },
  outfitImage: { width: 60, height: 80, borderRadius: 8, marginRight: 8 },
  addOutfitText: { color: "#FFE6A7", marginTop: 5, fontSize: 14, fontStyle: "italic" },
  addButton: { padding: 20, backgroundColor: "rgba(67, 40, 24, 0.3)", borderRadius: 10, alignItems: "center", marginTop: 10 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  navButton: { backgroundColor: "#432818", padding: 12, borderRadius: 8, width: "48%", alignItems: "center" },
  navButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  viewModeContainer: { flexDirection: "row", justifyContent: "space-around", marginBottom: 12 },
  viewModeButton: { padding: 10, borderRadius: 8, backgroundColor: "#432818", flex: 1, marginHorizontal: 4, alignItems: "center" },
  viewModeSelected: { borderColor: "#FFE6A7", borderWidth: 2 },
  viewModeText: { color: "#fff", fontWeight: "600" },
  
  // Month view specific
  selectedDayOutfit: { marginTop: 20, padding: 16, backgroundColor: "#4328", borderRadius: 10 },
  selectedDateText: { color: "#FFE6A7", fontSize: 18, fontWeight: "600", marginBottom: 12 },
  monthOutfitImage: { width: 80, height: 100, borderRadius: 8, marginRight: 10 },
  
  // Day view specific
  dayView: { flex: 1, padding: 20 },
  dayViewDate: { color: "#fff", fontSize: 24, fontWeight: "600", marginBottom: 20, textAlign: "center" },
  dayViewOutfit: { alignItems: "center" },
  outfitLabel: { color: "#FFE6A7", fontSize: 18, fontWeight: "600", marginBottom: 12 },
  dayOutfitImage: { width: 100, height: 140, borderRadius: 10, marginRight: 12 },
});

// import moment from "moment";
// import { useState } from "react";
// import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
// import { Calendar } from "react-native-calendars";

// export default function CalendarSwitcher() {
//   const [viewMode, setViewMode] = useState<"week" | "month" | "day">("week");
//   const [currentWeekStart, setCurrentWeekStart] = useState(moment().startOf("week"));
//   const [selectedDay, setSelectedDay] = useState<string>(moment().format("YYYY-MM-DD"));

//   // Calculate current week
//   const weekDays = Array.from({ length: 7 }).map((_, i) =>
//     currentWeekStart.clone().add(i, "days")
//   );

//   const todayStr = moment().format("YYYY-MM-DD");

//   // Week navigation
//   const goToNextWeek = () => setCurrentWeekStart((prev) => prev.clone().add(1, "week"));
//   const goToPrevWeek = () => setCurrentWeekStart((prev) => prev.clone().subtract(1, "week"));

//   return (
//     <View style={styles.container}>
//       {/* View Mode Buttons */}
//       <View style={styles.viewModeContainer}>
//         {["week", "month", "day"].map((mode) => (
//           <TouchableOpacity
//             key={mode}
//             style={[styles.viewModeButton, viewMode === mode && styles.viewModeSelected]}
//             onPress={() => setViewMode(mode as any)}
//           >
//             <Text style={styles.viewModeText}>{mode.toUpperCase()}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* Render based on mode */}
//       {viewMode === "week" && (
//         <ScrollView style={styles.scrollContainer}>
//           {weekDays.map((day) => {
//             const dayStr = day.format("YYYY-MM-DD");
//             const isSelected = dayStr === selectedDay;
//             const isToday = dayStr === todayStr;

//             return (
//               <TouchableOpacity
//                 key={dayStr}
//                 onPress={() => setSelectedDay(dayStr)}
//                 style={[styles.day, isSelected && styles.selectedDay, isToday && styles.todayHighlight]}
//               >
//                 <Text style={styles.dayText}>{day.format("dddd, MMM D")}</Text>
//                 {isSelected && <Text style={styles.selectedText}>Tap to add an outfit</Text>}
//               </TouchableOpacity>
//             );
//           })}

//           <View style={styles.buttonContainer}>
//             <TouchableOpacity style={styles.navButton} onPress={goToPrevWeek}>
//               <Text style={styles.navButtonText}>Previous Week</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.navButton} onPress={goToNextWeek}>
//               <Text style={styles.navButtonText}>Next Week</Text>
//             </TouchableOpacity>
//           </View>
//         </ScrollView>
//       )}

//       {viewMode === "month" && (
//         <Calendar
//           current={selectedDay}
//           onDayPress={(day) => setSelectedDay(day.dateString)}
//           markedDates={{
//             [selectedDay]: { selected: true, selectedColor: "#4328" },
//           }}
//           theme={{
//             calendarBackground: "#BB9457",
//             dayTextColor: "#fff",
//             monthTextColor: "#fff",
//             arrowColor: "#fff",
//           }}
//         />
//       )}

//       {viewMode === "day" && (
//         <View style={styles.dayView}>
//           <Text style={styles.dayText}>{moment(selectedDay).format("dddd, MMM D, YYYY")}</Text>
//           <Text style={styles.selectedText}>Add outfits for this day</Text>
//         </View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#BB9457", padding: 20 },
//   scrollContainer: { flex: 1, marginBottom: 10 },
//   day: { backgroundColor: "#4328", padding: 20, borderRadius: 10, marginBottom: 12 },
//   selectedDay: { borderColor: "#432818", borderWidth: 2 },
//   todayHighlight: { borderColor: "#FFE6A7", borderWidth: 2 },
//   dayText: { color: "#fff", fontSize: 18, fontWeight: "600" },
//   selectedText: { color: "#FFE6A7", marginTop: 5, fontSize: 14, fontStyle: "italic" },
//   buttonContainer: { flexDirection: "row", justifyContent: "space-between" },
//   navButton: { backgroundColor: "#432818", padding: 12, borderRadius: 8, width: "48%", alignItems: "center" },
//   navButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
//   viewModeContainer: { flexDirection: "row", justifyContent: "space-around", marginBottom: 12 },
//   viewModeButton: { padding: 10, borderRadius: 8, backgroundColor: "#432818" },
//   viewModeSelected: { borderColor: "#FFE6A7", borderWidth: 2 },
//   viewModeText: { color: "#fff", fontWeight: "600" },
//   dayView: { flex: 1, justifyContent: "center", alignItems: "center" },
// });