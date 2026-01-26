# Implementation Plan - "1234" Upgrade

## 1. Global Persistent Music Player
- **Goal**: Music continues playing while navigating.
- **Tasks**:
  - [ ] Create `MusicContext.jsx` to manage `isPlaying`, `currentTrack`, `queue`, `play`, `pause`.
  - [ ] Create `MusicPlayer.jsx` component (Floating Bottom Bar or Sidebar integrated).
  - [ ] Update `Layout.jsx` to wrap `Outlet` with `MusicProvider` (or at App level) and render `MusicPlayer`.
  - [ ] Integrate YouTube Logic (from `FocusPage` and `YOUTUBE_API_INTEGRATION.md`) into `MusicContext`.

## 2. User Profile & Settings
- **Goal**: Users can manage their account.
- **Tasks**:
  - [ ] Update `User` model in backend (`server/models/User.js`) to include `avatar`.
  - [ ] Create `ProfilePage.jsx` in frontend.
  - [ ] Add `updateProfile` endpoint in `auth.routes.js`.
  - [ ] Add `updateUser` function in `AuthContext.jsx`.

## 3. Intelligent Dashboard
- **Goal**: Dynamic "Command Center".
- **Tasks**:
  - [ ] Update `Dashboard.jsx`.
  - [ ] Fetch Habit summary.
  - [ ] Fetch recent Chat snippets.
  - [ ] Add "Daily Quote" logic.

## 4. Visual Polish
- **Goal**: "Wow" factor.
- **Tasks**:
  - [ ] Update `index.css`: Add `glass` utility classes.
  - [ ] Update `Sidebar.jsx`: specialized glass effect.
  - [ ] Add animations (framer-motion).

---
## Execution Order
1.  **Global Music Player** (Highest Impact)
2.  **Visual Polish** (Best "Wow" for effort)
3.  **Profile & Dashboard** (Functionality)
