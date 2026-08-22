import { apiRequest } from "./client";

/**
 * matchesApi.js
 * One function per endpoint your Django `matches` app exposes. Every
 * screen that needs match data calls these — none of them build fetch
 * calls or handle tokens directly. If an endpoint's URL or shape ever
 * changes on the backend, this is the only file that needs updating.
 */

export function listMatches() {
  return apiRequest("/matches/");
}

export function getMatch(id) {
  return apiRequest(`/matches/${id}/`);
}

/**
 * createMatch({ location, date, time, futsal_name, total_slots })
 * `date` must be "YYYY-MM-DD", `time` must be "HH:MM:SS" — Django's
 * DateField/TimeField expect exactly those formats. The Create Match
 * screen builds strings in that shape before calling this.
 */
export function createMatch(matchData) {
  return apiRequest("/matches/", {
    method: "POST",
    body: JSON.stringify(matchData),
  });
}

/**
 * updateMatch — only works if the logged-in user is the match's creator;
 * the backend enforces that (perform_update in views.py), this just
 * sends the request. A non-owner calling this gets a 403 back, which
 * apiRequest turns into a thrown Error the screen can catch and display.
 */
export function updateMatch(id, matchData) {
  return apiRequest(`/matches/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(matchData),
  });
}

export function deleteMatch(id) {
  return apiRequest(`/matches/${id}/`, { method: "DELETE" });
}

export function joinMatch(id) {
  return apiRequest(`/matches/${id}/join/`, { method: "POST" });
}

export function leaveMatch(id) {
  return apiRequest(`/matches/${id}/leave/`, { method: "POST" });
}
