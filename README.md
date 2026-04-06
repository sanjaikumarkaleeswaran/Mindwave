# 🧠 MindWave: Your AI-Powered Life OS

A self-hosted, private **"digital brain"** that organizes your entire life. MindWave combines intelligent AI chat, habit tracking, smart goal planning, journaling, and focus tools into a single, cohesive operating system for your daily routine — fully optimized for both desktop and mobile.

---

## 🌟 Key Features

### 🤖 Intelligent AI Assistant
- **Granular Model Selection** — toggle between **Llama 3.3 70B** (Smartest), **DeepSeek R1 70B** (Reasoning), **Llama 3 70B** (Fast), or **Gemma 2 9B** directly from the chat interface. Preferences are saved to your profile.
- **Multimodal Vision AI** — upload images including **Strava activity screenshots** for performance analysis. The backend automatically switches to **Llama 4 Scout** (`meta-llama/llama-4-scout-17b-16e-instruct`) — Groq's latest multimodal vision model — to analyze your data visually.
- **True Vector RAG (Document Intelligence)** — upload PDFs, TXT, or JSON files. The local Node.js server automatically chunks documents, generates 384-dimensional mathematical embeddings using `@xenova/transformers` (`all-MiniLM-L6-v2`), and retrieves relevant context using cosine similarity.
- **Interactive Tool Execution** — control your Life OS via chat. Say *"I drank water"* or *"Add a running habit"* and the AI updates your tracker automatically. It can also create full structured goal plans.
- **Voice Interface (STT & TTS)** — Tap the microphone icon for **Speech-to-Text** dictation. Toggle the speaker icon for **Text-to-Speech** responses with natural voice synthesis.

### 🎯 Smart Goal Tracking
- **AI Goal Plan Creator** — describe a goal (e.g., *"I want to run a marathon in 3 months"*); the AI generates a full structured plan with category, target date, and 5–7 specific milestones.
- **Dynamic Milestone Timeline** — a beautiful visual timeline with numbered steps, due date countdowns (*"2d overdue"*), and spine connector lines.
- **Activity Logging** — click any step to open an activity modal, log what you did, and mark the step complete.
- **Calendar View** — a unified monthly grid showing all milestone due dates, color-coded by category.
- **Animated Progress Rings** — high-quality circular progress indicators on every goal card and dashboard summary.

### 📅 Advanced Habit Tracker
- **Streak & Consistency Tracking** — monitor daily progress with current/best streaks and weekly calendar heatmaps.
- **AI Habit Insights** — ask for a performance report; the AI analyzes your data to provide qualitative feedback and actionable weekly challenges.
- **Table View by Default** — the habit tracker defaults to a scrollable table with sticky habit names, showing the last 7 days at a glance on desktop.
- **Premium Mobile Cards** — mobile users automatically receive a highly optimized native-app experience, where scrolling tables are replaced by beautiful touch-friendly cards featuring 7-day mini-heatmaps and glowing completion effects.

### ✍️ Intelligent Journaling
- **Sentiment & Topic Analysis** — instant AI analysis on every entry that identifies your mood, key topics, and provides wellbeing suggestions.
- **Privacy-First Storage** — all journals are stored securely in your MongoDB instance, never used for training external models.

### 🧘 Focus & Zen
- **Pomodoro-style Timer** — built-in countdown with quick-select presets (5m, 15m, 25m, 50m) and custom hour/minute/second picker to help you stay in flow state.
- **Smart Ambient Soundscapes** — curated royalty-free audio tracks that automatically play when the timer starts and pause when it stops.
- **Custom Native Notifications** — no external MP3s needed! Procedural chimes and beeps are generated directly using the browser's native Web Audio API for session completion alerts.
- **Mobile-Safe Completion Alerts** — timer completion uses `ServiceWorkerRegistration.showNotification()` on Android (avoids the `Notification` constructor restriction) combined with the custom audio chimes.

### 🔔 Proactive Systems
- **Smart Notification Bell** — real-time alerts for overdue milestones, habits at risk of losing streaks, and daily reminders.
- **Global Semantic Search** — one search bar to find anything across goals, habits, and journals. Includes **vector-search** for content *inside* your uploaded PDFs.

