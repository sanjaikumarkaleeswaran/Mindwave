# 🧠 MindWave: Your AI-Powered Life OS

MindWave is a full-stack personal productivity app I built solo, combining AI chat, habit tracking, journaling, and expense management in one self-hosted platform.

A self-hosted, private **"digital brain"** that organizes your entire life. MindWave combines intelligent AI chat, habit tracking, smart goal planning, journaling, focus tools, and a financial OS into a single, cohesive operating system for your daily routine — fully optimized for both desktop and mobile.

![Lines of Code](https://tokei.rs/b1/github/sanjaikumarkaleeswaran/Mindwave)

## 📸 Screenshots
![Dashboard](./docs/screenshots/dashboard.png)
![Mobile View](./docs/screenshots/mobile.png)

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
- **Collaborative Goal Sharing** — invite teammates via email; all collaborators can update milestones and log activities in real-time.

### 📅 Advanced Habit Tracker
- **Streak & Consistency Tracking** — monitor daily progress with current/best streaks and weekly calendar heatmaps.
- **AI Habit Insights** — ask for a performance report; the AI analyzes your data to provide qualitative feedback and actionable weekly challenges.
- **Table View by Default** — the habit tracker defaults to a scrollable table with sticky habit names, showing the last 7 days at a glance on desktop.
- **Premium Mobile Cards** — mobile users automatically receive a highly optimized native-app experience with touch-friendly cards featuring 7-day mini-heatmaps and glowing completion effects.

### ✍️ Intelligent Journaling
- **Sentiment & Topic Analysis** — instant AI analysis on every entry that identifies your mood, key topics, and provides wellbeing suggestions.
- **Privacy-First Storage** — all journals are stored securely in your MongoDB instance, never used for training external models.

### 📚 Library & Reading Tracker
- **Smart Book Auto-Fill** — seamlessly integrates with the **OpenLibrary API**. Just type a title and it instantly fetches the author, total pages, and high-quality cover art.
- **AI Personal Librarian** — powered by Groq (Llama 3). Ask for recommendations based on mood or genre, and instantly add the AI's suggestions directly to your tracker.
- **Built-in PDF Reader** — upload your own PDF books. The backend automatically extracts the exact page count, and the frontend provides a distraction-free, full-screen PDF viewer with quick-save progress tracking.
- **Progress Tracking** — elegant status management (Want to Read, Reading, Finished) with visual progress bars and dynamic UI updates as you read.

### 💰 Financial OS (Expense Tracker)
- **Bento Grid Dashboard** — a world-class financial command center featuring modular cards for balance tracking, spending analytics, and category distribution.
- **Smart Categorization** — dynamic, type-aware selection logic that filters categories based on Income vs. Expense; includes full localized **INR (₹)** support.
- **Threshold Monitoring** — set monthly budget limits per category with real-time progress tracking and "safe vs. over-limit" visual alerts.
- **Spending Analytics** — high-fidelity weekly and monthly trends visualization with adaptive bar charts and category distribution donut charts.
- **Data Portability** — export your full transaction history to **CSV** for secondary analysis.

### 🧘 Focus & Zen
- **Pomodoro-style Timer** — built-in countdown with quick-select presets (5m, 15m, 25m, 50m) and custom hour/minute/second picker to help you stay in flow state.
- **Smart Ambient Soundscapes** — curated royalty-free audio tracks that automatically play when the timer starts and pause when it stops.
- **Custom Native Notifications** — procedural chimes and beeps are generated directly using the browser's native **Web Audio API** for session completion alerts.
- **Mobile-Safe Completion Alerts** — timer completion uses `ServiceWorkerRegistration.showNotification()` on Android combined with custom audio chimes.

### 🔔 Proactive Systems
- **Smart Notification Bell** — real-time alerts for overdue milestones, habits at risk of losing streaks, and daily reminders.
- **Global Semantic Search** — one search bar to find anything across goals, habits, and journals. Includes **vector-search** for content *inside* your uploaded PDFs.

### 📊 Personalized Productivity & Quick Actions
- **Interactive Productivity Targets** — set your own daily/weekly goals (0–100%) via a high-performance range slider on the dashboard.
- **Horizontal Quick Action Slider** — a touch-optimized scrolling strip for mobile that provides one-tap access to your most-used tools.
- **Dynamic 7-Day Activity Chart** — a glow-accented bar chart visualizing habit completion rates with live status indicators and historical averages.

### 📱 Mobile Experience
- **Compact 8-Item Bottom Navigation** — all core modules accessible via a scrollable bottom nav bar with spring-animated active indicators.
- **Centered Modal System** — all modals (Goals, Activity Log, Delete Confirm, AI Chat) use a clean centered scale-in animation on all screen sizes.
- **Safe Area Inset Support** — proper padding for iPhone notches, Dynamic Island, and home indicator bars using `env(safe-area-inset-*)`.
- **Dynamic View Height** — modals and full-screen layouts use `dvh` units to correctly account for collapsible browser address bars on iOS/Android.
- **Responsive Dashboard** — 2-column card grid on mobile expanding to 4-column on large screens.
- **iOS Input Zoom Prevention** — all inputs set to `font-size: 16px` on mobile to prevent Safari's auto-zoom behavior.

### 🛡️ Security & Privacy
- **Self-Hosted** — you own your data, stored in your own MongoDB instance.
- **Data Portability** — Export everything (Journals, Habits, Goals, Chat) as **JSON** or **CSV** with a visual date-range slider.
- **Privacy Controls** — "Danger Zone" in settings to permanently wipe all data and account.
- **Security Hardened** — Helmet, rate-limiting, XSS sanitization, and NoSQL injection prevention.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v3, Framer Motion, Lucide Icons |
| **Charts** | Recharts (Bento-style analytics) |
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
cp .env.example .env # fill in your keys
# Note: Add your GROQ_API_KEY to server/.env for AI features

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
│   │   ├── components/         # Layout, Sidebar, GlobalSearch, NotificationBell
│   │   │   ├── goals/          # GoalCard, GoalFormModal, AIChatModal, ActivityModal,
│   │   │   │                   #   DeleteModal, ShareModal, goalHelpers
│   │   │   └── expenses/       # ExpenseTable, AddExpenseModal, ManageBudgetsModal
│   │   ├── pages/              # Dashboard, Goals, Habits, Journal, Chat, Focus,
│   │   │                       #   Profile, Expenses, Calendar, Auth
│   │   ├── context/            # Auth, Theme
│   │   └── lib/                # Axios, utils
│   ├── tailwind.config.js      # Custom xs breakpoint + theme tokens
│   └── public/                 # PWA icons & manifest
│
├── server/                     # Node.js Backend (Express)
│   ├── models/                 # User, Goal, Habit, Journal, VectorChunk, Expense, Budget
│   ├── routes/                 # Auth, Chat (Tool & RAG), Search, Goals, Habits, Expenses
│   ├── controllers/            # Business logic handlers
│   ├── middleware/             # Auth, Security (XSS, RateLimit, Sanitize)
│   ├── utils/                  # VectorStore, LLM Orchestration
│   └── index.js                # Entry point
│
└── start_app.bat               # Automated startup script (Windows)
```

---

## 📱 Mobile PWA Installation

MindWave is fully optimized for mobile with a native app-like experience.

Navigate to your local IP (e.g., `http://192.168.1.5:5173`) on your mobile browser.
- **Android:** "Install App" from the Chrome menu.
- **iOS:** "Add to Home Screen" from the Safari share sheet.

**Mobile UX highlights:**
- 8-item bottom nav bar — compact icon + label layout fits all phones including 360px screens
- Centered modal animations for Goals, Activity, Delete, and AI Chat
- `dvh`-based heights for correct sizing with collapsible browser chrome on iOS/Android
- Safe-area padding for notch/home-bar devices (iPhone X+)
- Responsive 2-column grids on small screens, expanding to 4 on desktop
- Touch-friendly tap targets with `active:scale` haptic feedback
- iOS input zoom prevention (16px base font on all inputs)

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
- [x] Mobile UI optimization (safe area, bottom nav, responsive grids)
- [x] Mobile-safe timer completion notifications (ServiceWorker API)
- [x] Interactive Productivity Target Sliders
- [x] Dashboard Quick Action Strip (Mobile UX)
- [x] **Financial OS (Bento Grid Expense Tracker)**
- [x] Shared Goals & Collaboration features
- [x] **Expense Tracker Mobile View** (glass-card system, FAB, responsive charts)
- [x] **Compact 8-item Bottom Nav** with scrollable strip
- [x] **dvh-based modal heights** for iOS/Android browser chrome
- [x] **Reverted to classic centered modal UX** for Goals, Activity, AI Chat
- [x] Backend-driven Push Notifications (Web Push API)
- [x] Integration with External Calendars (Google/Outlook)
- [ ] **Library & Reading Tracker** (Bookshelf, Progress, AI Summaries)
- [ ] **Advanced Data Visualizations** (Year-in-Review, Custom Dashboards)
- [ ] **Offline First Mode** (Local caching, Background Sync)

---

## 📋 Changelog

For a full history of updates, please see the [CHANGELOG.md](./CHANGELOG.md) file.

---

## 🛠 Repository Management

To keep the repository clean and secure, follow these guidelines:

### ✅ Files to COMMIT
- **Source Code**: `client/src/`, `server/` (controllers, models, routes, etc.)
- **Project Icons & Assets**: `client/public/`
- **Configuration**: `package.json`, `package-lock.json`, `vite.config.js`, `tailwind.config.js`, `vercel.json`, `.gitignore`
- **Documentation**: `README.md`, `RAG_IMPLEMENTATION.md`

### 🚫 Files to IGNORE
- **Sensitive Info**: `.env` (Never push API keys or Database URIs)
- **Dependencies**: `node_modules/` (Always re-install via `npm install`)
- **Build Artifacts**: `client/dist/`, `server/dist/`
- **Logs & Temp**: `*.log`, `*.txt`, `*_crash.json`, `test_*.js`

---

## 📄 License

MIT — feel free to fork and customize your own Life OS.
