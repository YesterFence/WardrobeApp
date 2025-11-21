import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Calendar } from "react-native-calendars";
import moment from "moment";
import { useState } from "react";

export default function CalendarSwitcher() {
  const [viewMode, setViewMode] = useState<"week" | "month" | "day">("week");
  const [currentWeekStart, setCurrentWeekStart] = useState(moment().startOf("week"));
  const [selectedDay, setSelectedDay] = useState<string>(moment().format("YYYY-MM-DD"));

  // Calculate current week
  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    currentWeekStart.clone().add(i, "days")
  );

  const todayStr = moment().format("YYYY-MM-DD");

  // Week navigation
  const goToNextWeek = () => setCurrentWeekStart((prev) => prev.clone().add(1, "week"));
  const goToPrevWeek = () => setCurrentWeekStart((prev) => prev.clone().subtract(1, "week"));

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

            return (
              <TouchableOpacity
                key={dayStr}
                onPress={() => setSelectedDay(dayStr)}
                style={[styles.day, isSelected && styles.selectedDay, isToday && styles.todayHighlight]}
              >
                <Text style={styles.dayText}>{day.format("dddd, MMM D")}</Text>
                {isSelected && <Text style={styles.selectedText}>Tap to add an outfit</Text>}
              </TouchableOpacity>
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
        <Calendar
          current={selectedDay}
          onDayPress={(day) => setSelectedDay(day.dateString)}
          markedDates={{
            [selectedDay]: { selected: true, selectedColor: "#4328" },
          }}
          theme={{
            calendarBackground: "#BB9457",
            dayTextColor: "#fff",
            monthTextColor: "#fff",
            arrowColor: "#fff",
          }}
        />
      )}

      {viewMode === "day" && (
        <View style={styles.dayView}>
          <Text style={styles.dayText}>{moment(selectedDay).format("dddd, MMM D, YYYY")}</Text>
          <Text style={styles.selectedText}>Add outfits for this day</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#BB9457", padding: 20 },
  scrollContainer: { flex: 1, marginBottom: 10 },
  day: { backgroundColor: "#4328", padding: 20, borderRadius: 10, marginBottom: 12 },
  selectedDay: { borderColor: "#432818", borderWidth: 2 },
  todayHighlight: { borderColor: "#FFE6A7", borderWidth: 2 },
  dayText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  selectedText: { color: "#FFE6A7", marginTop: 5, fontSize: 14, fontStyle: "italic" },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between" },
  navButton: { backgroundColor: "#432818", padding: 12, borderRadius: 8, width: "48%", alignItems: "center" },
  navButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  viewModeContainer: { flexDirection: "row", justifyContent: "space-around", marginBottom: 12 },
  viewModeButton: { padding: 10, borderRadius: 8, backgroundColor: "#432818" },
  viewModeSelected: { borderColor: "#FFE6A7", borderWidth: 2 },
  viewModeText: { color: "#fff", fontWeight: "600" },
  dayView: { flex: 1, justifyContent: "center", alignItems: "center" },
});
