import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { listMatches } from "../api/matchesApi";
import { useAuth } from "../context/AuthContext";
import MatchCard from "../components/MatchCard";

/**
 * MatchesListScreen
 *
 * `useFocusEffect` (not a plain `useEffect`) is the key thing to
 * understand here. A plain useEffect with [] only runs once, the first
 * time this screen mounts. But with React Navigation, screens usually
 * DON'T unmount when you navigate away — they just go off-screen. So if
 * you create a match on CreateMatchScreen and navigate back here, a plain
 * useEffect would NOT re-run, and the list would still show stale data
 * missing your new match. useFocusEffect re-runs its callback every time
 * this screen comes back into focus, which is exactly the refresh timing
 * you want after creating/joining/leaving a match on another screen.
 */
function MatchesListScreen({ navigation }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();

  const fetchMatches = async () => {
    try {
      setError(null);
      const data = await listMatches();
      setMatches(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMatches().finally(() => setLoading(false));
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Open Matches</Text>
          <Text style={styles.greeting}>Hey, {user?.username}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#16a34a" />
      ) : error ? (
        <View style={styles.centerMessage}>
          <Text style={styles.errorText}>Couldn't load matches: {error}</Text>
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.centerMessage}>
          <Text style={styles.emptyText}>No open matches yet. Be the first to create one!</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#16a34a"]} />
          }
          renderItem={({ item }) => (
            <MatchCard
              match={item}
              onPress={() => navigation.navigate("MatchDetail", { matchId: item.id })}
            />
          )}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreateMatch")}
      >
        <Text style={styles.fabText}>+ New Match</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#171a1f",
  },
  greeting: {
    color: "#64748b",
    marginTop: 2,
  },
  logout: {
    color: "#dc2626",
    fontWeight: "600",
    marginTop: 8,
  },
  loader: {
    marginTop: 60,
  },
  centerMessage: {
    padding: 40,
    alignItems: "center",
  },
  errorText: {
    color: "#dc2626",
    textAlign: "center",
  },
  emptyText: {
    color: "#64748b",
    textAlign: "center",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  fabText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
});

export default MatchesListScreen;
