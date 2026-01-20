# Personal AI Life OS - Implementation Plan

## 1. Project Overview
A single-user, self-hosted web application acting as a "digital brain".
**Core Modules:**
- **AI Chatbot**: Context-aware, persistent memory, tool usage (Music/Habits).
- **Music Player**: Self-hosted audio streaming, mood-based AI suggestions, Spotify-like UI.
- **Habit Tracker**: Streak, frequency, and completion tracking.

## 2. Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Lucide React (Icons).
- **Backend**: Node.js, Express.
- **Database**: MongoDB Atlas.
- **Auth**: JWT (JSON Web Tokens).
- **AI**: Integration with a generic LLM provider (e.g., OpenAI/Gemini via API). *Note: We will set up the structure/interface for the AI.*

## 3. Database Schemas (MongoDB)

### User
```json
{
  "name": "String",
  "email": "String",
  "password": "String (Hashed)",
  "preferences": {
    "theme": "String (dark/light)",
    "aiTone": "String"
  },
  "createdAt": "Date"
}
```

### Music
```json
{
  "userId": "ObjectId",
  "title": "String",
  "artist": "String",
  "album": "String",
  "duration": "Number", // in seconds
  "moodTags": ["String"], // e.g., 'chill', 'focus'
  "fileUrl": "String", // URL to storage or externall link
  "liked": "Boolean",
  "createdAt": "Date"
}
```

### Playlist
```json
{
  "userId": "ObjectId",
  "name": "String",
  "songs": ["ObjectId (ref: Music)"],
  "createdAt": "Date"
}
```

### Habit
```json
{
  "userId": "ObjectId",
  "name": "String",
  "frequency": "String (daily, weekly)",
  "completedDates": ["Date"],
  "streak": "Number",
  "createdAt": "Date"
}
```

### ChatHistory
```json
{
  "userId": "ObjectId",
  "role": "String (user/assistant)",
  "content": "String",
  "timestamp": "Date"
}
```

## 4. API Design

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Music
- `POST /api/music/upload` (for this MVP, we might just store URLs or handle file uploads if simple)
- `GET /api/music` (Search/Filter)
- `GET /api/music/playlists`
- `POST /api/music/playlists`
- `PUT /api/music/:id/like`

### Habits
- `GET /api/habits`
- `POST /api/habits`
- `POST /api/habits/:id/complete`

### Chat
- `POST /api/chat/send` (Handles AI processing + Tool calling)
- `GET /api/chat/history`

## 5. Frontend Architecture
**Folder Structure:**
- `/src/components`: UI primitives (Button, Input, Card).
- `/src/modules`: Feature specific components (MusicPlayer, ChatWindow, HabitList).
- `/src/pages`: Dashboard, MusicPage, ChatPage, HabitsPage, AuthPage.
- `/src/context`: AuthContext, PlayerContext.

**Key UI Elements:**
- **Sidebar**: Navigation (Chat, Music, Habits).
- **Player Bar**: Persistent at bottom (Play/Pause, Seek, Volume).
- **Main Content**: Dynamic based on route.

## 6. AI System Logic
The AI route (`/api/chat/send`) will:
1. Retrieve recent chat history.
2. Retrieve context (current song, pending habits) if relevant.
3. System Prompt: "You are a personal assistant..."
4. If user asks for music, AI uses a tool/function to find songs by mood and returns a structured "PLAY_MUSIC" command which the frontend executes.

## 7. Implementation Steps
1. **Setup**: Initialize Frontend (Vite) and Backend (Express) folders.
2. **Backend Core**: Connect DB, Auth Middleware, Error Handling.
3. **Backend Features**: Implement Music, Habit, and Chat Routes/Models.
4. **Frontend Core**: Setup Tailwind, Router, Auth Context.
5. **Frontend Features**:
    - **Music Player**: State management for audio (HTML5 Audio).
    - **Dashboard**: Notion-style layout.
    - **Chat Interface**: WebSocket or Polling for interactions.
6. **AI Integration**: Connect Backend to LLM API.

