# Futsal Finder — Mobile App

A React Native (Expo) app for finding and joining futsal matches. Built to run on iOS, Android, and web from a single codebase, consuming a Django REST Framework backend with JWT authentication.

**Live API:** https://futsal-finder.onrender.com

## Features

- Register and log in (JWT, persisted across app restarts)
- Browse open matches
- Create a match
- Join / leave a match
- Delete your own matches
- Runs on iOS, Android, and web

## Tech Stack

- React Native + Expo
- React Navigation (native stack)
- AsyncStorage for token persistence
- Plain `fetch` against a Django REST Framework + SimpleJWT backend

### Project Structure

```text
src/
├── api/                    # Fetch wrappers — one file per API resource
│   ├── client.js          # Base request handler: token attach, auto-refresh, error parsing
│   ├── authApi.js         # Register, login
│   └── matchesApi.js      # List, create, update, delete, join, leave
│
├── context/
│   └── AuthContext.js     # Global auth state
│
├── navigation/
│   └── AppNavigator.js    # Auth stack vs. main app stack
│
├── screens/               # One screen per route
│
└── components/
    └── MatchCard.js       # Match list item

## Getting Started

### Prerequisites

- Node.js 18+
- Expo Go app (for testing on a physical device) or an iOS/Android simulator
- The Futsal Finder Django API running locally, or use the live deployment above

### Installation

```bash
git clone https://github.com/your-username/futsal-finder-app.git
cd futsal-finder-app
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_API_URL=https://futsal-finder.onrender.com 
```

The correct value depends on how you're running the app:

| Target | URL |
|---|---|
| Web browser | `http://localhost:8000/api` |
| Android emulator | `http://10.0.2.2:8000/api` |
| iOS simulator | `http://localhost:8000/api` |
| Physical device (Expo Go) | `http://<your-computer's-LAN-IP>:8000/api` |
| Live deployed API | `https://futsal-finder.onrender.com/api` |

### Run

```bash
npx expo start
```

Then press `w` for web, `a` for Android, `i` for iOS, or scan the QR code with Expo Go.

## Known Limitations

- The API doesn't currently expose how many players have joined a match or who they are — only `total_slots` and `status` (open/full/cancelled) are shown.
- Date and time are entered as plain text (`YYYY-MM-DD` / `HH:MM`), not a native picker.
- Render's free tier spins down when idle — the first request after inactivity can take 30–60 seconds.# futfinder-frontend
