import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as authApi from "../api/authApi";
import { getTokens, clearTokens, getCurrentUserId } from "../api/client";

/**
 * AuthContext
 *
 * Same shape as the Firebase version from the last project (user,
 * isAuthenticated, loading, login, logout) — anything that already knows
 * that pattern transfers directly. The difference is what's UNDER the
 * hood: no Firebase SDK here, just plain JWT tokens from your Django API,
 * stored in AsyncStorage (see api/client.js for the token storage itself).
 *
 * WHY `username` IS STORED SEPARATELY FROM THE TOKENS:
 * Django's login endpoint (simplejwt's TokenObtainPairView) returns ONLY
 * { access, refresh } — no username or user info. The access token is a
 * JWT that technically contains a user ID inside it, but decoding it just
 * to display a name is unnecessary work when we already know the
 * username the moment the user types it into the login form. So it's
 * saved to AsyncStorage as plain text right alongside the tokens.
 */
const AuthContext = createContext(null);

const USERNAME_KEY = "futsalfinder_username";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = logged out, { username } = logged in
  const [loading, setLoading] = useState(true);

  // On app start: check if a token + username are already saved from a
  // previous session, so the user doesn't have to log in every time they
  // reopen the app. This is the mobile-app equivalent of what Firebase's
  // onAuthStateChanged did automatically for BookNest.
  useEffect(() => {
    (async () => {
      const { access } = await getTokens();
      const savedUsername = await AsyncStorage.getItem(USERNAME_KEY);
      if (access && savedUsername) {
        const userId = await getCurrentUserId();
        setUser({ username: savedUsername, id: userId });
      }
      setLoading(false);
    })();
  }, []);

  const login = async (username, password) => {
    await authApi.login(username, password);
    await AsyncStorage.setItem(USERNAME_KEY, username);
    const userId = await getCurrentUserId();
    setUser({ username, id: userId });
  };

  /**
   * signup(username, email, password)
   * Your Django /auth/register/ endpoint only creates the account — it
   * does NOT return tokens or log the user in. So this does two requests
   * back to back: register, then immediately login with the same
   * credentials, so signing up feels like one action to the user even
   * though it's two API calls underneath.
   */
  const signup = async (username, email, password) => {
    await authApi.register(username, email, password);
    await login(username, password);
  };

  const logout = async () => {
    await clearTokens();
    await AsyncStorage.removeItem(USERNAME_KEY);
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: user !== null,
    loading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an <AuthProvider>");
  }
  return context;
}
