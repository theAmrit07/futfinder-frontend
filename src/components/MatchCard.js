import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const STATUS_COLORS = {
  open: "#16a34a",
  full: "#ea580c",
  cancelled: "#dc2626",
};

/**
 * MatchCard
 * Pure presentational component — takes a match object and an onPress
 * handler, renders it, nothing else. All the actual join/leave logic
 * lives in MatchDetailScreen, not here; this card is just for the list.
 */
function MatchCard({ match, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.futsalName}>{match.futsal_name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[match.status] || "#64748b" }]}>
          <Text style={styles.statusText}>{match.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.location}>📍 {match.location}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.detail}>{match.date} · {match.time?.slice(0, 5)}</Text>
        <Text style={styles.detail}>{match.total_slots} slots</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  futsalName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#171a1f",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
  location: {
    color: "#64748b",
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detail: {
    color: "#475569",
    fontSize: 13,
  },
});

export default MatchCard;
