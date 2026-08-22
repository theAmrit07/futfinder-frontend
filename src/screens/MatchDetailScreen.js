import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getMatch, joinMatch, leaveMatch, deleteMatch } from "../api/matchesApi";
import { useAuth } from "../context/AuthContext";

/**
 * MatchDetailScreen
 *
 * Ownership check: `match.created_by === user.id`. Both sides need to be
 * the same type for this to work correctly — `user.id` comes decoded
 * from the JWT as a number (see client.js's decodeJwtPayload), and
 * Django's ModelSerializer also serializes a ForeignKey as a plain
 * number by default, so this comparison is safe as-is. If you ever
 * change the serializer to nest the full user object instead of just
 * the ID, this comparison would need to change too.
 *
 * Note on the missing roster/player-count data (flagged before this was
 * built): this screen can only show `total_slots` and `status`
 * (open/full/cancelled) — there's no endpoint returning how many people
 * have actually joined or who they are, so that's genuinely not
 * displayable yet without a backend addition.
 */
function MatchDetailScreen({ route, navigation }) {
  const { matchId } = route.params;
  const { user } = useAuth();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  const fetchMatch = async () => {
    try {
      setError(null);
      const data = await getMatch(matchId);
      setMatch(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMatch().finally(() => setLoading(false));
    }, [matchId])
  );

  const handleJoin = async () => {
    setActionInProgress(true);
    try {
      await joinMatch(matchId);
      await fetchMatch(); // refresh to pick up the new status (open -> full, if this filled the last slot)
    } catch (err) {
      Alert.alert("Couldn't join", err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleLeave = async () => {
    setActionInProgress(true);
    try {
      await leaveMatch(matchId);
      await fetchMatch();
    } catch (err) {
      Alert.alert("Couldn't leave", err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete match?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setActionInProgress(true);
          try {
            await deleteMatch(matchId);
            navigation.goBack();
          } catch (err) {
            Alert.alert("Couldn't delete", err.message);
            setActionInProgress(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (error || !match) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Couldn't load this match{error ? `: ${error}` : ""}.</Text>
      </View>
    );
  }

  const isOwner = user?.id != null && match.created_by === user.id;

  return (
    <View style={styles.container}>
      <Text style={styles.futsalName}>{match.futsal_name}</Text>
      <Text style={[styles.statusText, statusColor(match.status)]}>
        {match.status.toUpperCase()}
      </Text>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Location</Text>
        <Text style={styles.detailValue}>{match.location}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Date</Text>
        <Text style={styles.detailValue}>{match.date}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Time</Text>
        <Text style={styles.detailValue}>{match.time?.slice(0, 5)}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Total Slots</Text>
        <Text style={styles.detailValue}>{match.total_slots}</Text>
      </View>

      <View style={styles.actions}>
        {isOwner ? (
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDelete}
            disabled={actionInProgress}
          >
            {actionInProgress ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Delete Match</Text>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, styles.joinButton, match.status !== "open" && styles.buttonDisabled]}
              onPress={handleJoin}
              disabled={actionInProgress || match.status !== "open"}
            >
              {actionInProgress ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>
                  {match.status === "open" ? "Join Match" : "Match Full"}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.leaveButton]}
              onPress={handleLeave}
              disabled={actionInProgress}
            >
              <Text style={styles.leaveButtonText}>Leave Match</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

function statusColor(status) {
  if (status === "open") return { color: "#16a34a" };
  if (status === "full") return { color: "#ea580c" };
  return { color: "#dc2626" };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    color: "#dc2626",
    textAlign: "center",
  },
  futsalName: {
    fontSize: 24,
    fontWeight: "900",
    color: "#171a1f",
  },
  statusText: {
    fontWeight: "700",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  detailLabel: {
    color: "#64748b",
    fontWeight: "600",
  },
  detailValue: {
    color: "#171a1f",
    fontWeight: "600",
  },
  actions: {
    marginTop: 32,
    gap: 12,
  },
  button: {
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  joinButton: {
    backgroundColor: "#16a34a",
  },
  leaveButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#dc2626",
  },
  deleteButton: {
    backgroundColor: "#dc2626",
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  leaveButtonText: {
    color: "#dc2626",
    fontWeight: "700",
    fontSize: 16,
  },
});

export default MatchDetailScreen;
