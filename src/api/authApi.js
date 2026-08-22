import { apiRequest, setTokens } from "./client";

/**
 * register(username, email, password)
 * Matches your register view exactly: it expects these three fields and
 * returns a plain success message, NOT a token — Django doesn't log the
 * user in automatically after registering. That's why AuthContext calls
 * login() right after a successful signup, as a separate second request.
 */
export async function register(username, email, password) {
  return apiRequest("/auth/register/", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

/**
 * login(username, password)
 * Hits simplejwt's TokenObtainPairView, which returns { access, refresh }.
 * Saves both immediately — every subsequent apiRequest() call picks the
 * access token up automatically from storage.
 */
export async function login(username, password) {
  const data = await apiRequest("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  await setTokens({ access: data.access, refresh: data.refresh });
  return data;
}