### 📱 Mobile-First Experience
- **Bottom Navigation Bar** — persistent mobile nav with smooth spring-animated active indicator that sits flush at the top of the bar.
- **Safe Area Inset Support** — proper padding for iPhone notches, Dynamic Island, and home indicator bars.
- **Dynamic Chat Layout** — the chat page uses CSS variables (`--header-h`, `--bottom-nav-h`) to precisely fill the screen between the header and bottom nav on all devices.
- **Responsive Dashboard** — 2-column card grid on mobile with scaled-down icons and typography, expanding to 4-column on large screens.
- **iOS Input Zoom Prevention** — all inputs are set to `font-size: 16px` on mobile to prevent Safari's auto-zoom behavior.

### 🛡️ Security & Privacy
- **Self-Hosted** — you own your data, stored in your own MongoDB instance.
- **Data Portability** — Export everything (Journals, Habits, Goals, Chat) as **JSON** or **CSV**. Features a visual date-range slider.
- **Privacy Controls** — "Danger Zone" in settings to permanently wipe all data and account.
- **Security Hardened** — Helmet, rate-limiting, XSS sanitization, and NoSQL injection prevention.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Framer Motion, Lucide Icons |
| **State / Routing** | React Context, React Router v7, React Query (TanStack) |
| **PWA** | Vite PWA Plugin, Web App Manifest, Service Worker |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB via Mongoose 9 |
| **AI Engine** | Groq SDK (Llama 3.3 70B, DeepSeek R1 70B, **Llama 4 Scout** Vision) |
| **Vector RAG** | `@xenova/transformers` (Local Node.js embeddings), Cosine Similarity |
| **Auth** | Custom JWT + Bcrypt + Nodemailer (for password resets) |
| **Security** | Helmet, express-rate-limit, HPP, custom XSS & Mongo sanitizers |

---

## 🚀 Getting Started

