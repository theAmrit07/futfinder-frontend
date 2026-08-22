import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { createMatch } from "../api/matchesApi";

/**
 * CreateMatchScreen
 *
 * Plain text inputs for date/time rather than a native date picker — kept
 * simple on purpose so this works identically on web, iOS, and Android
 * without pulling in an extra native-config-heavy library. The trade-off
 * is real: a text field lets someone type "13/45" and only find out it's
 * invalid when Django rejects it. A production version should use
 * @react-native-community/datetimepicker (native) with a web fallback —
 * flagged here as a known simplification, not an oversight.
 *
 * Django's DateField/TimeField are strict about format:
 *   date must be exactly "YYYY-MM-DD"   e.g. 2026-09-14
 *   time must be exactly "HH:MM:SS"     e.g. 18:30:00
 * The hints in each input's placeholder tell the user the expected
 * format; there's no client-side format validation beyond that — Django
 * will reject a malformed value and this screen surfaces that error as-is.
 */
function CreateMatchScreen({ navigation }) {
  const [futsalName, setFutsalName] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [totalSlots, setTotalSlots] = useState("10");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    setError(null);

    const slotsNumber = parseInt(totalSlots, 10);
    if (!futsalName || !location || !date || !time || !slotsNumber) {
      setError("Please fill in every field.");
      return;
    }

    setSubmitting(true);
    try {
      await createMatch({
        futsal_name: futsalName,
        location,
        date,
        // Django's TimeField accepts "HH:MM" too, but appending seconds
        // avoids relying on that leniency and matches the format Django
        // itself returns for existing matches.
        time: time.length === 5 ? `${time}:00` : time,
        total_slots: slotsNumber,
      });
      navigation.goBack(); // MatchesListScreen's useFocusEffect re-fetches automatically
    } catch (err) {
      setError(err.message || "Couldn't create match.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create a Match</Text>

      <Text style={styles.label}>Futsal Court Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Greenfield Arena"
        value={futsalName}
        onChangeText={setFutsalName}
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Kathmandu, Baneshwor"
        value={location}
        onChangeText={setLocation}
      />

      <Text style={styles.label}>Date</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD (e.g. 2026-09-14)"
        value={date}
        onChangeText={setDate}
      />

      <Text style={styles.label}>Time</Text>
      <TextInput
        style={styles.input}
        placeholder="HH:MM, 24-hour (e.g. 18:30)"
        value={time}
        onChangeText={setTime}
      />

      <Text style={styles.label}>Total Slots</Text>
      <TextInput
        style={styles.input}
        placeholder="10"
        keyboardType="number-pad"
        value={totalSlots}
        onChangeText={setTotalSlots}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Create Match</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#171a1f",
    marginBottom: 20,
  },
  label: {
    fontWeight: "600",
    color: "#243e63",
    marginBottom: 6,
    fontSize: 13,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    fontSize: 15,
  },
  button: {
    backgroundColor: "#16a34a",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  error: {
    color: "#dc2626",
    marginBottom: 12,
    textAlign: "center",
  },
});

export default CreateMatchScreen;
