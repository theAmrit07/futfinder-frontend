import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * client.js
 *
 * WHY THE BASE URL IS AN ENV VAR, NOT HARDCODED:
 * This app runs on three different platforms (web, iOS, Android), and each
 * needs a different address to reach a Django server running on YOUR
 * machine during development:
 *   - Web (browser):        http://localhost:8000
 *   - Android emulator:     http://10.0.2.2:8000   (emulator's alias for your machine's localhost)
 *   - iOS simulator:        http://localhost:8000   (works directly, unlike Android)
 *   - Physical phone (Expo Go): http://<your-computer's-LAN-IP>:8000 (e.g. 192.168.1.42)
 *
 * Set EXPO_PUBLIC_API_URL in a .env file at the project root to whichever
 * of these matches how you're testing. Expo automatically exposes any env
 * var prefixed EXPO_PUBLIC_ to your app code — no extra config needed.
 * Once the API is deployed, this becomes your real https:// URL and
 * nothing else in the app changes.
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api";

const ACCESS_TOKEN_KEY = "futsalfinder_access_token";
const REFRESH_TOKEN_KEY = "futsalfinder_refresh_token";

/**
 * decodeJwtPayload(token)
 * A JWT is three base64url segments separated by dots: header.payload.signature.
 * The payload segment is NOT encrypted, just base64-encoded — anyone can
 * read it (that's normal and fine; it's the SIGNATURE that proves it's
 * genuine, verified server-side, never trusted client-side). simplejwt
 * embeds the user's ID in the payload as `user_id`, which is what lets
 * this app know "is the logged-in user the owner of this match" without
 * a dedicated backend endpoint for it.
 *
 * Implemented by hand (not using the browser's atob) so it works
 * identically on web, iOS, and Android without depending on which JS
 * engine's built-in polyfills happen to be available on a given platform.
 */
function decodeJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let output = "";
    let buffer = 0;
    let bits = 0;
    for (const char of padded) {
      if (char === "=") break;
      buffer = (buffer << 6) | chars.indexOf(char);
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        output += String.fromCharCode((buffer >> bits) & 0xff);
      }
    }
    return JSON.parse(decodeURIComponent(escape(output)));
  } catch {
    return null;
  }
}

export async function getCurrentUserId() {
  const { access } = await getTokens();
  if (!access) return null;
  const payload = decodeJwtPayload(access);
  return payload?.user_id ?? null;
}

export async function getTokens() {
  const [access, refresh] = await Promise.all([
    AsyncStorage.getItem(ACCESS_TOKEN_KEY),
    AsyncStorage.getItem(REFRESH_TOKEN_KEY),
  ]);
  return { access, refresh };
}

export async function setTokens({ access, refresh }) {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
}

/**
 * refreshAccessToken()
 * Calls Django's /api/auth/refresh/ (from simplejwt) with the stored
 * refresh token to get a new access token, and saves it. Used by
 * apiRequest below whenever a request comes back 401 (access token
 * expired — they last 1 day per your SIMPLE_JWT settings).
 */
async function refreshAccessToken() {
  const { refresh } = await getTokens();
  if (!refresh) throw new Error("No refresh token available");

  const response = await fetch(`${BASE_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) throw new Error("Refresh token expired or invalid");

  const data = await response.json();
  await setTokens({ access: data.access });
  return data.access;
}

/**
 * apiRequest(path, options)
 * The single function every API call in this app goes through. Handles:
 *   1. Prefixing the base URL
 *   2. Attaching "Authorization: Bearer <token>" automatically when a
 *      token exists — callers never touch headers themselves
 *   3. On a 401 (expired access token): silently refreshes and retries
 *      the request ONCE before giving up. This is what makes a session
 *      last the full 7-day refresh window instead of just 1 day (your
 *      ACCESS_TOKEN_LIFETIME) without the user ever noticing a re-login.
 */
export async function apiRequest(path, options = {}) {
  const { access } = await getTokens();

  const doFetch = async (token) => {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    return fetch(`${BASE_URL}${path}`, { ...options, headers });
  };

  let response = await doFetch(access);

  if (response.status === 401 && access) {
    try {
      const newAccess = await refreshAccessToken();
      response = await doFetch(newAccess);
    } catch {
      // Refresh token is also invalid/expired — genuinely logged out.
      // AuthContext's own logic handles bouncing to login when this happens.
      await clearTokens();
    }
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      // Django REST Framework error bodies vary in shape depending on the
      // error — sometimes {detail: "..."}, sometimes {field: ["..."]}.
      // This covers both without crashing on the ones it doesn't expect.
      message = body.detail || body.error || JSON.stringify(body);
    } catch {
      // Response wasn't JSON — stick with the generic message above.
    }
    throw new Error(message);
  }

  // 204 No Content (e.g. some DELETE responses) has no body to parse.
  if (response.status === 204) return null;
  return response.json();
}