### Prerequisites
1. **Node.js** v18+
2. **MongoDB** instance (Local or Atlas)
3. **Groq API Key** — [console.groq.com](https://console.groq.com)
4. **Gmail App Password** (Optional) — for password resets

### Installation

```bash
# 1. Clone & Enter
git clone https://github.com/sanjaikumarkaleeswaran/Mindwave.git
cd Mindwave

# 2. Server setup
cd server && npm install
cp .env.example .env # create your .env

# 3. Client setup
cd ../client && npm install
npm run build # for production mode
```

### Running Locally

**One click (Windows):** Double-click `start_app.bat`.

**Manual:**
- Terminal 1 (Backend): `cd server && npm start`
- Terminal 2 (Frontend): `cd client && npm run dev`

---

## 📂 Project Structure

```
Mindwave/
├── client/                     # React Frontend (Vite)
│   ├── src/
│   │   ├── components/         # NotificationBell, GlobalSearch, Sidebar, Layout
│   │   ├── pages/              # Goals, Habits, Journal, Chat, Focus, Profile
│   │   ├── context/            # Auth, Theme
│   │   └── lib/                # Axios, utils
│   └── public/                 # PWA icons & manifest
│
├── server/                     # Node.js Backend (Express)
│   ├── models/                 # User, Goal, Habit, Journal, VectorChunk
│   ├── routes/                 # Auth, Chat (Tool & RAG), Search, Goals, Habits
│   ├── middleware/             # Auth, Security (XSS, RateLimit, Sanitize)
│   ├── utils/                  # VectorStore, LLM Orchestration
│   └── index.js                # Entry point
│
└── start_app.bat               # Automated startup script
```

---

## 📱 Mobile PWA Installation

MindWave is fully optimized for mobile with a native app-like experience.

Navigate to your local IP (e.g., `http://192.168.1.5:5173`) on your mobile browser.
- **Android:** "Install App" from the Chrome menu.
- **iOS:** "Add to Home Screen" from the Safari share sheet.

**Mobile UX highlights:**
- Bottom tab navigation with active state animations flush to the top edge of the bar
- Safe-area padding for notch/home-bar devices (iPhone X+)
- Full-screen chat view between header and bottom nav
- Responsive 2-column grids on small screens
- Touch-friendly tap targets across all interactive elements
- Habit table defaults to visible with horizontal scroll (only table scrolls, not the page)

---

## ☁️ Deployment

This application is ready for production deployment:
- **Frontend**: Deploy `client/` to **Vercel** or **Netlify**.
- **Backend**: Deploy `server/` to **Render** or **Railway**.
- *Note: Ensure `ALLOWED_ORIGINS` in `server/index.js` includes your frontend URL.*

---

## 🔮 Roadmap

- [x] AI Chat with habit/goal tool execution
- [x] True Vector RAG for document chat
- [x] Multimodal Vision AI for image analysis
- [x] Smart Notification Bell with local triggers
- [x] Goal tracking with AI milestone generation
- [x] Mobile PWA support
- [x] Advanced Data Export (JSON/CSV)
- [x] Voice Interface (STT & TTS)
- [x] Full mobile UI optimization (safe area, bottom nav, responsive grids)
- [x] Mobile-safe timer completion notifications (ServiceWorker API)
- [ ] Backend-driven Push Notifications (Web Push API)
- [ ] Shared Goals & Collaboration features
- [ ] Integration with External Calendars (Google/Outlook)

---

## 📋 Changelog

### April 6, 2026 — Premium Mobile Experiences & Focus Audio Updates
- 📱 **Habit Tracker Mobile Redesign** — completely removed the horizontal-scrolling table on mobile devices in favor of a sleek, native-app style card list. Includes custom active tap states, glowing visual indicators when a habit is completed, and beautiful 7-day mini-heatmaps inside each card.
- 🎵 **Smart Focus Timer & Presets** — added quick-select "Easy Time" preset buttons (5m, 15m, 25m, 50m). Ambient background music now automatically syncs with the timer state (auto-play on start, auto-pause on finish).
- 🔔 **Web Audio API Notification Alerts** — built a custom sound engine that procedurally generates a "Gentle Chime" or "Digital Beeps" directly from the browser's audio context, resolving the need for downloading external MP3 files for timer completion alerts.

### April 5, 2026 — Mobile Navigation and Layout Refinements
- 📱 **Bottom Nav Indicator Framer Motion Glitch Fixed** — replaced the conditionally rendered `motion.div` indicator with an always-rendered `div` that toggles `opacity`. This prevents Framer Motion's `layoutId` from miscalculating the indicator's position after page navigation.
- 🚫 **Habits Page Overflow Polish** — resolved horizontal scroll bleed issues on mobile by adding `overflow-x-hidden` to the root container, ensuring the flex header controls use `overflow-hidden`, and constraining the 60-day heatmap bars to a single scrollable line strictly within its card boundaries without `min-w-max` breaking the page layout.

### April 3, 2026 — Mobile UI Bug Fixes
- 🔧 **Bottom Nav Indicator Aligned** — active tab indicator line now sits flush at the very top of the navigation bar (changed from `items-start pt-2` with gap to `items-stretch` + `justify-start` layout, `h-[2px]` indicator at `absolute top-0`).
- 📊 **Habits Table View Default** — habit tracker now defaults to `table` view on all screen sizes (previously auto-switched to `grid` on mobile). User's view selection is preserved across resizes.
- 🚫 **Page Horizontal Scroll Fixed** — added `overflow-x-hidden` to the HabitsPage container so only the internal table scrolls left-right, not the entire page.
- 🔔 **Timer Notification API Fixed** — replaced `new Notification()` (which throws `TypeError: Failed to construct 'Notification': Illegal constructor` on Android) with `ServiceWorkerRegistration.showNotification()` when a service worker is active, with a desktop fallback.

### April 2, 2026 — Mobile UI Overhaul
- 📱 **Comprehensive Mobile Optimization** across all pages:
  - Added `--header-h` and `--bottom-nav-h` CSS variables for dynamic layout calculations
  - `mobile-page-pad` utility with `env(safe-area-inset-bottom)` support for notch devices
  - ChatPage uses CSS-variable-driven positioning to fill screen between header and bottom nav
  - Dashboard upgraded to 2-column card grid on mobile with scaled icons and typography
  - Applied consistent mobile bottom padding to HabitsPage, JournalPage, ProfilePage, GoalsPage, FocusPage
  - Chat welcome screen uses 2-column suggestion grid on mobile
- 🔄 **Vision Model Upgraded** — migrated from deprecated `llama-3.2-11b-vision-instant` to `meta-llama/llama-4-scout-17b-16e-instruct` (Llama 4 Scout), Groq's current multimodal vision model with 128K context and up to 5 images per request.

---

## 📄 License

MIT — feel free to fork and customize your own Life OS.
