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

### 💰 Financial OS (Expense Tracker)
- **Bento Grid Dashboard** — a world-class financial command center featuring modular cards for balance tracking, spending analytics, and category distribution.
- **Smart Categorization** — dynamic, type-aware selection logic that filters categories based on Income vs. Expense; includes full localized **INR (₹)** support.
- **Threshold Monitoring** — set monthly budget limits per category with real-time progress tracking and "safe vs. over-limit" visual alerts.
- **Spending Analytics** — high-fidelity weekly and monthly trends visualization with adaptive bar charts and category distribution donut charts.
- **Data Portability** — export your full transaction history to **CSV** for secondary analysis.

### 🧘 Focus & Zen
- **Pomodoro-style Timer** — built-in countdown with quick-select presets (5m, 15m, 25m, 50m) and custom hour/minute/second picker to help you stay in flow state.
- **Smart Ambient Soundscapes** — curated royalty-free audio tracks that automatically play when the timer starts and pause when it stops.
- **Custom Native Notifications** — no external MP3s needed! Procedural chimes and beeps are generated directly using the browser's native Web Audio API for session completion alerts.
- **Mobile-Safe Completion Alerts** — timer completion uses `ServiceWorkerRegistration.showNotification()` on Android (avoids the `Notification` constructor restriction) combined with the custom audio chimes.

### 🔔 Proactive Systems
- **Smart Notification Bell** — real-time alerts for overdue milestones, habits at risk of losing streaks, and daily reminders.
- **Global Semantic Search** — one search bar to find anything across goals, habits, and journals. Includes **vector-search** for content *inside* your uploaded PDFs.

### 📊 Personalized Productivity & Quick Actions
- **Interactive Productivity Targets** — set your own daily/weekly goals (0–100%) via a high-performance range slider on the dashboard. The system automatically recalculates your progress rings relative to your personal baseline.
- **Horizontal Quick Action Slider** — a touch-optimized scrolling strip for mobile that provides one-tap access to your most-used tools: *Log Habit, AI Chat, New Goal, Journal,* and *Focus Timer*.
- **Dynamic 7-Day Activity Chart** — a glow-accented bar chart visualizing habit completion rates with live status indicators and historical averages.

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
│   │   ├── pages/              # Goals, Habits, Journal, Chat, Focus, Profile, Expenses
│   │   ├── context/            # Auth, Theme
│   │   └── lib/                # Axios, utils
│   └── public/                 # PWA icons & manifest
│
├── server/                     # Node.js Backend (Express)
│   ├── models/                 # User, Goal, Habit, Journal, VectorChunk, Expense, Budget
│   ├── routes/                 # Auth, Chat (Tool & RAG), Search, Goals, Habits, Expenses
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
- **Financial Bento Grid** adapts to a vertical stream with priority card stacks

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
- [x] Interactive Productivity Target Sliders
- [x] Dashboard Quick Action Strip (Mobile UX)
- [x] **Financial OS (Bento Grid Expense Tracker)**
- [x] Shared Goals & Collaboration features
- [ ] Backend-driven Push Notifications (Web Push API)
- [ ] Integration with External Calendars (Google/Outlook)

---

## 📋 Changelog

### April 18, 2026 — Shared Goals & Collaboration
- 🤝 **Collaborative Goal Tracking** — Added the ability to share goals with colleagues and friends via email. Goal owners can invite collaborators, and all participants can update milestones, track progress, and log activities in real-time.

### April 16, 2026 — Layout Resiliency & Local Dev Polish
- 🛡️ **Scroll-Proof Modal Architecture** — completely refactored the Add Transaction modal layering on desktop to use strict flex-based centering, ensuring perfect responsiveness regardless of deep page scrolling or Framer Motion animation conflicts.
- ⚙️ **Dynamic Port Binding** — updated backend CORS logic to intelligently whitelist wildcard local ports, resolving blocked requests during aggressive Vite dev-server auto-incrementing.

### April 15, 2026 — Premium Financial UI & Interaction Polish
- 💎 **Premium Button Systems** — upgraded all primary action buttons in the Financial OS with a custom Indigo-vibe theme, consistent iconography, and glassmorphism-inspired "shine" animations for a high-end feel.
- 📱 **Mobile FAB Optimization** — implemented a high-visibility, glow-enhanced Floating Action Button (FAB) for financial logging on mobile, providing a superior touch experience.
- ✨ **Responsive Action States** — header primary actions now intelligently collapse on small screens into a compact "New" action, maintaining accessibility while optimizing screen real estate.

### April 13, 2026 — Financial UI Refinement & Analytical Stability
- 📈 **Weekly Spending Trends** — overhauled the bar chart logic to provide a consistent 5-week breakdown for any selected month, resolving issues where past monthly data was invisible.
- 🏷️ **Smart Categorization UI** — implemented dynamic category filtering in the transaction modal; users now only see relevant categories based on whether they are logging Income or Expenses.
- 🔍 **Safe Analytical Search** — hardened the global expense filtering with null-safe note searching to prevent UI crashes on incomplete historical records.
- 💎 **UX Polish** — standardized transaction editing nomenclature and refined modal interaction states for a more tactile financial experience.

### April 12, 2026 — Financial OS & Bento Grid Redesign
- 💎 **Bento Grid Architecture** — completely redesigned the Expense Tracker module into a modular Bento Grid system for high-density financial overview.
- 🇮🇳 **INR Localization** — standardized entire financial suite to **Indian Rupee (₹)** with `en-IN` formatting.
- 📊 **Dynamic Analytics** — implemented new donut-style category distribution charts and surgical bar charts for spending history.
- 🎯 **Budget Thresholds** — added category-specific budget limits with real-time progress indicators and over-limit visual alerts.
- 💾 **CSV Export** — added full data portability to the financial module.

### April 10, 2026 — Productivity Logic & Dashboard UX
- 📈 **Personalized Productivity Targets** — users can now set custom productivity targets (0–100%) directly from the dashboard via an interactive range slider.
- ⚡ **Dashboard Quick Actions** — added a horizontal action slider for one-tap navigation to core features.

---

## 🛠 Repository Management

To keep the repository clean and secure, follow these guidelines:

### ✅ Files to COMMIT
*   **Source Code**: `client/src/`, `server/` (controllers, models, routes, etc.)
*   **Project Icons & Assets**: `client/public/`
*   **Configuration**: `package.json`, `package-lock.json`, `vite.config.js`, `tailwind.config.js`, `vercel.json`, `.gitignore`.
*   **Documentation**: `README.md`, `RAG_IMPLEMENTATION.md`.

### 🚫 Files to IGNORE
*   **Sensitive Info**: `.env` (Never push API keys or Database URIs).
*   **Dependencies**: `node_modules/` (Always re-install via `npm install`).
*   **Build Artifacts**: `client/dist/`, `server/dist/`.
*   **Logs & Temp**: `*.log`, `*.txt`, `*_crash.json`, `test_*.js`.

---

## 📄 License

MIT — feel free to fork and customize your own Life OS.
