import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import MatchesListScreen from "../screens/MatchesListScreen";
import MatchDetailScreen from "../screens/MatchDetailScreen";
import CreateMatchScreen from "../screens/CreateMatchScreen";

const Stack = createNativeStackNavigator();

/**
 * AppNavigator
 *
 * The core pattern: which SET of screens exists is decided by
 * `isAuthenticated`, not by guarding individual screens the way
 * BookNest's <ProtectedRoute> did on the web. React Navigation has no
 * concept of a URL to redirect from/to, so instead of gating one
 * protected route, the whole navigator swaps between two entirely
 * separate stacks — logged out users literally cannot navigate to
 * MatchesListScreen because it doesn't exist in their stack at all, not
 * because a check redirects them away from it.
 *
 * `loading` (from AuthContext) covers the moment on app start where
 * we're still checking AsyncStorage for a saved session — without this,
 * the app would flash the login screen for a split second even for
 * someone who's already logged in, every time they reopen the app.
 */
function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MatchesList" component={MatchesListScreen} />
            <Stack.Screen
              name="MatchDetail"
              component={MatchDetailScreen}
              options={{ headerShown: true, title: "Match Details" }}
            />
            <Stack.Screen
              name="CreateMatch"
              component={CreateMatchScreen}
              options={{ headerShown: true, title: "New Match" }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
